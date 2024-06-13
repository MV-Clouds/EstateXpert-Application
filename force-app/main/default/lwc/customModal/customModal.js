import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllObjectNames from '@salesforce/apex/TemplateBuilderController.getAllObjectNames';
import getTemplateTypePicklistValues from '@salesforce/apex/TemplateBuilderController.getTemplateTypePicklistValues';
import { NavigationMixin } from 'lightning/navigation';

export default class CustomModal extends NavigationMixin(LightningElement) {
    @api templateName = '';
    @api description = '';
    @api objectSelect = '';
    @api typeSelect = '';
    @track objectOptions;
    @track typeOptions;
    @track IsChildModal = false;
    @api currentRecordId;
    @api name = ''

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

    connectedCallback(){
        console.log('name ==> ' , this.name);
        if(this.name == 'New'){
            this.templateName = '';
            this.description = '';
            this.objectSelect = '';
            this.typeSelect = '';
        }
    }


    closeModal() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    handleSave() {
        if (this.templateName && this.objectSelect && this.typeSelect) {
            console.log('selectedobject' , this.objectSelect);
            console.log('recordId ==> ' , this.currentRecordId);
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: {
                    apiName: 'Template_Editor',
                },
                state: {
                    c__selectedObject: this.objectSelect,
                    c__myrecordId: this.currentRecordId,
                    c__label:this.templateName
                }
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
