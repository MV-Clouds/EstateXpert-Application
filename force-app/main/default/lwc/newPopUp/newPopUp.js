import { LightningElement, api, track } from 'lwc';
import savePropertyPortalRecord from '@salesforce/apex/controlCenterController.savePropertyPortalRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class NewPopUp extends LightningElement {

    @api getPortalName;
    @api getPortalIconUrl;
    @track isInitalRender = true;
    @track isSaveBtn = true;
    @track title = '';
    @track email = '';
    @track url = '';
    @track externalImage = '';

    /**
    * Method Name: renderedCallback
    * @description: Used to overwrite standard css.
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
        `;

            body.appendChild(style);
            this.isInitalRender = false;
        }
    }

    /**
    * Method Name: getTheFieldValue
    * @description: Used to get the fields value and set it to corresponding variables.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    getTheFieldValue(event) {
        this.isSaveBtn = false;
        var fieldname = event.target.dataset.field;
        var value = event.target.value;
        if (fieldname == 'title') {
            this.title = value;
        } else if (fieldname == 'email') {
            this.email = value;
        } else if (fieldname == 'validurl') {
            this.url = value;
        } else if (fieldname == 'booleanimage') {
            this.externalImage = value;
        }
    }

    /**
    * Method Name: savePortalRecord
    * @description: Used to make apex callout for creating records in Portal Object.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    savePortalRecord() {
        if (this.title == '' || this.url == '') {
            this.showToast('Error', 'Required field is empty. Please fill the required field.', 'error');
        } else {
            const portalWrapper = {
                title: this.title,
                email: this.email,
                url: this.url,
                externalImage: this.externalImage,
                portalname: this.getPortalName,
                getPortalIconUrl: this.getPortalIconUrl
            };
            savePropertyPortalRecord({ portalWrapper: JSON.stringify(portalWrapper) })
                .then(result => {
                    console.log('result-->', result);
                    this.showToast('Success', 'Record is created successfully.', 'success');
                    let custEvent = new CustomEvent('refreshpageonhide', {
                        details: false
                    });
                    this.dispatchEvent(custEvent);
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

}