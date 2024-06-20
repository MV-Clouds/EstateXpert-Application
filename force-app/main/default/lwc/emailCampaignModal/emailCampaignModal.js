import { LightningElement, track , api , wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle } from 'lightning/platformResourceLoader';
import getEmailCampaignTemplates from '@salesforce/apex/EmailCampaignController.getEmailCampaignTemplates';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';

export default class EmailCampaignModal extends LightningElement {
    @track isModalOpen = false;
    @track templateOptions = [];

    @track formData = {
        selectedTemplate: '',
        campaignName: '',
        senderMode: 'myself',
        fromAddress: '',
        fromName: ''
    };

    @wire(getEmailCampaignTemplates)
    wiredTemplates({ error, data }) {
        if (data) {
            this.templateOptions = data.map(template => {
                return { label: template.Label__c, value: template.Id };
            });
        } else if (error) {
            this.showToast('Error', 'Failed to fetch template options', 'error');
            console.error(error);
        }
    }

    connectedCallback() {
        Promise.all([
            loadStyle(this, externalCss)
        ])
        .then(res => {
            console.log('External Css Loaded');
        })
        .catch(error => {
            console.log('Error occuring during loading external css', error);
        });
    }

    get senderModeOptions() {
        return [
            { label: 'Myself', value: 'myself' },
            { label: 'Send On Behalf', value: 'sendOnBehalf' }
        ];
    }

    get selectedTemplateLabel() {
        const selectedOption = this.templateOptions.find(option => option.value === this.formData.selectedTemplate);
        return selectedOption ? selectedOption.label : '';
    }

    get isSaveDisabled() {
        return !this.isFormValid();
    }

    handleOpenModal() {
        this.isModalOpen = true;
    }

    handleCloseModal() {
        this.resetFormData();
        this.isModalOpen = false;
    }

    resetFormData(){
        this.formData = {
            selectedTemplate: '',
            campaignName: '',
            senderMode: 'myself',
            fromAddress: '',
            fromName: ''
        };
    }

    handleChange(event) {
        const { name, value } = event.target;
        this.formData = { ...this.formData, [name]: value };
    }

    handleTemplateRemove() {
        this.formData = { ...this.formData, selectedTemplate: '' };
    }

    handleSave() {
        const formDataCopy = { ...this.formData };
        
        if (this.isFormValid()) {
            // Implement save logic here
            console.log('formData ==> ', JSON.stringify(formDataCopy));
        } else {
            this.showToast('Error', 'All required fields must be filled out', 'error');
        }
    }

    handleNext() {
        if (this.isFormValid()) {
            const formDataCopy = { ...this.formData };
            const navigationState = formDataCopy;
            
            var cmpDef = {
                componentDef: 'c:Email_Campaign_Template_Form',
                attributes: {                    
                    c__navigationState: navigationState,
                }                
            };

            let encodedDef = btoa(JSON.stringify(cmpDef));
                console.log('encodedDef : ', encodedDef);
                this[NavigationMixin.Navigate]({
                type: "standard__webPage",
                attributes: {
                    url:  "/one/one.app#" + encodedDef                                                         
                }
            });

            this.handleCloseModal();
    
        } else {
            this.showToast('Error', 'Please fill in all required fields', 'error');
        }
    }

    isFormValid() {
        const requiredFields = ['campaignName', 'fromAddress', 'fromName'];
        return requiredFields.every(field => this.formData[field]);
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
}