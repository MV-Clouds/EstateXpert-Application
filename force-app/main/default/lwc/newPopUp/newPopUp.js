import { LightningElement, api, track } from 'lwc';
import getAllCustomFields from '@salesforce/apex/PortalMappingController.getAllCustomFields';
import savePropertyPortalRecord from '@salesforce/apex/PortalMappingController.savePropertyPortalRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NewPopUp extends LightningElement {
    @api getPortalName;
    @api getPortalIconUrl;
    @track isInitalRender = true;
    @track isSaveBtn = true;
    @track pickListOptionsFields = [];
    @track fields = [];

    /**
    * Method Name: connectedCallback
    * @description: Used to call the setFieldsInHTMLView method.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        this.setFieldsInHTMLView();
    }

    /**
    * Method Name: renderedCallback
    * @description: Used to render the component.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    renderedCallback() {
        if (this.isInitalRender) {
            const body = document.querySelector("body");
            const style = document.createElement('style');
            style.innerText = `
                .label_css lightning-helptext .slds-form-element__icon {
                    display: inline-block;
                    position: relative;
                    padding-top: unset;
                    vertical-align: top;
                    line-height: var(--lwc-lineHeightReset, 1);
                    z-index: 1;
                    top: -5px;
                }

                .width_css .slds-form-element div .slds-form-element__label:empty {
                    margin: 0;
                    display: none;
                }

                .width_css .slds-form-element div {
                    width: -webkit-fill-available;
                }
            `;
            body.appendChild(style);
            this.isInitalRender = false;
        }
    }

    /**
    * Method Name: setFieldsInHTMLView
    * @description: Used to set the fields in the HTML view.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    setFieldsInHTMLView() {
        getAllCustomFields()
            .then(result => {
                console.log('result-->', result);
                this.pickListOptionsFields = result;
                this.updateFields();
            })
            .catch(error => {
                console.log(error);
            });
    }

    /**
    * Method Name: updateFields
    * @description: Used to update the fields.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    updateFields() {
        const commonFields = [
            { id: 1, fieldName: 'Selected Portal', fieldAPIName: 'portal_key', datatype: 'none', value: this.getPortalName, isRequired: false, placeHolder: this.getPortalName, helpText: '', isFirst: true, isPicklist: false },
            { id: 2, fieldName: 'Title', fieldAPIName: 'name', datatype: 'text', value: '', isRequired: true, placeHolder: this.getPortalName, helpText: 'Define a characteristic title for the portal.', isFirst: false, isPicklist: false },
        ];

        if (this.getPortalName === 'Zoopla') {
            this.fields = [
                ...commonFields,
                { id: 4, fieldName: 'Certificate Name', fieldAPIName: 'certificate', datatype: 'text', value: '', isRequired: true, placeHolder: 'zoopla_certificate', helpText: 'Name of the certificate uploaded in Salesforce.', isFirst: false, isPicklist: false },
                { id: 5, fieldName: 'Branch Reference', fieldAPIName: 'branch_reference', datatype: 'text', value: '', isRequired: true, placeHolder: '"1234";"kd-789d"', helpText: 'Your unique identifier for the branch.', isFirst: false, isPicklist: false },
                { id: 6, fieldName: 'Branch Name', fieldAPIName: 'branch_name', datatype: 'text', value: '', isRequired: true, placeHolder: '"Estate Agent Ltd - Shepherd Bush"', helpText: 'The name of the branch. This is usually the name of the company and may also include some location information in order to differentiate it from the other branches of the company.', isFirst: false, isPicklist: false },
                { id: 7, fieldName: 'Street Name', fieldAPIName: 'street_name', datatype: 'text', value: '', isRequired: true, placeHolder: '"Barker Road";"Chestnut Street"', helpText: 'The name of the road on which the branch is principally adjacent.', isFirst: false, isPicklist: false },
                { id: 8, fieldName: 'Town or City', fieldAPIName: 'town_or_city', datatype: 'text', value: '', isRequired: true, placeHolder: '"Birmingham";"San Francisco"', helpText: 'The nearest large urban area to the branch.', isFirst: false, isPicklist: false },
                { id: 9, fieldName: 'Postal Code', fieldAPIName: 'postal_code', datatype: 'text', value: '', isRequired: true, placeHolder: '"B19 4JY";"94112"', helpText: 'The postal area code issued by the primary postal service in the country. For example, for the UK, this would be Royal Mails postcode; for the US, the United States Postal Services ZIP code.', isFirst: false, isPicklist: false },
                { id: 10, fieldName: 'Country Code', fieldAPIName: 'country_code', datatype: 'text', value: '', isRequired: true, placeHolder: '"GB";"US"', helpText: 'The ISO 3166-2 (preferred) or ISO 3166-1 alpha-2 country code.', isFirst: false, isPicklist: false },
                { id: 11, fieldName: 'Locality', fieldAPIName: 'locality', datatype: 'text', value: '', isRequired: false, placeHolder: '"Sutton Coldfield";"North Beach"', helpText: 'The familiar name of the area as it is referred to by local residents. This is usually a traditional, historic name and may refer to an aspect of the area which has ceased to exist.', isFirst: false, isPicklist: false },
                { id: 12, fieldName: 'County', fieldAPIName: 'county', datatype: 'text', value: '', isRequired: false, placeHolder: '"West Midlands";"California"', helpText: 'The largest territorial area division within the country which the property resides in. (Synonymous with e.g.: province; principality.)', isFirst: false, isPicklist: false },
                { id: 13, fieldName: 'Latitude', fieldAPIName: 'latitude', datatype: 'number', value: '', isRequired: false, placeHolder: '-90.0000000;54.123456;90.000000', helpText: 'The latitude, measured in degrees, of the branch.', isFirst: false, isPicklist: false },
                { id: 14, fieldName: 'Longitude', fieldAPIName: 'longitude', datatype: 'number', value: '', isRequired: false, placeHolder: '-90.0000000;54.123456;90.000000', helpText: 'The longitude, measured in degrees, of the branch.', isFirst: false, isPicklist: false },
                { id: 15, fieldName: 'Address Key', fieldAPIName: 'address_key', datatype: 'text', value: '', isRequired: false, placeHolder: '"02341509', helpText: 'The 8-digit Postcode Address File (PAF) Address Key.', isFirst: false, isPicklist: false },
                { id: 16, fieldName: 'Organisation Key', fieldAPIName: 'organisation_key', datatype: 'text', value: '', isRequired: false, placeHolder: '"0000000";"0001150"', helpText: 'The 8-digit Postcode Address File (PAF) Organisation Key.', isFirst: false, isPicklist: false },
                { id: 17, fieldName: 'Postcode Type', fieldAPIName: 'postcode_type', datatype: 'text', value: '', isRequired: false, placeHolder: '"L";"S"', helpText: 'The Postcode Address File (PAF) Postcode Type.', isFirst: false, isPicklist: false },
                { id: 18, fieldName: 'PAF UDPRN', fieldAPIName: 'paf_udprn', datatype: 'text', value: '', isRequired: false, placeHolder: '"00001234"', helpText: 'Royal Mails Unique Delivery Point Reference Number (UDPRN).', isFirst: false, isPicklist: false },
                { id: 19, fieldName: 'Telephone', fieldAPIName: 'telephone', datatype: 'text', value: '', isRequired: false, placeHolder: '"020232424433";"+1 246-123-4562"', helpText: 'Telephone number.', isFirst: false, isPicklist: false },
                { id: 20, fieldName: 'Email', fieldAPIName: 'email', datatype: 'email', value: '', isRequired: false, placeHolder: '"test@rk.com"', helpText: 'Email address.', isFirst: false, isPicklist: false },
                { id: 21, fieldName: 'Website', fieldAPIName: 'website', datatype: 'text', value: '', isRequired: false, placeHolder: '"http://www.estateagent.co.uk"', helpText: 'The URI-encoded URL for the branchs website, or that of its parent company if it doesnt have one of its own.', isFirst: false, isPicklist: false },
                { id: 22, fieldName: 'Test Portal', fieldAPIName: 'is_test_portal', datatype: 'text', value: '', isRequired: true, placeHolder: 'true/false', helpText: 'If set to true feeds will be exported to the Zoopla sandbox.', isFirst: false, isPicklist: false },
                { id: 23, fieldName: 'Feed Selector Field', fieldAPIName: 'differentiator_values', datatype: 'picklist', value: '', isRequired: true, placeHolder: 'Select a field', helpText: 'Define a field that separates different portal feeds.', isFirst: false, picklistOptions: this.pickListOptionsFields , isPicklist: true}
            ];
        } else if (this.getPortalName === 'Rightmove') {
            this.fields = [
                ...commonFields,
                { id: 4, fieldName: 'Certificate Name', fieldAPIName: 'certificate', datatype: 'text', value: '', isRequired: true, placeHolder: 'rightmove_certificate', helpText: 'Name of the certificate uploaded in Salesforce.', isFirst: false, isPicklist: false },
                { id: 5, fieldName: 'Network ID', fieldAPIName: 'network.network_id', datatype: 'number', value: '', isRequired: true, placeHolder: '12345', helpText: 'Network Id provided by Rightmove.', isFirst: false },
                { id: 6, fieldName: 'Branch ID', fieldAPIName: 'branch.branch_id', datatype: 'number', value: '', isRequired: true, placeHolder: '67890', helpText: 'Unique Rightmove reference for this branch.', isFirst: false },
                { id: 7, fieldName: 'Use Sandbox', fieldAPIName: 'is_test_portal', datatype: 'text', value: '', isRequired: true, placeHolder: 'true/false', helpText: 'If set to true feeds will be exported to the Rightmove sandbox.', isFirst: false },
            ];
        } else {
            this.fields = [
                ...commonFields
            ];
        }
    }

    /**
    * Method Name: getTheFieldValue
    * @description: Used to get the fields value and set it to corresponding variables.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    getTheFieldValue(event) {
        try {
            console.log('inside the getTheFieldValue');
            const fieldName = event.target.dataset.field;
            const value = event.target.value;

            this.fields = this.fields.map(field => {
                if (field.fieldName === fieldName) {
                    return { ...field, value: value };
                }
                return field;
            });
            console.log();
            this.validateFields();
        } catch (error) {
            console.log('error--> ',error);
        }
        
    }

    /**
    * Method Name: validateFields
    * @description: Used to validate the fields.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    validateFields() {
        let allRequiredFieldsFilled = true;
        this.fields.forEach(field => {
            if (field.isRequired && !field.value) {
                allRequiredFieldsFilled = false;
            }
        });
        this.isSaveBtn = !allRequiredFieldsFilled;
    }

    /**
    * Method Name: savePortalRecord
    * @description: Used to save the portal record.
    * Created Date: 04/06/2024
    * Last Modified Date: 15/07/2024
    * Created By: Karan Singh
    * Last Modified By: Karan Singh
    **/
    savePortalRecord() {
        let validationError = false;
        let fieldValues = {};

        this.fields.forEach(field => {
            if (field.isRequired && !field.value) {
                this.showToast('Error', `Required field ${field.fieldName} is empty. Please fill the required field.`, 'error');
                validationError = true;
            }
            fieldValues[field.fieldAPIName] = field.value;
        });

        if (!validationError) {
            const portalWrapper = {
                version: '1.2',
                portalname: this.getPortalName,
                getPortalIconUrl: this.getPortalIconUrl,
                ...fieldValues
            };

            console.log('portalWrapper-->',JSON.stringify(portalWrapper));
            savePropertyPortalRecord({ portalWrapper: JSON.stringify(portalWrapper), portalName: this.getPortalName })
                .then(result => {
                    console.log('result-->', result);
                    if(result === 'success') {
                        this.showToast('Success', 'Record is created successfully.', 'success');
                        let custEvent = new CustomEvent('refreshpageonhide', {
                            details: false
                        });
                        this.dispatchEvent(custEvent);
                    } else {
                        this.showToast('Error', result, 'error');
                    }
                })
                .catch(error => {
                    console.log('error ==> ', error);
                    this.showToast('Error', 'Failed to create Portal record.', 'error');
                });
        }
    }

    /**
    * Method Name: handleDialogueClose
    * @description: Used to call parent lwc component method.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleDialogueClose() {
        let custEvent = new CustomEvent('hidepopup', {
            details: false
        });
        this.dispatchEvent(custEvent);
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
    * Method Name: handleChange
    * @description: Used to handle the change in the picklist.
    * @param: event - event object.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleChange(event) {
        const fieldIndex = event.target.dataset.index;
        const selectedValue = event.detail.value;
        this.fields[fieldIndex].value = selectedValue;
        console.log('Selected value:', selectedValue);
        this.validateFields();
    }
}