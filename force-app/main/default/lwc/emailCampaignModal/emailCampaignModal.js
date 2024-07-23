import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle } from 'lightning/platformResourceLoader';
import getEmailCampaignTemplates from '@salesforce/apex/EmailCampaignController.getEmailCampaignTemplates';
import getMarketingEmails from '@salesforce/apex/EmailCampaignController.getMarketingEmails';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';

export default class EmailCampaignModal extends NavigationMixin(LightningElement) {
    @track templateOptions = [];
    @track marketingEmails = [];
    @track templates = null;
    @api selectedTemplateId = '';
    @api isEdit = false; 

    @api selectedContacts = [];
    @api formData = {
        selectedTemplate: '',
        campaignName: '',
        senderMode: 'myself',
        fromAddress: '',
        fromName: '',
        saveForFuture: false
    };
    
    @track isLoading = false;

    get senderModeOptions() {
        return [
            { label: 'Myself', value: 'myself' },
            { label: 'Send On Behalf', value: 'sendOnBehalf' }
        ];
    }

    get isSaveDisabled() {
        return !this.isFormValid();
    }

    /**
    * Method Name: getEmailCampaignTemplates
    * @description: method to get template options
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    @wire(getEmailCampaignTemplates)
    wiredTemplates({ error, data }) {
        if (data) {
            this.templates = data;
            this.templateOptions = [{ label: 'None', value: '' }, ...data.map(template => {
                return { label: template.Label__c, value: template.Id };
            })];
        } else if (error) {
            this.showToast('Error', 'Failed to fetch template options', 'error');
            console.error(error);
        }
    }
    

    /**
    * Method Name: connectedCallback
    * @description: method to load style using statuc resource
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback() {
        console.log('selectedContacts ==> ' + JSON.stringify(this.selectedContacts));
        this.isLoading = true;
        Promise.all([
            loadStyle(this, externalCss)
        ])
        .then(res => {
            console.log('External Css Loaded');
            console.log(this.isEdit);
            this.isLoading = false;
        })
        .catch(error => {
            console.log('Error occurring during loading external css', error);
            this.isLoading = false;
        });
    }

    /**
    * Method Name: handleCloseModal
    * @description: method to close the modal
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleCloseModal() {
        this.resetFormData();
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    /**
    * Method Name: resetFormData
    * @description: method to reset form
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    resetFormData() {
        this.formData = {
            selectedTemplate: '',
            campaignName: '',
            senderMode: 'myself',
            fromAddress: '',
            fromName: '',
            saveForFuture: false
        };
        this.selectedTemplateId = '';
    }


    /**
    * Method Name: handleChange
    * @description: method to handle changes
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleChange(event) {
        const { name, value, checked } = event.target;
        if (name === 'saveForFuture') {
            this.formData = { ...this.formData, [name]: checked };
        } else if (name === 'selectedTemplate') {
            this.selectedTemplateId = value;
            if (value === '') {
                this.resetFormData();
                this.marketingEmails = [];
            } else {
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
            }
        } else {
            this.formData = { ...this.formData, [name]: value };
        }
    }
    

    /**
    * Method Name: handleSave
    * @description: method to handle save
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleSave() {

        if (!this.isValidEmail(this.formData.fromAddress)) {
            this.showToast('Error', 'Please enter a valid email address', 'error');
            return;
        }
        
        if (this.isFormValid()) {
            const navigationState = {
                ...this.formData,
                marketingEmails: this.marketingEmails,
                selectedTemplateId: this.selectedTemplateId,
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

    /**
    * Method Name: handleNext
    * @description: method to next functionality
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleNext() {

        if (!this.isValidEmail(this.formData.fromAddress)) {
            this.showToast('Error', 'Please enter a valid email address', 'error');
            return;
        }

        if (this.isFormValid()) {
            console.log('marketingEmails ==> ', JSON.stringify(this.marketingEmails));
            const navigationState = {
                ...this.formData,
                marketingEmails: this.marketingEmails,
                selectedTemplateId: this.selectedTemplateId,
                selectedContacts: this.selectedContacts

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

    /**
    * Method Name: isFormValid
    * @description: method check require fields
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    isFormValid() {
        const requiredFields = ['campaignName', 'fromAddress', 'fromName'];
        return requiredFields.every(field => this.formData[field]);
    }


    /**
    * Method Name: isValidEmail
    * @description: method check email field
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
    * Method Name: showToast
    * @description: method to show toast message
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
}