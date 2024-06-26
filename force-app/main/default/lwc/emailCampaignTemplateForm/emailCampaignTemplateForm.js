import { LightningElement, track, wire } from 'lwc';
import getContacts from '@salesforce/apex/EmailCampaignController.getContacts';
import getDateFieldsForPicklist from '@salesforce/apex/EmailCampaignController.getDateFieldsForPicklist';
import createCampaignAndEmails from '@salesforce/apex/EmailCampaignController.createCampaignAndEmails';
import { loadStyle } from 'lightning/platformResourceLoader';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
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


    @track startDateOptions = [
        { label: 'Using a specific date', value: 'specificDate' },
        { label: 'Using a contact related date field', value: 'contactDateField' },
        { label: 'Sending emails on specific dates', value: 'specificDates' },
    ];
    @track startDateOption = 'specificDate';

    @track emails = [];

    @track selectedContactDateField = '';


    get isSpecificDateOption() {
        return this.startDateOption === 'specificDate' || this.startDateOption === 'specificDates';
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
                        name: email.Quick_Template__c,
                        subject: email.Subject__c, 
                        daysAfterStartDate: 0, 
                        timeToSend: ''
                    }));
                    this.emailsWithName = [...this.emails];
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
                    name: email.Quick_Template__c,
                    subject: email.Subject__c, 
                    daysAfterStartDate: 0, 
                    timeToSend: ''
                }));
                this.emailsWithName = [...this.emails];
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
        this.isFieldSelected = true; // Set to true when a field is selected
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
    }

    handleContactDateFieldChange(event) {
        this.selectedContactDateField = event.detail.value;
    }
    
    handleAddNewEmail() {
        const newId = this.emails.length + 1;
        this.emails = [...this.emails, { id: newId, name: '', subject: '', daysAfterStartDate: 0, timeToSend: '' }];
    }

    handleDeleteEmail(event) {
        const emailId = event.currentTarget.dataset.id;
        this.emails = this.emails.filter(email => email.id !== parseInt(emailId, 10));
    }

    handleNameChange(event) {
        const emailId = event.target.dataset.id;
        const selectedTemplateId = event.detail.value;

        const selectedTemplate = this.quickTemplates.find(template => template.Id === selectedTemplateId);

        console.log('');

        this.emails = this.emails.map(email => {
            if (email.id === parseInt(emailId, 10)) {
                console.log('selectedTemplate.Name ==> ' , selectedTemplate.Name);
                email.subject = selectedTemplate.Subject__c;
            }
            return email;
        });
    }

    handleDaysAfterStartDateChange(event) {
        const emailId = event.target.dataset.id;
        const newDaysAfterStartDate = event.target.value;
    
        this.emails = this.emails.map(email => {
            if (email.id === parseInt(emailId, 10)) {
                email.daysAfterStartDate = newDaysAfterStartDate;
            }
            return email;
        });
    }


    handleTimeToSendChange(event) {
        const emailId = event.target.dataset.id;
        const newTimeToSend = event.target.value;
    
        this.emails = this.emails.map(email => {
            if (email.id === parseInt(emailId, 10)) {
                email.timeToSend = newTimeToSend;
            }
            return email;
        });
    }    
    

    handlepreviewBtn(event){
        console.log('handle preview btn');
    }

    handleCancel() {
        console.log('cancel btn is clicked');
    }

    handleSave() {
        const campaignEmailData = {
            campaignName: this.emailCampaignName,
            senderMode: this.navigationStateString.senderMode,
            fromAddress: this.navigationStateString.fromAddress,
            fromName: this.navigationStateString.fromName,
            saveForFuture: this.navigationStateString.saveForFuture,
            selectedPrimaryRecipients: this.transformRecipients(this.selectedPrimaryRecipients),
            selectedCCRecipients: this.transformRecipients(this.selectedCCRecipients),
            selectedBCCRecipients: this.transformRecipients(this.selectedBCCRecipients),
            emails: this.emails
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
    }

    transformRecipients(recipients) {
        return recipients.map(recipient => ({
            id: {
                name: recipient.label,
                email: recipient.email
            }
        }));
    }

}