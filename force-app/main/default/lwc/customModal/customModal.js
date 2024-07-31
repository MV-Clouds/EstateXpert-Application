import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllObjectNames from '@salesforce/apex/TemplateBuilderController.getAllObjectNames';
import getTemplateTypePicklistValues from '@salesforce/apex/TemplateBuilderController.getTemplateTypePicklistValues';
import insertTemplate from '@salesforce/apex/TemplateBuilderController.insertTemplate';
import { NavigationMixin } from 'lightning/navigation';

export default class CustomModal extends NavigationMixin(LightningElement) {
    @api templateName = '';
    @api description = '';
    @api objectSelect = '';
    @api typeSelect = '';
    @api currentRecordId = '';
    @api name = ''
    @api bodyOfTemplate = '';
    @api pageNumber = 1;
    @api totalRecodslength;
    @api templateTypeSelect = '';
    @api isQuickTemplate = false;
    @api subject = '';
    @track objectOptions;
    @track typeOptions;
    @track isObjectChanged = false;
    @track oldObject = '';
    @track templateTypeOptions = [
        { label: 'Quick Template', value: 'quickTemplate' },
        { label: 'Email Template', value: 'emailTemplate' }
    ];

    @track templateNameValue = this.templateName;
    @track descriptionValue = this.description;
    @track objectSelectValue = this.objectSelect;
    @track typeSelectValue = this.typeSelect;
    @track currentRecordIdValue = this.currentRecordId;
    @track nameValue = this.name;
    @track bodyOfTemplateValue = this.bodyOfTemplate;
    @track templateTypeSelectValue = this.templateTypeSelect;
    @track isQuickTemplateValue = this.isQuickTemplate;
    @track subjectValue = this.subject;

    get isEmailTemplate() {
        return this.typeSelectValue === 'Email';
    }

