import { LightningElement, track, api } from 'lwc';
import getObjectFields from '@salesforce/apex/PortalMappingController.getObjectFields';
import saveChangedFields from '@salesforce/apex/PortalMappingController.saveChangedFields';
import portalAction from '@salesforce/apex/PortalMappingController.portalAction';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class PortalMappingLandingPage extends NavigationMixin(LightningElement) {

    @api portalId;
    @api portalGen;
    @api portalName;
    @api portalIconUrl;
    @api portalStatus;
    @track isInitalRender = true;
    @track showModal = false;
    @track originalMappingData = [];
    @track fieldWrapperList = [];
    @track finalList = [];
    @track MainListingOptions = [];
    @track isDataChanged = false;
    @track isRecordAvailable = true;

    /**
    * Method Name: connectedCallback
    * @description: Used to call getListingFields method.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        this.getListingFields();
    }

    /**
    * Method Name: renderedCallback
    * @description: Used to overwrite standard css.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    renderedCallback() {
        try {
            if (this.isInitalRender) {
                const body = document.querySelector("body");

                const style = document.createElement('style');
                style.innerText = `
                    .portalMapping_data-row .slds-form-element__label:empty {
                        margin: 0;
                        display: none;
                    }

                    .view_input .slds-form-element__icon {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding-top: 0.5rem;
                    }

                    .slds-col abbr {
                        cursor: help;
                        display: none;
                    }

                    .slds-col  .slds-form-element__label {
                        display: none;
                    }
                `;

                body.appendChild(style);
                this.isInitalRender = false;
            }
        } catch (error) {
            console.log(' error in render : ', error.messsage);

        }
    }

    /**
    * Method Name: activeInactive
    * @description: Used to change the status as per portalStatus value.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    get activeInactive(){
        return this.portalStatus == 'true' ? true : false;
    }

    /**
    * Method Name: getListingFields
    * @description: Used to get all custom metadata, blocked fields and Listing object fields values.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    getListingFields() {
        getObjectFields({ portalName: this.portalGen })
            .then(data => {
                console.log('data--->', data);
                if (data[0].portalMetadataRecords.length > 0) {
                    this.MainListingOptions = data[0].listingFields;
                    this.processFieldWrapperData(data);
                } else {
                    this.isRecordAvailable = false;
                }

            })
            .catch(error => {
                console.error('Error fetching Listing field data', error);
            });
    }

    /**
    * Method Name: processFieldWrapperData
    * @description: Used to prepare list of all fields mapping to show in html.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    processFieldWrapperData(fieldWrapperList) {
        fieldWrapperList.forEach(fieldWrapper => {
            const { portalMetadataRecords, blockfields, listingFields } = fieldWrapper;

            const blockfieldsSet = new Set(blockfields);

            const filteredListingFields = listingFields.filter(
                field => !blockfieldsSet.has(field.apiName)
            );

            const filteredFields = filteredListingFields.filter(
                field => !portalMetadataRecords.some(record => record.Listing_Field_API_Name__c === field.apiName)
            );

            const additionalOptions = filteredFields.map(field => ({
                label: field.label,
                value: field.apiName
            }));

            const finalList = portalMetadataRecords.map(record => ({
                masterLabel: record.MasterLabel,
                description: record.Portal_Field_Description__c,
                example: record.Portal_Field_Example__c,
                listingFieldAPIName: record.Listing_Field_API_Name__c ? record.Listing_Field_API_Name__c : '',
                isRequired: record.Required__c,
                listingFields: [
                    { label: 'None', value: '' },
                    ...(record.Listing_Field_API_Name__c ? [{ label: this.getListingLabel(record.Listing_Field_API_Name__c), value: record.Listing_Field_API_Name__c }] : []),
                    ...additionalOptions
                ]

            }));

            this.finalList = [...this.finalList, ...finalList];

            console.log('this.finalList-->', JSON.stringify(this.finalList));
        });

        this.originalMappingData = this.finalList;
    }

    /**
    * Method Name: getListingLabel
    * @description: Used to return Listing field label by getting the field api name.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    getListingLabel(listingFieldValue) {
        const listingOption = this.MainListingOptions.find(option => option.apiName === listingFieldValue);
        return listingOption ? listingOption.label : '';
    }

    /**
    * Method Name: handleHidePopup
    * @description: Used to close the settingPopUp modal.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleHidePopup(event) {
        this.showModal = event.details;
    }

    /**
    * Method Name: handleBack
    * @description: Used to navigate back to Portal Mapping main page.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleBack(event) {
        event.preventDefault();
        let componentDef = {
            componentDef: "c:portalMappingComponent",
        };
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    /**
    * Method Name: handleSave
    * @description: Used to save custom metadata records.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleSave() {
        if (this.isDataChanged) {
            let isValid = true;
            let errorMessage = 'Please fill all required fields:';

            this.finalList.forEach((record) => {
                if (record.isRequired && !record.listingFieldAPIName) {
                    isValid = false;
                    errorMessage += ` ${record.masterLabel},`;
                }
            });

            if (!isValid) {
                this.showToast('Error', errorMessage.slice(0, -1), 'error');
                return;
            }

            const changedFields = this.finalList.filter((record, index) => {
                return record.listingFieldAPIName !== this.originalMappingData[index].listingFieldAPIName;
            }).map(record => ({
                MasterLabel: record.masterLabel,
                Listing_Field_API_Name__c: record.listingFieldAPIName
            }));

            if (changedFields.length > 0) {
                saveChangedFields({ changedFields })
                    .then(() => {
                        console.log('Changes saved successfully');
                        this.showToast('Success', 'Record saved successfully', 'success');
                        this.isDataChanged = false;
                        setTimeout(() => {
                            this.getListingFields();
                        }, 1500);
                    })
                    .catch(error => {
                        console.error('Error saving changes:', error);
                        this.showToast('Error', 'Failed to save record', 'error');
                    });
            }
        }
    }

    /**
    * Method Name: showToast
    * @description: Used to show toast message.
    * @param: title - title of toast message.
    * @param: mesaage - message to show in toast message.
    * @param: variant- type of toast message.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    /**
    * Method Name: handleHidePopup
    * @description: Used to open the settingPopUp modal.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleSetting() {
        this.showModal = true;
    }

    /**
    * Method Name: handleComboboxChange
    * @description: Used to update the combobox list of each mapping.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleComboboxChange(event) {
        try {
            const selectedIndex = event.target.dataset.index;
            const selectedValue = event.detail.value;
            this.isDataChanged = true;
            console.log('selectedValue-->', selectedValue);
            if (selectedValue == '') {
                let previousValue;
                this.finalList = this.finalList.map((pair, index) => {
                    if (index === parseInt(selectedIndex, 10)) {
                        previousValue = pair.listingFieldAPIName;
                        return { ...pair, listingFieldAPIName: selectedValue };
                    }
                    return pair;
                });

                if (previousValue != '') {
                    this.finalList.forEach((pair, index) => {
                        if (index !== parseInt(selectedIndex, 10)) {
                            const customOptions = [...pair.listingFields, { label: this.getListingLabel(previousValue), value: previousValue }];
                            pair.listingFields = customOptions;
                        }
                    });
                }

            } else {
                let previousValue;
                this.finalList = this.finalList.map((pair, index) => {
                    if (index === parseInt(selectedIndex, 10)) {
                        previousValue = pair.listingFieldAPIName;
                        return { ...pair, listingFieldAPIName: selectedValue };
                    }
                    return pair;
                });
                this.finalList.forEach((pair, index) => {
                    if (index !== parseInt(selectedIndex, 10)) {
                        var customOptions = pair.listingFields.filter(option => option.value !== selectedValue);
                        if (previousValue != '') {
                            customOptions = customOptions.concat({ label: this.getListingLabel(previousValue), value: previousValue });
                        }
                        pair.listingFields = customOptions;
                    }
                });
            }
        } catch (error) {
            console.log('error-->', error);
        }
        this.saveBtnDisable = false;
    }

    /**
    * Method Name: revertTheChanges
    * @description: Used to revert back to the previous changes.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    revertTheChanges() {
        if (this.isDataChanged) {
            this.finalList = this.originalMappingData;
            this.isDataChanged = false;   
        }
    }

    /**
    * Method Name: currentPortalAction
    * @description: Used to change the active status and deleting the portal record by making apex callout.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    currentPortalAction(event) {
        var btnName = event.target.dataset.name;
        portalAction({ portalId: this.portalId, actionName: btnName })
            .then(result => {
                console.log('Result--> ', result);
                this.showToast('Success', 'Changes has been saved successfully', 'success');
                if (result == 'deactivated') {
                    this.portalStatus = 'false';
                } else if (result == 'activated') {
                    this.portalStatus = 'true';
                } else if (result == 'deleted') {
                    let componentDef = {
                        componentDef: "c:portalMappingComponent",
                    };
                    let encodedComponentDef = btoa(JSON.stringify(componentDef));
                    this[NavigationMixin.Navigate]({
                        type: 'standard__webPage',
                        attributes: {
                            url: '/one/one.app#' + encodedComponentDef
                        }
                    });
                } else {
                    console.log(result);
                }
            })
            .catch(error => {
                console.error('Error saving changes:', error);
                this.showToast('Error', 'Failed to save record', 'error');
            });
    }
}