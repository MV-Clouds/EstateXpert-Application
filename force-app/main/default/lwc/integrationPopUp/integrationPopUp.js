import { LightningElement, track ,api} from 'lwc';
import saveSettings from '@salesforce/apex/IntegrationPopupController.saveSettings';
import getSettings from '@salesforce/apex/IntegrationPopupController.getSettings';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class IntegrationPopUp extends LightningElement {
    @track isModalOpen = true;
    @track secretAccessId = '';
    @track accessId = '';
    @track s3BucketNameId = '';
    @track s3RegionNameId = '';
    @track saveDisable = true;
    @api integrationname = '';
    @api integrationlabel = '';
    @track isLoading = true;

    connectedCallback(){
        this.intializeValues();
    }

    intializeValues(){
        getSettings().then((data,error) => {
            this.isLoading = true;
            if (data) {
                this.secretAccessId = data.MVEX__AWS_Secret_Access_Key__c;
                this.accessId = data.MVEX__AWS_Access_Key__c;
                this.s3BucketNameId = data.MVEX__S3_Bucket_Name__c;
                this.s3RegionNameId = data.MVEX__S3_Region_Name__c;
            }  else if (error) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading settings',
                        message: 'Error retrieve values',
                        variant: 'error',
                    })
                );
            }
            this.isLoading = false;
        })
    }

    openModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        const customEvent = new CustomEvent('closemodal', {
            detail: false
        });
        
        // Dispatch the custom event
        this.dispatchEvent(customEvent);
    }

    handleInputChange(event) {
        const field = event.target.dataset.id;
        this.saveDisable = false;
        const inputField = event.target;
        const value = inputField.value;

        // Check for spaces in the input value
        if (/\s/.test(value)) {
            inputField.setCustomValidity('Spaces are not allowed.');
        } else {
            inputField.setCustomValidity(''); // Clear any previous error messages
        }

        inputField.reportValidity(); // Show the error message if there's an error

        if (field === 'secretAccessId') {
            this.secretAccessId = event.target.value;
        } else if (field === 'accessId') {
            this.accessId = event.target.value;
        } else if (field === 's3BucketNameId') {
            this.s3BucketNameId = event.target.value;
        } else if (field === 's3RegionNameId') {
            this.s3RegionNameId = event.target.value;
        }

        this.checkValidity();
    }

    checkValidity() {
        const inputs = this.template.querySelectorAll('lightning-input');
        let allValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                allValid = false;
            }
        });

        this.saveDisable = !allValid;
    }

    validateFields() {
        const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
        return allValid;
    }

    saveDetails() {
        if (this.validateFields()) {
            saveSettings({ 
                secretAccessId: this.secretAccessId, 
                accessId: this.accessId, 
                s3BucketNameId: this.s3BucketNameId, 
                s3RegionNameId: this.s3RegionNameId 
            })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Credentials saved successfully',
                        variant: 'success',
                    })
                );
                this.closeModal();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error saving settings',
                        message: error.body.message,
                        variant: 'error',
                    })
                );
            });
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill out all required fields.',
                    variant: 'error',
                })
            );
        }
    }
}