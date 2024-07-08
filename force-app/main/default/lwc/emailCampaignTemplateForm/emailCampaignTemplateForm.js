import { LightningElement, track, wire } from 'lwc';
import getContacts from '@salesforce/apex/EmailCampaignController.getContacts';
import getDateFieldsForPicklist from '@salesforce/apex/EmailCampaignController.getDateFieldsForPicklist';
import createCampaignAndEmails from '@salesforce/apex/EmailCampaignController.createCampaignAndEmails';
import { loadStyle } from 'lightning/platformResourceLoader';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';
import plusIcon from '@salesforce/resourceUrl/plusIcon';
import previewBtn from '@salesforce/resourceUrl/previewBtn';
import deleteBtn from '@salesforce/resourceUrl/deleteBtn';

export default class EmailCampaignTemplateForm extends LightningElement {
    @track contacts = [];
    @track filteredPrimaryContacts = [];
    @track filteredCCContacts = [];
    @track filteredBCCContacts = [];
    @track filteredContactDateFields = [];

    @track selectedPrimaryRecipients = [];
    @track selectedCCRecipients = [];
    @track selectedBCCRecipients = [];
    @track templateId = '';
    @track newDate = '';
    @track newDaysAfterStartDate = 0;

    @track isModalOpen = false;
    @track isPrimaryDropdownVisible = false;
    @track isCCDropdownVisible = false;
    @track isBCCDropdownVisible = false;
    @track inputValueBcc = '';
    @track inputValueCC = '';
    @track inputValuePrimary = '';
    @track contactDateFieldOptions = null;
    @track isDateFieldDropdownVisible = false;
    @track isFieldSelected = false;
    @track emailCampaignTemplate = '';
    @track emailCampaignName = '';
    @track navigationStateString = null;
    @track quickTemplateOptions = null;
    @track quickTemplates = null;
    @track emailsFromTemplate = null;
    @track specificDate = '';
    
    @track plusIconUrl = plusIcon; 
    @track previewBtnUrl = previewBtn;
    @track deleteBtnUrl = deleteBtn;

    @track emails = [];
    @track emailsWithTemplate = [];

    @track selectedContactDateField = '';

    @track today = new Date().toISOString().split('T')[0];


    @track startDateOptions = [
        { label: 'Sending emails on specific dates', value: 'specificDate' },
        { label: 'Using a contact related date field', value: 'contactDateField' },
    ];
    @track startDateOption = 'specificDate';
    
    get isSpecificDateOption() {
        return this.startDateOption === 'specificDate';
    }

    get isContactDateFieldOption() {
        return this.startDateOption === 'contactDateField';
    }

    get searchBoxClass() {
        return this.isFieldSelected ? 'slds-hide' : 'slds-show';
    }

    get pillDivClass() {
        return this.isFieldSelected ? 'slds-show display-pill-input-container' : 'slds-hide';
    }

