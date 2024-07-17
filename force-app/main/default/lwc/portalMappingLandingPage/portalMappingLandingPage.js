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
    @track originalMappingData = [];
    @track fieldWrapperList = [];
    @track finalList = [];
    @track MainListingOptions = [];
    @track isDataChanged = false;
    @track isRecordAvailable = true;
    @track isSpinner = true;

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
        this.isSpinner = true;
        try {
            getObjectFields({ portalName: this.portalGen })
                .then(data => {
                    console.log('data--->', data);
                    if (data[0].portalMetadataRecords.length > 0) {
                        this.MainListingOptions = data[0].listingFields;
                        this.processFieldWrapperData(data);
                    } else {
                        this.isRecordAvailable = false;
                        this.isSpinner = false;
                    }

                })
                .catch(error => {
                    this.isSpinner = false;
                    console.error('Error fetching Listing field data', error);
                });
        } catch (error) {
            this.isSpinner = false;
            console.log('error--> ',error);
        }
        
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
                field => !portalMetadataRecords.some(record => record.MVEX__Listing_Field_API_Name__c === field.apiName)
            );
    
            portalMetadataRecords.forEach(record => {

                const finalFilteredFields = filteredFields.filter(field => {
                    switch (record.MVEX__Allowed_Field_Datatype__c) {
                        case 'String':
                            return ['REFERENCE', 'TEXTAREA', 'STRING', 'URL', 'MULTIPICKLIST', 'PICKLIST'].includes(field.dataType);
                        case 'Integer':
                            return ['INTEGER', 'DOUBLE'].includes(field.dataType);
                        case 'Date':
                            return ['DATE', 'DATETIME', 'TIME'].includes(field.dataType);
                        case 'Boolean':
                            return field.dataType === 'BOOLEAN';
                        case 'Email':
                            return field.dataType === 'EMAIL';
                        case 'Phone':
                            return field.dataType === 'PHONE';
                        case 'Currency':
                            return field.dataType === 'CURRENCY';
                        default:
                            return true;
                    }
                });
    
                const additionalOptions = finalFilteredFields.map(field => ({
                    label: field.label,
                    value: field.apiName
                }));
    
                const finalList = {
                    id: record.Id,
                    portalLabel: record.Name,
                    description: record.MVEX__Portal_Field_Description__c,
                    example: record.MVEX__Portal_Field_Example__c,
                    listingFieldAPIName: record.MVEX__Listing_Field_API_Name__c ? record.MVEX__Listing_Field_API_Name__c : '',
                    isRequired: record.MVEX__Required__c,
                    dataType: record.MVEX__Allowed_Field_Datatype__c,
                    listingFields: [
                        { label: 'None', value: '' },
                        ...(record.MVEX__Listing_Field_API_Name__c ? [{ label: this.getListingLabel(record.MVEX__Listing_Field_API_Name__c), value: record.MVEX__Listing_Field_API_Name__c }] : []),
                        ...additionalOptions
                    ]
                };
    
                this.finalList = [...this.finalList, finalList];
            });
    
            console.log('this.finalList-->', JSON.stringify(this.finalList));
        });

        this.originalMappingData = this.finalList;
        this.isSpinner = false;
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
    * Method Name: handleBack
    * @description: Used to navigate back to Portal Mapping main page.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleBack(event) {
        try {
            event.preventDefault();
            let componentDef = {
                componentDef: "MVEX:portalMappingComponent",
            };
            let encodedComponentDef = btoa(JSON.stringify(componentDef));
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/one/one.app#' + encodedComponentDef
                }
            });
        } catch (error) {
            console.log('error--> ',error);
        }
    }

    /**
    * Method Name: handleSave
    * @description: Used to save custom metadata records.
    * Date: 04/06/2024
    * Created By: Karan Singh
    * Last Update Date : 06/06/2024
    * Updated By : Karan Singh
    * Change Description : Changed the variable name from masterLabel to portalLabel and passed the id to apex class instead of masterLabel.
    **/
    handleSave() {
        try {
            this.isSpinner = true;
            if (this.isDataChanged) {
                let isValid = true;
                let errorMessage = 'Please fill all required fields:';
    
                this.finalList.forEach((record) => {
                    if (record.isRequired && !record.listingFieldAPIName) {
                        isValid = false;
                        errorMessage += ` ${record.portalLabel},`;
                    }
                });
    
                if (!isValid) {
                    this.showToast('Error', errorMessage.slice(0, -1), 'error');
                    this.isSpinner = false;
                    return;
                }
    
                const changedFields = this.finalList.filter((record, index) => {
                    return record.listingFieldAPIName !== this.originalMappingData[index].listingFieldAPIName;
                }).map(record => ({
                    Id: record.id,
                    MVEX__Listing_Field_API_Name__c: record.listingFieldAPIName
                }));

                const jsonList = {};
                this.finalList.forEach(record => {
                    if (record.listingFieldAPIName) {
                        jsonList[record.listingFieldAPIName] = record.portalLabel;
                    }
                });
    
                console.log('jsonList-->', JSON.stringify(jsonList));
                
                if (changedFields.length > 0) {
                    saveChangedFields({ changedFields, jsonList: JSON.stringify(jsonList), portalName: this.portalGen })
                        .then(() => {
                            console.log('Changes saved successfully');
                            this.showToast('Success', 'Record saved successfully', 'success');
                            this.isDataChanged = false;
                            this.getListingFields();
                        })
                        .catch(error => {
                            this.isSpinner = false;
                            console.error('Error saving changes:', error);
                            this.showToast('Error', 'Failed to save record', 'error');
                        });
                }
            } else {
                this.isSpinner = false;
            }
        } catch (error) {
            this.isSpinner = false;
            console.log('error--> ',error);
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
    * Method Name: handleComboboxChange
    * @description: Used to update the combobox list of each mapping.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleComboboxChange(event) {
        try {
            const selectedIndex = event.currentTarget.dataset.index;
            const selectedValue = event.detail.value;
            const dataType = event.currentTarget.dataset.datatype;
            this.isDataChanged = true;
            console.log('selectedValue-->', selectedValue);
            console.log('dataType-->', dataType);
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
                    if (index !== parseInt(selectedIndex, 10) && pair.dataType === dataType) {
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
        try {
            this.isSpinner = true;
            var btnName = event.target.dataset.name;
            portalAction({ portalId: this.portalId, actionName: btnName })
                .then(result => {
                    this.isSpinner = false;
                    console.log('Result--> ', result);
                    if (result == 'deactivated') {
                        this.showToast('Success', 'The portal has been successfully deactivated.', 'success');
                        this.portalStatus = 'false';
                    } else if (result == 'activated') {
                        this.showToast('Success', 'The portal has been successfully activated.', 'success');
                        this.portalStatus = 'true';
                    } else if (result == 'deleted') {
                        this.showToast('Success', 'The portal has been successfully deleted.', 'success');
                        let componentDef = {
                            componentDef: "MVEX:portalMappingComponent",
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
                    this.isSpinner = false;
                    console.error('Error saving changes:', error);
                    this.showToast('Error', 'Failed to save record', 'error');
                });
        } catch (error) {
            this.isSpinner = false;
            console.log('error-->', error);
        }
    }
}