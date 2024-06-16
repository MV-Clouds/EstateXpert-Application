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
    @api bodyOfTemplate = '';
    @api isEdit = false;
    @track isObjectChanged = false;

    /**
    * Method Name: wiredSObjectNames
    * @description: Method to retrive objectName for picklist value
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    @wire(getAllObjectNames)
    wiredSObjectNames({ error, data }) {
        if (data) {
            this.objectOptions = data.map(objName => ({ label: objName, value: objName }));
        } else if (error) {
            console.error('Error fetching SObject names:', error);
        }
    }

    /**
    * Method Name: wiredPicklistValues
    * @description: Method to retrive type options for the picklist
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    @wire(getTemplateTypePicklistValues)
    wiredPicklistValues({ error, data }) {
        if (data) {
            this.typeOptions = data.map(picklistName => ({ label: picklistName, value: picklistName }));
        } else if (error) {
            console.error('Error fetching template type picklist values:', error);
        }
    }

    /**
    * Method Name: connectedCallback
    * @description: Method to remove default things if there is new templatencreation
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback(){    
        if(this.name == 'New'){
            this.templateName = '';
            this.description = '';
            this.objectSelect = '';
            this.typeSelect = '';
        }
    }

    /**
    * Method Name: closeModal
    * @description: Method to close the modal
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    closeModal() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    /**
    * Method Name: handleSave
    * @description: Method to save the details and pass to another component
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleSave() {
        if (this.templateName && this.objectSelect && this.typeSelect) {

            const navigationState = {
                selectedObject: this.objectSelect,
                myrecordId: this.currentRecordId,
                label: this.templateName,
                description: this.description,
                type : this.typeSelect,
                bodyoftemplate : this.bodyOfTemplate,
                isObjectChanged : this.isObjectChanged,
                oldObject: this.oldObject
            };
    
            const serializedState = JSON.stringify(navigationState);
            console.log('serializedState:', serializedState);
    
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: {
                    apiName: 'Template_Editor',
                    c__navigationState: serializedState,
                    c__recordId : this.currentRecordId
                }
            });

            this.closeModal();
    
        } else {
            // this.showToast('Error', 'Please fill in all required fields', 'error');
        }
    }

    /**
    * Method Name: handleInputChange
    * @description: Method to save values in variable when any input changes
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        if (field === 'templateName') {
            this.templateName = value;
        } else if (field === 'description') {
            this.description = value;
        } else if (field === 'objectSelect') {
            if(this.objectSelect != value){
                this.isObjectChanged = true;
                this.oldObject = this.objectSelect; // Store oldObject when changed
            }
            this.objectSelect = value;
        } else if (field === 'typeSelect') {
            this.typeSelect = value;
        }
    }


    /**
    * Method Name: showToast
    * @description: Method to show toast message for success or error
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */

    // showToast(title, message, variant) {
    //     const toastEvent = new ShowToastEvent({
    //         title: title,
    //         message: message,
    //         variant: variant
    //     });
    //     this.dispatchEvent(toastEvent);
    // }
}