    /**
    * Method Name: connectedCallback
    * @description: Method to remove default things if there is new templatencreation
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback(){    
        this.templateNameValue = this.templateName;
        this.descriptionValue = this.description;
        this.objectSelectValue = this.objectSelect;
        this.typeSelectValue = this.typeSelect;
        this.currentRecordIdValue = this.currentRecordId;
        this.nameValue = this.name;
        this.bodyOfTemplateValue = this.bodyOfTemplate;
        this.templateTypeSelectValue = this.templateTypeSelect;
        this.isQuickTemplateValue = this.isQuickTemplate;
        this.subjectValue = this.subject;
        this.fetchPicklistValues();
        this.fetchObjectNames();

        if(this.nameValue == 'New'){
            this.templateNameValue = '';
            this.descriptionValue = '';
            this.objectSelectValue = '';
            this.typeSelectValue = '';
            this.bodyOfTemplateValue = '';
            this.subjectValue = '';
        }
    }

    /**
    * Method Name: fetchObjectNames
    * @description: Method to retrieve objectName for picklist value
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    fetchObjectNames() {
        getAllObjectNames()
            .then(data => {
                this.objectOptions = Object.keys(data)
                    .map(key => ({
                        label: data[key],
                        value: key
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label)); 
            })
            .catch(error => {
                // Handle error
                console.error('Error fetching object names:', error);
            });
    }

    /**
    * Method Name: fetchPicklistValues
    * @description: Method to retrieve type options for the picklist
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    fetchPicklistValues() {
        getTemplateTypePicklistValues()
            .then(data => {
                this.typeOptions = data.map(picklistName => ({ label: picklistName, value: picklistName }));
            })
            .catch(error => {
                console.error('Error fetching template type picklist values:', error);
            });
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
        
        if (this.templateNameValue && this.objectSelectValue && this.typeSelectValue && this.templateTypeSelectValue) {

            if(this.typeSelectValue === 'Email' && this.subjectValue == ''){
                this.showToast('Error', 'Please fill in all required fields', 'error');
                return;
            }

            if(this.nameValue === 'New'){

                const template = {
                    Object_Name__c: this.objectSelectValue,
                    Label__c: this.templateNameValue,
                    Template_Body__c: this.bodyOfTemplateValue,
                    Description__c : this.descriptionValue,
                    Template_Type__c : this.typeSelectValue,
                    Template_pattern__c : this.templateTypeSelectValue,
                    Subject__c	: this.subjectValue
                };
    
                insertTemplate({ template : template})
                .then((res) => {
                    this.showToast('Success', 'Template saved successfully', 'success');
                    this.currentRecordIdValue = res;
                    this.navigationTotab();
                })
                .catch(error => {
                    console.error('Error saving template:', error);
                });
    
            }
            else{
                this.navigationTotab();
            }
    
        } else {
            this.showToast('Error', 'Please fill in all required fields', 'error');
        }
    }


    navigationTotab(){
        if(this.objectSelectValue != '' && this.oldObject != '' && this.oldObject !== this.objectSelectValue) {
            this.isObjectChanged = true;
            console.log('here');
        }
        else{
            this.isObjectChanged = false;
            console.log('here2');
        }
        
        console.log('objectChnaged ==> ' , this.isObjectChanged);

        const navigationState = {
            selectedObject: this.objectSelectValue,
            myrecordId: this.currentRecordIdValue,
            label: this.templateNameValue,
            description: this.descriptionValue,
            type : this.typeSelectValue,
            bodyoftemplate : this.bodyOfTemplateValue,
            isObjectChanged : this.isObjectChanged,
            oldObject: this.oldObject,
            isFirstTimeLoaded : false,
            templateTypeForCreation: this.nameValue,
            pageNumber : this.pageNumber,
            totalRecodslength : this.totalRecodslength,
            templateTypeSelect : this.templateTypeSelectValue,
            isQuickTemplate : this.isQuickTemplateValue,
            subject: this.subjectValue,
            isEmailTemplate : this.isEmailTemplate
        };

        const serializedState = JSON.stringify(navigationState);

        let cmpDef;                
        cmpDef = {
            componentDef: 'c:templateModalChild',
            attributes: {                    
                c__navigationState: serializedState,
                c__recordId : this.currentRecordIdValue
            }                
            };

        let encodedDef = btoa(JSON.stringify(cmpDef));
            this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url:  "/one/one.app#" + encodedDef                                                         
            }
        });

        this.closeModal();
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
            this.templateNameValue = value;
        } else if (field === 'description') {
            this.descriptionValue = value;
        } else if (field === 'objectSelect') {
            if(this.oldObject != value && this.nameValue == 'Edit'){
                this.isObjectChanged = true;
                this.oldObject = this.objectSelectValue; // Store oldObject when changed
            }
            this.objectSelectValue = value;
        } else if (field === 'typeSelect') {
            this.typeSelectValue = value;
        }else if (field === 'templateType') {
            this.templateTypeSelectValue = value;
            if (value === 'quickTemplate' && this.nameValue != 'Edit') {
                this.oldObject = this.objectSelectValue; 
                this.objectSelectValue = 'Contact'; 
                this.isQuickTemplateValue = true;
                this.isObjectChanged = false;
            }
            else if(value === 'quickTemplate' && this.nameValue == 'Edit'){
                this.oldObject = this.objectSelectValue; 
                this.objectSelectValue = 'Contact'; 
                this.isQuickTemplateValue = true;
                this.isObjectChanged = false;
            }
            else if( value === 'emailTemplate'){
                this.oldObject = 'Contact';
                this.objectSelectValue = '';
                this.isQuickTemplateValue = false;
            }
            else{
                this.isQuickTemplateValue = false;
                this.oldObject = 'Contact';
                this.objectSelectValue = '';
            }
        }
        else if (field === 'subject') {
            this.subjectValue = value;
        }
    }


    /**
    * Method Name: showToast
    * @description: Method to show toast message for success or error
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */

    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }
}