    /**
    * Method Name: setCurrentPageReference
    * @description: Method to load the data when click on the tab or again come on the tab with redirection
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        if (currentPageReference && currentPageReference.attributes.attributes) {
            const navigationStateString = currentPageReference.attributes.attributes.c__navigationState;
            console.log('navigationStateString ==> ' , JSON.stringify(navigationStateString));
            if (navigationStateString) {
                this.navigationStateString = navigationStateString;
                console.log('navigationStateString ==> ', this.navigationStateString);

                this.emailCampaignTemplate = this.navigationStateString.selectedTemplate;
                this.emailCampaignName = this.navigationStateString.campaignName;
                this.templateId = this.navigationStateString.selectedTemplateId;
                this.emailsFromTemplate = this.navigationStateString.marketingEmails;
                this.quickTemplateOptions = this.navigationStateString.quickTemplateOptions;
                this.quickTemplates = this.navigationStateString.quickTemplates;
                console.log('emailsFromTemplate ==> ' , JSON.stringify(this.emailsFromTemplate));
                console.log('quickTemplates ==> ' , JSON.stringify(this.quickTemplates));

                if (this.emailsFromTemplate) {
                    this.emails = this.emailsFromTemplate.map(email => ({
                        id: email.Id, 
                        template: email.Quick_Template__c,
                        subject: email.Subject__c, 
                        daysAfterStartDate: email.Days_After_Start_Date__c, 
                        timeToSend: '09:00',
                        name : email.Name
                    }));
                    this.emailsWithTemplate = [...this.emails];
                }
            }
        }
    }

    @wire(getContacts)
    wiredContacts({ error, data }) {
        if (data) {
            this.contacts = data.map(contact => ({
                label: contact.Name,
                value: contact.Id,
                email: contact.Email
            }));
            this.updateFilteredLists();
        } else if (error) {
            console.error('Error fetching contacts:', error);
        }
    }

    connectedCallback() {
        
        Promise.all([
            loadStyle(this, externalCss)
        ])
        .then(() => {
            console.log('External CSS Loaded');
            this.fetchDateFields();
            console.log(this.plusIconUrl);
        })
        .catch(error => {
            console.error('Error loading external CSS', error);
        });
        
    }

    handleModalClose(event){
        this.isModalOpen = false;
    }

    handleSpecificDateChange(event){
        this.specificDate = event.target.value;
        this.updateExactDates();
    }

    fetchDateFields() {
        getDateFieldsForPicklist()
            .then(result => {
                console.log(result);
                this.contactDateFieldOptions = result.map(option => ({
                    label: option.label,
                    value: option.value
                }));
                this.filteredContactDateFields = this.contactDateFieldOptions;
            })
            .catch(error => {
                console.error('Error fetching date fields', error);
            });
    }

    handleContactDateFieldSearchChange(event) {
        const searchTerm = event.target.value.toLowerCase();
        this.filteredContactDateFields = this.contactDateFieldOptions.filter(option =>
            option.label.toLowerCase().includes(searchTerm)
        );
    }

    handleTemplateDataChange(event){
        const eventData = event.detail;
        this.navigationStateString = eventData;

        if(this.templateId != eventData.selectedTemplateId) {
            this.templateId = eventData.selectedTemplateId;
            this.emailCampaignTemplate = eventData.selectedTemplate;
            this.emailsFromTemplate = eventData.marketingEmails;


            if (this.emailsFromTemplate) {
                this.emails = this.emailsFromTemplate.map(email => ({
                    id: email.Id, 
                    template: email.Quick_Template__c,
                    subject: email.Subject__c, 
                    daysAfterStartDate: email.Days_After_Start_Date__c, 
                    timeToSend: '09:00',
                    name : email.Name
                }));
                this.emailsWithTemplate = [...this.emails];
            }
        }
        
        this.emailCampaignName = eventData.campaignName;
        this.quickTemplateOptions = eventData.quickTemplateOptions;
        this.quickTemplates = eventData.quickTemplates;

        this.isModalOpen = false;

    }

    handleContactDateFieldSearchFocus() {
        this.isDateFieldDropdownVisible = true;
    }

    handleContactDateFieldSearchBlur() {
        setTimeout(() => {
            this.isDateFieldDropdownVisible = false;
        }, 200);
    }

    handlePrimarySearchInputChange(event) {
        this.inputValuePrimary = event.target.value;
        this.filterContacts(event, 'Primary');
    }

    handlePrimarySearchInputFocus() {
        this.isPrimaryDropdownVisible = true;
    }

    handlePrimarySearchInputBlur() {
        setTimeout(() => {
            this.isPrimaryDropdownVisible = false;
        }, 100);
    }

    handleSelectPrimaryContact(event) {
        this.selectContact(event, 'Primary');
    }

    removePrimaryRecipient(event) {
        this.removeRecipient(event, 'Primary');
    }

    handleCCSearchInputChange(event) {
        this.inputValueCC = event.target.value;
        this.filterContacts(event, 'CC');
    }

    handleCCSearchInputFocus() {
        this.isCCDropdownVisible = true;
    }

    handleCCSearchInputBlur() {
        setTimeout(() => {
            this.isCCDropdownVisible = false;
        }, 100);
    }

    handleSelectCCContact(event) {
        this.selectContact(event, 'CC');
    }

    removeCCRecipient(event) {
        this.removeRecipient(event, 'CC');
    }

    handleBCCSearchInputChange(event) {
        this.inputValueBcc = event.target.value;
        this.filterContacts(event, 'BCC');
    }

    handleBCCSearchInputFocus() {
        this.isBCCDropdownVisible = true;
    }

    handleBCCSearchInputBlur() {
        setTimeout(() => {
            this.isBCCDropdownVisible = false;
        }, 100);
    }

    handleSelectBCCContact(event) {
        this.selectContact(event, 'BCC');
    }

    removeBCCRecipient(event) {
        this.removeRecipient(event, 'BCC');
    }

    filterContacts(event, type) {
        const searchTerm = event.target.value.toLowerCase();
        let filteredList;

        if (searchTerm) {
            filteredList = this.contacts.filter(contact =>
                contact.label.toLowerCase().includes(searchTerm)
            );
        } else {
            filteredList = [...this.contacts];
        }

        if (type === 'Primary') {
            this.filteredPrimaryContacts = filteredList;
        } else if (type === 'CC') {
            this.filteredCCContacts = filteredList;
        } else if (type === 'BCC') {
            this.filteredBCCContacts = filteredList;
        }
    }

    selectContact(event, type) {
        const contactId = event.currentTarget.dataset.id;
        const selectedContact = this.contacts.find(contact => contact.value === contactId);

        if (type === 'Primary' && selectedContact && !this.selectedPrimaryRecipients.some(recipient => recipient.value === contactId)) {
            this.selectedPrimaryRecipients = [...this.selectedPrimaryRecipients, selectedContact];
        } else if (type === 'CC' && selectedContact && !this.selectedCCRecipients.some(recipient => recipient.value === contactId)) {
            this.selectedCCRecipients = [...this.selectedCCRecipients, selectedContact];
        } else if (type === 'BCC' && selectedContact && !this.selectedBCCRecipients.some(recipient => recipient.value === contactId)) {
            this.selectedBCCRecipients = [...this.selectedBCCRecipients, selectedContact];
        }

        this.inputValueBcc = '';
        this.inputValueCC = '';
        this.inputValuePrimary = '';
        this.updateFilteredLists();
    }

    removeRecipient(event, type) {
        const recipientId = event.currentTarget.dataset.id;

        if (type === 'Primary') {
            this.selectedPrimaryRecipients = this.selectedPrimaryRecipients.filter(recipient => recipient.value !== recipientId);
        } else if (type === 'CC') {
            this.selectedCCRecipients = this.selectedCCRecipients.filter(recipient => recipient.value !== recipientId);
        } else if (type === 'BCC') {
            this.selectedBCCRecipients = this.selectedBCCRecipients.filter(recipient => recipient.value !== recipientId);
        }

        this.updateFilteredLists();
    }

    updateFilteredLists() {
        const selectedIds = new Set([
            ...this.selectedPrimaryRecipients.map(recipient => recipient.value),
            ...this.selectedCCRecipients.map(recipient => recipient.value),
            ...this.selectedBCCRecipients.map(recipient => recipient.value)
        ]);

        this.filteredPrimaryContacts = this.contacts.filter(contact =>
            !selectedIds.has(contact.value)
        );
        
        this.filteredCCContacts = this.contacts.filter(contact =>
            !selectedIds.has(contact.value)
        );

        this.filteredBCCContacts = this.contacts.filter(contact =>
            !selectedIds.has(contact.value)
        );
    }

    toggleDateFieldDropdown() {
        this.isDateFieldDropdownVisible = !this.isDateFieldDropdownVisible;
    }

    handleDateFieldSelect(event) {
        const selectedValue = event.currentTarget.dataset.id;
        const selectedOption = this.contactDateFieldOptions.find(option => option.value === selectedValue);
        this.selectedContactDateField = selectedOption.label;
        this.isDateFieldDropdownVisible = false;
        this.isFieldSelected = true; 
    }

    updateExactDates() {
        if (this.specificDate) {
            this.emails = this.emails.map(email => {
                const days = parseInt(email.daysAfterStartDate, 10) || 0;
                const exactDate = new Date(this.specificDate);
                exactDate.setDate(exactDate.getDate() + days);
                email.exactDate = exactDate.toISOString().split('T')[0];
                return email;
            });

            this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
                const days = parseInt(email.daysAfterStartDate, 10) || 0;
                const exactDate = new Date(this.specificDate);
                exactDate.setDate(exactDate.getDate() + days);
                email.exactDate = exactDate.toISOString().split('T')[0];
                return email;
            });
        }
    }
    
    handleRemove() {
        this.isFieldSelected = false; 
    }

    handleEdit(event){
        console.log('Edit button is clicked');
        this.isModalOpen = true;

    }

    handleDataFieldBlur(event){
        this.isDateFieldDropdownVisible = false;
    }

    handleStartDateOptionChange(event) {
        this.startDateOption = event.detail.value;
        console.log('startDateOption ==> ' , this.startDateOption);
        this.specificDate = '';
        this.selectedContactDateField = '';
        this.isFieldSelected = false;

        this.emails = this.emails.map(email => {
            email.exactDate = '';
            return email;
        });

        this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
            email.exactDate = '';
            return email;
        });
    }

    handleContactDateFieldChange(event) {
        this.selectedContactDateField = event.detail.value;
    }
    
    handleAddNewEmail() {
        const newId = this.emails.length + 1;

        this.emails = [...this.emails, { id: newId, template: '', subject: '', daysAfterStartDate: 0, timeToSend: '09:00', exactDate: this.specificDate }];
        this.emailsWithTemplate = [...this.emailsWithTemplate, { id: newId, template: '', subject: '', daysAfterStartDate: 0, timeToSend: '09:00', exactDate: this.specificDate }];    
    }

    handleDeleteEmail(event) {
        const emailId = event.currentTarget.dataset.id;
        this.emails = this.emails.filter(email => email.id != emailId);
        this.emailsWithTemplate = this.emailsWithTemplate.filter(email => email.id != emailId);
    }

    handleTemplateChange(event) {
        const emailId = event.target.dataset.id;
        const selectedTemplateId = event.detail.value;

        const selectedTemplate = this.quickTemplates.find(template => template.Id == selectedTemplateId);
        console.log('selectedTemplate ==> ' , JSON.stringify(selectedTemplate));

        this.emails = this.emails.map(email => {
            console.log('selectedTemplate.Name ==> ' , selectedTemplate.Name);
            console.log('selectedTemplate.Name ==> ' , selectedTemplate.Subject__c);
            console.log('email.id ==> ' , email.id);
            console.log('emailId ==> ' , emailId);
            if (email.id == emailId) {
                email.subject = selectedTemplate.Subject__c;
            }
            return email;
        });

        this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
            console.log('selectedTemplate.Name ==> ' , selectedTemplate.Name);
            if (email.id == emailId) {
                email.template = selectedTemplate.Id;
                email.subject = selectedTemplate.Subject__c;
            }
            return email;
        });

        
    }

    handleDaysAfterStartDateChange(event) {
        const emailId = event.target.dataset.id;
        this.newDaysAfterStartDate = event.target.value;
    
        this.emails = this.emails.map(email => {
            if (email.id == emailId) {
                email.daysAfterStartDate = this.newDaysAfterStartDate;
            }
            return email;
        });
            
        this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
            if (email.id == emailId) {
                email.daysAfterStartDate = this.newDaysAfterStartDate;
            }
            return email;
        });

        this.updateExactDates();
    }

    handleNameChange(event){
        const emailId = event.target.dataset.id;
        const emailName = event.target.value;

        console.log('emailName ==> ' , emailName);
        
        this.emails = this.emails.map(email => {
            if (email.id == emailId) {
                email.name = emailName;
            }
            return email;
        });

        this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
            if (email.id == emailId) {
                email.name = emailName;
            }
            return email;
        });

        // console.log('emailsWithTemplate ==> ' , JSON.stringify(emailsWithTemplate));

        
    }


    handleTimeToSendChange(event) {
        try {
            const emailId = event.target.dataset.id;
            console.log('emailId-->', emailId);
    
            const newTimeToSend = event.target.value;
            const email = this.emails.find(email => email.id == emailId);
    
            const selectedDate = new Date(this.specificDate);
            const currentTime = new Date();
    
            const isToday = selectedDate.toDateString() === currentTime.toDateString();
    
            console.log('newTimeToSend ==>  ', newTimeToSend);
            console.log('currentTime ==>  ' , currentTime);
    
            // Parse the newTimeToSend into a Date object with today's date
            const newTimeParts = newTimeToSend.split(':');
            const newTimeDate = new Date();
            newTimeDate.setHours(newTimeParts[0], newTimeParts[1], newTimeParts[2] || 0, 0);
    
            const isPastTime = isToday && newTimeDate < currentTime;
    
            console.log(newTimeDate < currentTime);
            console.log(isPastTime);
            
            const inputElement = this.template.querySelector(`.timeCmp[data-id="${emailId}"]`);

            if (isPastTime) {
                this.showToast('Error', 'Selected time cannot be before current time for today.', 'error');
                console.log('emailId 1-->', emailId);
    
    
                if (inputElement) {
                    inputElement.setCustomValidity("Select future time");
                }
    
                return;
            }
            else{
                if (inputElement) {
                    inputElement.setCustomValidity("");
                }           
            }
    
            this.emails = this.emails.map(email => {
                if (email.id == emailId) {
                    email.timeToSend = newTimeToSend;
                }
                return email;
            });
    
            console.log('emails ==> ', JSON.stringify(this.emails));
    
            this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
                if (email.id == emailId) {
                    email.timeToSend = newTimeToSend;
                }
                return email;
            });

            console.log('emailsWithTemplate ==> ' , JSON.stringify(this.emailsWithTemplate));
        } catch (error) {
            console.log('error ==>', error);
        }
    }


    handlepreviewBtn(event){
        console.log('handle preview btn');
    }

    handleCancel() {
        console.log('cancel btn is clicked');
    }


    handleSave() {
        if (!this.validateInputs()) {
            this.showToast('Error', 'Please ensure all required fields are filled.', 'error');
            return;
        }

        const uniqueDateTimeValues = new Set();
        let hasDuplicateDateTime = false;
    
        this.emailsWithTemplate.forEach(email => {
            const dateTimeKey = `${email.daysAfterStartDate}-${email.timeToSend}`;
            if (uniqueDateTimeValues.has(dateTimeKey)) {
                hasDuplicateDateTime = true;
                return;
            } else {
                uniqueDateTimeValues.add(dateTimeKey);
            }
        });
    
        if (hasDuplicateDateTime) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'There are duplicate "Days After Start Date" and "Time to Send" values. Please ensure each email has a unique combination of these values.',
                    variant: 'error'
                })
            );
            return;
        }
    
        try {
            console.log('selectedPrimaryRecipients ==> ' , JSON.stringify(this.selectedPrimaryRecipients));
            const campaignEmailData = {
                campaignName: this.emailCampaignName,
                senderMode: this.navigationStateString.senderMode,
                fromAddress: this.navigationStateString.fromAddress,
                fromName: this.navigationStateString.fromName,
                saveForFuture: this.navigationStateString.saveForFuture,
                selectedPrimaryRecipients: this.transformRecipients(this.selectedPrimaryRecipients),
                selectedCCRecipients: this.transformRecipients(this.selectedCCRecipients),
                selectedBCCRecipients: this.transformRecipients(this.selectedBCCRecipients),
                emails: this.emailsWithTemplate,
                specificDate : this.specificDate,
                selectedContactDateField : this.selectedContactDateField
            };
    
            const jsonCampaignEmailData = JSON.stringify(campaignEmailData);
            console.log('jsonCampaignEmailData ==> ' , jsonCampaignEmailData);

            createCampaignAndEmails({ jsonCampaignEmailData })
            .then(result => {
                console.log('Campaign and emails created successfully:', result);
            })
            .catch(error => {
                console.error('Error creating campaign and emails:', error);
            });
        } catch (error) {
            console.log('Error ==> ' , error);
        }
    }


    validateInputs() {
        const hasRecipients = this.selectedPrimaryRecipients.length ;

        // console.log('hasRecipients ==> ' ,hasRecipients);

        const isDateSelected = ((this.specificDate && this.specificDate.trim() != '') || this.selectedContactDateField != '');
        // console.log('isDateSelected ==> ' ,isDateSelected);

        // console.log('emailsWithTemplate ==> ' , JSON.stringify(this.emailsWithTemplate));
        const areEmailsValid = this.emailsWithTemplate.every(email =>
            email.name && email.template && email.daysAfterStartDate !== null && email.timeToSend
        );

        // console.log('areEmailsValid ==> ' ,areEmailsValid);

        
        return hasRecipients && isDateSelected && areEmailsValid;
    }

    transformRecipients(recipients) {
        return recipients.map(recipient => recipient.value);
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