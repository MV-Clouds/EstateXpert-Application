import { LightningElement, track, api } from 'lwc';
import getObjectFields from '@salesforce/apex/PortalMappingController.getObjectFields';
import saveChangedFields from '@salesforce/apex/PortalMappingController.saveChangedFields';
import portalAction from '@salesforce/apex/PortalMappingController.portalAction';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class PortalMappingLandingPage extends NavigationMixin(LightningElement) {

    isInitalRender = true;
    @api portalId;
    @api portalGen;
    @api portalName;
    @api portalIconUrl;
    @api portalStatus;

    showModal;

    @track originalMappingData = [];
    @track fieldWrapperList = [];
    @track finalList = [];
    @track MainListingOptions = [];
    isDataChanged = false;
    isRecordAvailable = true;

    connectedCallback() {
        this.getListingFields();
    }

    get activeInactive(){
        return this.portalStatus == 'true' ? true : false;
    }

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

    getListingLabel(listingFieldValue) {
        const listingOption = this.MainListingOptions.find(option => option.apiName === listingFieldValue);
        return listingOption ? listingOption.label : '';
    }

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

    handlehidepopup(event) {
        this.showModal = event.details;
    }

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

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    handleSetting() {
        this.showModal = true;
    }

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

    revertTheChanges() {
        if (this.isDataChanged) {
            this.finalList = this.originalMappingData;
            this.isDataChanged = false;   
        }
    }

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