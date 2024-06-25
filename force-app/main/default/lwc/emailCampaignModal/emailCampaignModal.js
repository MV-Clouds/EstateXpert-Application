import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle } from 'lightning/platformResourceLoader';
import getEmailCampaignTemplates from '@salesforce/apex/EmailCampaignController.getEmailCampaignTemplates';
import getMarketingEmails from '@salesforce/apex/EmailCampaignController.getMarketingEmails';
import getQuickTemplates from '@salesforce/apex/EmailCampaignController.getQuickTemplates';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';

export default class EmailCampaignModal extends NavigationMixin(LightningElement) {
    @track templateOptions = [];
    @track marketingEmails = [];
    @track quickTemplates = null;
    @track templates = null;
    @track quickTemplateOptions = [];
    @api selectedTemplateId = '';

    @api formData = {
        selectedTemplate: '',
        campaignName: '',
        senderMode: 'myself',
        fromAddress: '',
        fromName: '',
        saveForFuture: false
    };

    @wire(getEmailCampaignTemplates)
    wiredTemplates({ error, data }) {
        if (data) {
            this.templates = data;
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
            this.fetchQuickTemplates();
        })
        .catch(error => {
            console.log('Error occurring during loading external css', error);
        });
    }

    fetchQuickTemplates() {
        getQuickTemplates()
            .then(result => {
                this.quickTemplates = result;
                this.quickTemplateOptions = result.map(template => ({
                    label: template.Name,
                    value: template.Id
                }));
            })
            .catch(error => {
                console.error('Error fetching templates:', error);
            });
    }

    get senderModeOptions() {
        return [
            { label: 'Myself', value: 'myself' },
            { label: 'Send On Behalf', value: 'sendOnBehalf' }
        ];
    }

    get isSaveDisabled() {
        return !this.isFormValid();
    }

    handleCloseModal() {
        this.resetFormData();
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    resetFormData() {
        this.formData = {
            selectedTemplate: '',
            campaignName: '',
            senderMode: 'myself',
            fromAddress: '',
            fromName: '',
            saveForFuture: false
        };
    }

    handleChange(event) {
        const { name, value, checked } = event.target;
        if (name === 'saveForFuture') {
            this.formData = { ...this.formData, [name]: checked };
        } else if (name === 'selectedTemplate') {
            this.selectedTemplateId = value;
            const selectedOption = this.templateOptions.find(option => option.value === value);
            console.log('selectedOption ==>' , selectedOption);
            
            if (selectedOption) {
                const selectedTemplate = this.templates.find(template => template.Id === value);
                console.log('selectedTemplate ==> ' ,selectedTemplate);
                if (selectedTemplate) {
                    this.formData = {
                        ...this.formData,
                        selectedTemplate: selectedOption.label,
                        fromAddress: selectedTemplate.From_Address__c,
                        fromName: selectedTemplate.From_Name__c,
                        senderMode: selectedTemplate.Sender_Mode__c
                    };
    
                    getMarketingEmails({ templateId: selectedOption.value })
                        .then(result => {
                            this.marketingEmails = result;
                        })
                        .catch(error => {
                            console.error('Error fetching marketing emails', error);
                        });
                }
            }
        } else {
            this.formData = { ...this.formData, [name]: value };
        }
    }
    

    handleSave() {
        if (this.isFormValid()) {
            const navigationState = {
                ...this.formData,
                marketingEmails: this.marketingEmails,
                quickTemplates: this.quickTemplates,
                quickTemplateOptions: this.quickTemplateOptions,
                selectedTemplateId: this.selectedTemplateId
            };

            const event = new CustomEvent('handledatachange', {
                bubbles: true,
                detail: navigationState
            });

            this.dispatchEvent(event);
        } else {
            this.showToast('Error', 'All required fields must be filled out', 'error');
        }
    }

    handleNext() {
        if (this.isFormValid()) {
            console.log('marketingEmails ==> ', JSON.stringify(this.marketingEmails));
            const navigationState = {
                ...this.formData,
                marketingEmails: this.marketingEmails,
                quickTemplates: this.quickTemplates,
                quickTemplateOptions: this.quickTemplateOptions,
                selectedTemplateId: this.selectedTemplateId
            };

            var cmpDef = {
                componentDef: 'c:emailCampaignTemplateForm',
                attributes: {
                    c__navigationState: navigationState,
                }
            };

            let encodedDef = btoa(JSON.stringify(cmpDef));
            console.log('encodedDef : ', encodedDef);
            this[NavigationMixin.Navigate]({
                type: "standard__webPage",
                attributes: {
                    url: "/one/one.app#" + encodedDef
                },
                apiName: 'Email_Campaign_Template_Form'
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
