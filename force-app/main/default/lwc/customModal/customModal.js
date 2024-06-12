import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveTemplate from '@salesforce/apex/TemplateBuilderController.saveTemplate';
import getAllObjectNames from '@salesforce/apex/TemplateBuilderController.getAllObjectNames';
import getTemplateTypePicklistValues from '@salesforce/apex/TemplateBuilderController.getTemplateTypePicklistValues';

export default class CustomModal extends LightningElement {
    @track templateName = '';
    @track description = '';
    @track objectSelect = '';
    @track typeSelect = '';
    @track objectOptions;
    @track typeOptions;

    @wire(getAllObjectNames)
    wiredSObjectNames({ error, data }) {
        if (data) {
            this.objectOptions = data.map(objName => ({ label: objName, value: objName }));
        } else if (error) {
            console.error('Error fetching SObject names:', error);
        }
    }

    @wire(getTemplateTypePicklistValues)
    wiredPicklistValues({ error, data }) {
        if (data) {
            this.typeOptions = data.map(picklistName => ({ label: picklistName, value: picklistName }));
        } else if (error) {
            console.error('Error fetching template type picklist values:', error);
        }
    }

    closeModal() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    handleSave() {
        if (this.templateName && this.objectSelect && this.typeSelect) {
            const newTemplate = {
                Name: this.templateName,
                Description__c: this.description,
                Object_Name__c: this.objectSelect,
                Template_Type__c: this.typeSelect
            };

            saveTemplate({ template: newTemplate })
                .then(() => {
                    this.closeModal();
                    this.showToast('Success', 'Template saved successfully', 'success');
                })
                .catch(error => {
                    console.error('Error saving template:', error);
                    this.showToast('Error', 'An error occurred while saving the template', 'error');
                });
        } else {
            this.showToast('Error', 'Please fill in all required fields', 'error');
        }
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        if (field === 'templateName') {
            this.templateName = value;
        } else if (field === 'description') {
            this.description = value;
        } else if (field === 'objectSelect') {
            this.objectSelect = value;
        } else if (field === 'typeSelect') {
            this.typeSelect = value;
        }
    }

    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }
}
