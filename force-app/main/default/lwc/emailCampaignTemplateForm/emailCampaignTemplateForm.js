import { LightningElement, track, wire } from 'lwc';
import getContacts from '@salesforce/apex/EmailCampaignController.getContacts';
import getDateFieldsForPicklist from '@salesforce/apex/EmailCampaignController.getDateFieldsForPicklist';
import createCampaignAndEmails from '@salesforce/apex/EmailCampaignController.createCampaignAndEmails';
import updateCampaignAndEmails from '@salesforce/apex/EmailCampaignController.updateCampaignAndEmails';
import getCamapaignAndRelatedData from '@salesforce/apex/EmailCampaignController.getCamapaignAndRelatedData';
import { loadStyle } from 'lightning/platformResourceLoader';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';
import plusIcon from '@salesforce/resourceUrl/plusIcon';
import previewBtn from '@salesforce/resourceUrl/previewBtn';
import deleteBtn from '@salesforce/resourceUrl/deleteBtn';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import getQuickTemplates from '@salesforce/apex/EmailCampaignController.getQuickTemplates';
import checkContactDateFields from '@salesforce/apex/EmailCampaignController.checkContactDateFields';


export default class EmailCampaignTemplateForm extends NavigationMixin(LightningElement) {
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
    @track camapignId = '';

    @track isLoading = false;
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
    @track isPreviewModal = false;
    
    @track plusIconUrl = plusIcon; 
    @track previewBtnUrl = previewBtn;
    @track deleteBtnUrl = deleteBtn;

    @track templateBody = '';
    @track emails = [];
    @track emailsWithTemplate = [];
    @track deletedEmailList = [];

    @track selectedContactDateField = '';
    @track isEdit = false;

    @track today = new Date().toISOString().split('T')[0];
    @track currentDateTime = new Date();

    @track selectedobject = 'Contact';
    @track subscription = {};

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
            const recId = currentPageReference.attributes.attributes.c__recordId;

            this.loadContacts();
            if(recId){
                this.camapignId = recId;

            }
            else if (navigationStateString) {
                
                this.navigationStateString = navigationStateString;

                this.emailCampaignTemplate = this.navigationStateString.selectedTemplate;
                this.emailCampaignName = this.navigationStateString.campaignName;
                this.templateId = this.navigationStateString.selectedTemplateId;
                this.emailsFromTemplate = this.navigationStateString.marketingEmails;
                
                const selectedContactList = this.navigationStateString.selectedContacts;
                this.selectedPrimaryRecipients = selectedContactList.map(contact => ({
                    label: contact.Name,
                    value: contact.Id,
                    email: contact.Email
                }));


                if (this.emailsFromTemplate) {
                    this.emails = this.emailsFromTemplate.map(email => ({
                        id: email.Id, 
                        template: email.Quick_Template__c,
                        subject: email.Subject__c, 
                        daysAfterStartDate: email.Days_After_Start_Date__c, 
                        timeToSend: '',
                        exactDate : '',
                        name : email.Name
                    }));
                    this.emailsWithTemplate = [...this.emails];
                }
            }
        }
    }

    /**
    * Method Name: connectedCallback
    * @description: Method to load the data initally
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback() {
        // console.log('in connected');
        this.isLoading = true;
        Promise.all([
            loadStyle(this, externalCss)
        ])
        .then(() => {
            console.log('External CSS Loaded');
            this.fetchDateFields();
            this.fetchQuickTemplates();
        })
        .catch(error => {
            console.error('Error loading external CSS', error);
        });
        
        this.handleSubscribe();
        this.registerErrorListener();
    }

    /**
    * Method Name: loadContacts
    * @description: Method to load the contact informations
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    loadContacts() {
         getContacts()
            .then(result => {
                // console.log('result ==> ' , JSON.stringify(result));
                this.contacts = result.map(contact => ({
                    label: contact.Name,
                    value: contact.Id,
                    email: contact.Email
                }));
                this.updateFilteredLists();
                this.loadCamapignData();

            })
            .catch(error => {
                console.error('Error fetching contacts:', error);
            });
    }
    

    /**
    * Method Name: loadCamapignData
    * @description: Method to load campaign data
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    loadCamapignData(){
        if(this.camapignId){
            getCamapaignAndRelatedData({campaignId : this.camapignId})
            .then(result => {

                const data = JSON.parse(result);
                this.emailCampaignName = data.Label;

                const formData = {
                    selectedTemplate: '',
                    campaignName: '',
                    senderMode: 'myself',
                    fromAddress: '',
                    fromName: '',
                    saveForFuture: false,
                    selectedTemplateId : ''
                };
                this.templateId = data.templateId;
                this.emailCampaignTemplate = data.templateName;
        
                formData.campaignName = data.Label;
                formData.selectedTemplate = data.templateName;
                formData.fromAddress = data.FromAddress;
                formData.fromName = data.FromName;
                formData.saveForFuture = data.IsMarketingCampaignTemplate;
                this.navigationStateString = formData;

                if(data.StartDate != null){
                    this.specificDate = data.StartDate;
                    this.startDateOption = 'specificDate';
                }
                else if(data.SelectedContactDateField != null){
                    this.isFieldSelected = true;
                    this.startDateOption = 'contactDateField';
                    this.selectedContactDateField = data.SelectedContactDateField;
                }

                var primaryContacts1 = [];
                var ccContacts1 = [];
                var bccContacts1 = [];

                if(data.marketingCampaignMembers){
                    data.marketingCampaignMembers.forEach(member => {
                        if (member.Contact_Type__c === "Primary") {
                        primaryContacts1.push(member.Contact__c);
                        }
                    });
                    this.selectedPrimaryRecipients = this.contacts.filter(contact => primaryContacts1.includes(contact.value));
                    this.filteredPrimaryContacts = this.filteredPrimaryContacts.filter(contact => this.selectedPrimaryRecipients.includes(contact.value));
                }

                if(data.CCContacts){
                    console.log('cc ==> ', data.CCContacts);
                    data.CCContacts.split('@@@').forEach(ccContact => {
                        let [id, email] = ccContact.split(':');
                        ccContacts1.push(id);
                    });
                    this.selectedCCRecipients = this.contacts.filter(contact => ccContacts1.includes(contact.value));


                }

                if(data.BCCContacts){
                    console.log('bcc ==> ', data.BCCContacts);
                    data.BCCContacts.split('@@@').forEach(bccContact => {
                        let [id, email] = bccContact.split(':');
                        bccContacts1.push(id);
                    });
                    this.selectedBCCRecipients = this.contacts.filter(contact => bccContacts1.includes(contact.value));   
                }

                if (data.emailRecords) {
                    this.emails = data.emailRecords.map(email => ({
                        
                        id: email.Id, 
                        template: email.Quick_Template__c,
                        subject: email.Subject__c, 
                        daysAfterStartDate: email.Days_After_Start_Date__c, 
                        timeToSend: this.parseTimeString(email.TimeToSend__c),
                        exactDate : this.parseDateString(email.Send_Date_Time__c),
                        name : email.Name,
                        disabled: this.shouldDisableEmail(data.SelectedContactDateField, email.Send_Date_Time__c)
                    }));

                    this.emailsWithTemplate = [...this.emails];
                    
                }
                
                this.isLoading = false;
                this.updateFilteredLists();
        
            })
            .catch(error => {
                console.error('Error in loading campaign data ==> ', error);
                this.isLoading = false;
            });
            
        }
        else{
            this.isLoading = false;
        }

    }

    /**
    * Method Name: fetchDateFields
    * @description: Method to fetch data fields for the contact
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    fetchDateFields() {
        getDateFieldsForPicklist()
            .then(result => {
                // console.log(result);
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

        /**
    * Method Name: fetchQuickTemplates
    * @description: Method to fetch template records from the backend
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    fetchQuickTemplates() {
        getQuickTemplates()
            .then(result => {
                this.quickTemplates = result;
                this.quickTemplateOptions = result.map(template => ({
                    label: template.Label__c,
                    value: template.Id,
                }));
            })
            .catch(error => {
                console.error('Error fetching templates:', error);
            });
    }

    /**
    * Method Name: shouldDisableEmail
    * @description: Method to disable email if time is less then current time
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    shouldDisableEmail(selectedContactDateField, sendDateTime) {
        if (selectedContactDateField) {
            return true;
        }
        const currentDateTime = new Date();
        const emailDateTime = new Date(sendDateTime);
        return currentDateTime > emailDateTime;
    }
    
    /**
    * Method Name: parseTimeString
    * @description: Method to make formate for the time string
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    parseTimeString(timeString) {
        if (!timeString) return '';
    
        const [hours, minutes, secondsAndMillis] = timeString.split(':');
        const [seconds, milliseconds] = secondsAndMillis.split('.');
    
        const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
        const timeToSend = formattedTime.replace('Z', '');
    
        return timeToSend;
    }
    
    
    /**
    * Method Name: parseDateString
    * @description: Method to make formate for the date string
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    parseDateString(dateString) {
        if (!dateString) return '';
    
        const parsedDate = new Date(dateString);
        // console.log('parsedDate ==> ', parsedDate);
    
        if (!isNaN(parsedDate)) {
            const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            const localDate = new Intl.DateTimeFormat('default', options).format(parsedDate);
            // console.log('localDate ==> ' , localDate);
            const [year, month, day] = localDate.split('/');
            return `${day}-${month}-${year}`;
        } else {
            console.error('Invalid date value:', dateString);
            return '';
        }
    }
    
    /**
    * Method Name: handleSubscribe
    * @description: Method to recive message from the platform event
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    handleSubscribe() {
        const channel = '/event/RefreshEvent__e';
        // console.log('channel ==> ' + channel);
        subscribe(channel, -1, (response) => {
            // console.log('response ==> ' , response);
            this.handleMessage(response);
            this.subscription = response;
        })
    }


    /**
    * Method Name: handleMessage
    * @description: Method to handle message for the make disbaled after sending mail
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleMessage(message) {

        const currentTime = new Date();

        this.emails = this.emails.map(email => {
            const emailDate = new Date(`${email.exactDate}T${email.timeToSend}`);
            if (emailDate < currentTime) {
                email.disabled = true;
            } else {
                email.disabled = false;
            }
            return email;
        });
    
        this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
            const emailDate = new Date(`${email.exactDate}T${email.timeToSend}`);
            if (emailDate < currentTime) {
                email.disabled = true;
            } else {
                email.disabled = false;
            }
            return email;
        });
     
    }


    /**
    * Method Name: handleModalClose
    * @description: Method to close modal
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleModalClose(event){
        this.isModalOpen = false;
    }

    /**
    * Method Name: handleSpecificDateChange
    * @description: Method to handle change for the specific date
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    handleSpecificDateChange(event){
        this.specificDate = event.target.value;
        this.updateExactDates();
    }


    /**
    * Method Name: handleContactDateFieldSearchChange
    * @description: Method to find searched contact from input
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    handleContactDateFieldSearchChange(event) {
        const searchTerm = event.target.value.toLowerCase();
        this.filteredContactDateFields = this.contactDateFieldOptions.filter(option =>
            option.label.toLowerCase().includes(searchTerm)
        );
    }

    /**
    * Method Name: handleTemplateDataChange
    * @description: Method to impletene data from custom event
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

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
                    timeToSend: '',
                    name : email.Name
                }));
                this.emailsWithTemplate = [...this.emails];
            }
        }
        
        this.emailCampaignName = eventData.campaignName;
        this.isModalOpen = false;

    }

    
    /**
    * Method Name: handleContactDateFieldSearchFocus
    * @description: Method to show dropdown blur section
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleContactDateFieldSearchFocus() {
        this.isDateFieldDropdownVisible = true;
    }

    /**
    * Method Name: handleContactDateFieldSearchBlur
    * @description: Method to hide dropdown blur section
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleContactDateFieldSearchBlur() {
        setTimeout(() => {
            this.isDateFieldDropdownVisible = false;
        }, 200);
    }

    /**
    * Method Name: handlePrimarySearchInputChange
    * @description: Method to handle filter for the primary contact
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handlePrimarySearchInputChange(event) {
        this.inputValuePrimary = event.target.value;
        this.filterContacts(event, 'Primary');
    }

    /**
    * Method Name: handlePrimarySearchInputFocus
    * @description: Method to show dropdownblur section
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handlePrimarySearchInputFocus(event) {
        event.preventDefault();
        this.isPrimaryDropdownVisible = true;
    }

    /**
    * Method Name: handlePrimarySearchInputFocus
    * @description: Method to hide dropdownblur section
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handlePrimarySearchInputBlur() {
        setTimeout(() => {
            this.isPrimaryDropdownVisible = false;
        }, 100);
    }
    /**
    * Method Name: handleSelectPrimaryContact
    * @description: Method to handle selection for the primary contact
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleSelectPrimaryContact(event) {
        this.selectContact(event, 'Primary');
    }

    /**
    * Method Name: removePrimaryRecipient
    * @description: Method to remove contact from the primary contact
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    removePrimaryRecipient(event) {
        this.removeRecipient(event, 'Primary');
    }


    /**
    * Method Name: handleCCSearchInputChange
    * @description: Method to handle sarch for cc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleCCSearchInputChange(event) {
        this.inputValueCC = event.target.value;
        this.filterContacts(event, 'CC');
    }

    /**
    * Method Name: handleCCSearchInputChange
    * @description: Method to visible blur section for cc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleCCSearchInputFocus(event) {
        event.preventDefault();
        this.isCCDropdownVisible = true;
    }

    /**
    * Method Name: handleCCSearchInputChange
    * @description: Method to hide blur section for cc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleCCSearchInputBlur() {
        setTimeout(() => {
            this.isCCDropdownVisible = false;
        }, 100);
    }

    /**
    * Method Name: handleSelectCCContact
    * @description: Method to select contact from cc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleSelectCCContact(event) {
        this.selectContact(event, 'CC');
    }

    /**
    * Method Name: removeCCRecipient
    * @description: Method to remove contact from cc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    removeCCRecipient(event) {
        this.removeRecipient(event, 'CC');
    }

    /**
    * Method Name: handleBCCSearchInputChange
    * @description: Method to handle search for the bcc
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleBCCSearchInputChange(event) {
        this.inputValueBcc = event.target.value;
        this.filterContacts(event, 'BCC');
    }

    /**
    * Method Name: handleBCCSearchInputFocus
    * @description: Method to show blur dropdown section for bcc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleBCCSearchInputFocus(event) {
        event.preventDefault();
        this.isBCCDropdownVisible = true;
    }

    /**
    * Method Name: handleBCCSearchInputBlur
    * @description: Method to hide blur dropdown section for bcc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleBCCSearchInputBlur() {
        setTimeout(() => {
            this.isBCCDropdownVisible = false;
        }, 100);
    }

    /**
    * Method Name: handleSelectBCCContact
    * @description: Method to select contact for bcc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleSelectBCCContact(event) {
        this.selectContact(event, 'BCC');
    }

    /**
    * Method Name: removeBCCRecipient
    * @description: Method to remove contact for bcc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    removeBCCRecipient(event) {
        this.removeRecipient(event, 'BCC');
    }

    /**
    * Method Name: filterContacts
    * @description: Method to filtercontacts based on event and type
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    filterContacts(event, type) {
        const searchTerm = event.target.value.toLowerCase();
        let filteredList;

        if (searchTerm) {
            if (type === 'Primary') {
                filteredList = this.contacts.filter(contact =>
                    contact.label.toLowerCase().includes(searchTerm) &&
                    !this.selectedPrimaryRecipients.some(selectedContact => selectedContact.value === contact.value)
                );
            } 
            
            else if(type === 'CC'){
                filteredList = this.contacts.filter(contact =>
                    contact.label.toLowerCase().includes(searchTerm) &&
                    !this.selectedCCRecipients.some(selectedContact => selectedContact.value === contact.value)
                );
            }

            else if(type === 'BCC'){
                filteredList = this.contacts.filter(contact =>
                    contact.label.toLowerCase().includes(searchTerm) &&
                    !this.selectedBCCRecipients.some(selectedContact => selectedContact.value === contact.value)
                );
            }

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


    /**
    * Method Name: selectContact
    * @description: Method to select contact in corrosponding list
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
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

    /**
    * Method Name: selectContact
    * @description: Method to remove contact in corrosponding list
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
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

    /**
    * Method Name: updateFilteredLists
    * @description: Method to update the filterlist
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    updateFilteredLists() {
        console.log();
        const selectedPrimaryIds = new Set(this.selectedPrimaryRecipients.map(recipient => recipient.value));
        const selectedCCIds = new Set(this.selectedCCRecipients.map(recipient => recipient.value));
        const selectedBCCIds = new Set(this.selectedBCCRecipients.map(recipient => recipient.value));
        // console.log('selectedBCCIds ==> ' , selectedBCCIds);
    
        this.filteredPrimaryContacts = this.contacts.filter(contact =>
            !selectedPrimaryIds.has(contact.value)        
        );
    
        this.filteredCCContacts = this.contacts.filter(contact =>
            !selectedCCIds.has(contact.value) 
        );
    
        this.filteredBCCContacts = this.contacts.filter(contact =>
            !selectedBCCIds.has(contact.value)
        );
    
        // console.log('filteredPrimaryContacts ==> ', JSON.stringify(this.filteredPrimaryContacts));
        // console.log('filteredCCContacts ==> ', JSON.stringify(this.filteredCCContacts));
        // console.log('filteredBCCContacts ==> ', JSON.stringify(this.filteredBCCContacts));
    }

    /**
    * Method Name: toggleDateFieldDropdown
    * @description: Method to show date or contact field
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    toggleDateFieldDropdown() {
        this.isDateFieldDropdownVisible = !this.isDateFieldDropdownVisible;
    }

    /**
    * Method Name: handleDateFieldSelect
    * @description: Method to show date field of contact
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleDateFieldSelect(event) {
        const selectedValue = event.currentTarget.dataset.id;
        const selectedOption = this.contactDateFieldOptions.find(option => option.value === selectedValue);
        this.selectedContactDateField = selectedOption.label;
        this.isDateFieldDropdownVisible = false;
        this.isFieldSelected = true; 
    }

    /**
    * Method Name: updateExactDates
    * @description: Method to update exact date
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
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
    
    /**
    * Method Name: handleRemove
    * @description: Method remove selected field
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleRemove() {
        this.isFieldSelected = false; 
    }

    /**
    * Method Name: handleEdit
    * @description: Method to edit the campaign information
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleEdit(event){
        // console.log('Edit button is clicked');
        this.isEdit = true;
        this.isModalOpen = true;

    }

    handleDataFieldBlur(event){
        this.isDateFieldDropdownVisible = false;
    }

    /**
    * Method Name: handleStartDateOptionChange
    * @description: Method to visible date field 
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleStartDateOptionChange(event) {
        this.startDateOption = event.detail.value;
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
    
    /**
    * Method Name: handleAddNewEmail
    * @description: Method to add new email 
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleAddNewEmail() {
        const newId = this.emails.length + 1;

        this.emails = [...this.emails, { id: newId, template: '', subject: '', daysAfterStartDate: 0, timeToSend: '', exactDate: this.specificDate, disabled: false }];
        this.emailsWithTemplate = [...this.emailsWithTemplate, { id: newId, template: '', subject: '', daysAfterStartDate: 0, timeToSend: '', exactDate: this.specificDate, disabled: false }];
        }

    /**
    * Method Name: handleDeleteEmail
    * @description: Method to delete email 
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleDeleteEmail(event) {
        try {
            const emailId = event.currentTarget.dataset.id;
            this.deletedEmailList.push(emailId);
            this.emails = this.emails.filter(email => email.id != emailId);
            this.emailsWithTemplate = this.emailsWithTemplate.filter(email => email.id != emailId);
        } catch (error) {
            console.log('error => ' , error);
        }

    }

    /**
    * Method Name: handleTemplateChange
    * @description: Method to handle template and corrospoding subject change
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleTemplateChange(event) {
        const emailId = event.target.dataset.id;
        const selectedTemplateId = event.detail.value;

        const selectedTemplate = this.quickTemplates.find(template => template.Id == selectedTemplateId);

        this.emails = this.emails.map(email => {

            if (email.id == emailId) {
                email.subject = selectedTemplate.Subject__c;
            }
            return email;
        });

        this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
            // console.log('selectedTemplate.Name ==> ' , selectedTemplate.Name);
            if (email.id == emailId) {
                email.template = selectedTemplate.Id;
                email.subject = selectedTemplate.Subject__c;
            }
            return email;
        });

        
    }

    /**
    * Method Name: handleDaysAfterStartDateChange
    * @description: Method to handle days after start day change
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
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

    /**
    * Method Name: handleNameChange
    * @description: Method to handle email name change
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleNameChange(event){
        const emailId = event.target.dataset.id;
        const emailName = event.target.value;

        // console.log('emailName ==> ' , emailName);
        
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


    /**
    * Method Name: handleTimeToSendChange
    * @description: Method to handle time change
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleTimeToSendChange(event) {
        try {
            const emailId = event.target.dataset.id;
            // console.log('emailId-->', emailId);
    
            const newTimeToSend = event.target.value;
            const email = this.emails.find(email => email.id == emailId);
    
            const selectedDate = new Date(this.specificDate);
            const currentTime = new Date();
    
            const isToday = selectedDate.toDateString() === currentTime.toDateString();
    
            // console.log('newTimeToSend ==>  ', newTimeToSend);
            // console.log('currentTime ==>  ' , currentTime);
    
            // Parse the newTimeToSend into a Date object with today's date
            const newTimeParts = newTimeToSend.split(':');
            const newTimeDate = new Date();
            newTimeDate.setHours(newTimeParts[0], newTimeParts[1], newTimeParts[2] || 0, 0);
    
            const isPastTime = isToday && newTimeDate < currentTime;
    
            // console.log(newTimeDate < currentTime);
            // console.log(isPastTime);
            
            const inputElement = this.template.querySelector(`.timeCmp[data-id="${emailId}"]`);

            if (isPastTime) {
                this.showToast('Error', 'Selected time cannot be before current time for today.', 'error');
                // console.log('emailId 1-->', emailId);
    
    
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
    
            // console.log('emails ==> ', JSON.stringify(this.emails));
    
            this.emailsWithTemplate = this.emailsWithTemplate.map(email => {
                if (email.id == emailId) {
                    email.timeToSend = newTimeToSend;
                }
                return email;
            });

            // console.log('emailsWithTemplate ==> ' , JSON.stringify(this.emailsWithTemplate));
        } catch (error) {
            console.log('error ==>', error);
        }
    }


    /**
    * Method Name: handlepreviewBtn
    * @description: Method to handle preview change
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handlepreviewBtn(event){
        const emailId = event.currentTarget.dataset.id;

        const email = this.emailsWithTemplate.find(e => e.id == emailId);
        if(email){
            const templateId = email.template;
            const selectedTemplate = this.quickTemplates.find(template => template.Id == templateId);
            this.templateBody = selectedTemplate.Template_Body__c;
        }

        this.isPreviewModal = true;
    }

    /**
    * Method Name: handleCloseModal
    * @description: Method to handle close modal
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleCloseModal(){
        this.isPreviewModal = false;
    }

    /**
    * Method Name: handleCancel
    * @description: Method to handle cancel button
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleCancel() {
        this.navigateToDisplayCampaigns();
    }



    /**
    * Method Name: handleSave
    * @description: Method to handle save functionality
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    handleSave() {
        const emails = this.emailsWithTemplate.filter(email => email.disabled == false);

        if(this.emailsWithTemplate.length == 0){
            this.showToast('Error' , 'Add atleast One Email for Scheduling' ,'error');
            return;
        }

        // console.log('emailsWithTemplate ==> ' , JSON.stringify(this.emailsWithTemplate));
        if (!this.validateInputs()) {
            this.showToast('Error', 'Please ensure all required fields are filled.', 'error');
            return;
        }

        if(this.specificDate != '' && this.specificDate < this.today){
            this.showToast('Error', 'Please Select Future Date', 'error');
            return;
        }

        const currentTime = new Date();
        let hasInvalidTime = false;
    
        emails.forEach(email => {
            const emailDate = new Date(email.exactDate);
            if (emailDate.toDateString() === currentTime.toDateString()) {
                const timeParts = email.timeToSend.split(':');
                const emailTime = new Date();
                emailTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);
    
                if (emailTime < currentTime) {
                    hasInvalidTime = true;
                }
            }
        });
    
        if (hasInvalidTime) {
            this.showToast('Error', 'Selected time cannot be before the current time for today.', 'error');
            return;
        }

        const uniqueDateTimeValues = new Set();
        let hasDuplicateDateTime = false;
    
        emails.forEach(email => {
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
            const emailsWithTemplate = this.emailsWithTemplate.filter(email => email.disabled == false);

            const campaignEmailData = {
                templateId : this.templateId,
                campaignId : this.camapignId,
                campaignName: this.emailCampaignName,
                senderMode: this.navigationStateString.senderMode,
                fromAddress: this.navigationStateString.fromAddress,
                fromName: this.navigationStateString.fromName,
                saveForFuture: this.navigationStateString.saveForFuture,
                selectedPrimaryRecipients: this.transformRecipientsPrimary(this.selectedPrimaryRecipients),
                selectedCCRecipients: this.transformRecipients(this.selectedCCRecipients),
                selectedBCCRecipients: this.transformRecipients(this.selectedBCCRecipients),
                emails: emailsWithTemplate,
                specificDate : this.specificDate,
                selectedContactDateField : this.selectedContactDateField,
                deletedEmailList : this.deletedEmailList
            };

            // console.log(this.selectedCCRecipients);

            if (this.selectedContactDateField) {
                console.log('selectedContactDateField ==> ' , this.selectedContactDateField);
                checkContactDateFields({ contactsJson: JSON.stringify(this.selectedPrimaryRecipients), selectedContactDateField: this.selectedContactDateField })
                    .then(contactDateFieldValues => {

                        // console.log('contactDateFieldValues ==> ' , contactDateFieldValues);
                        const isPreviousDate = this.dateMapHasDateLessThanToday(contactDateFieldValues);
                        // console.log('isPreviousDate ==> ' , isPreviousDate);

                        if (isPreviousDate) {
                            this.showToast('Error', 'Some contacts date field value is less than today.', 'error');
                            return;
                        }
                        else{
                            this.saveCampaignEmailData(campaignEmailData);

                        }
    
                    })
                    .catch(error => {
                        console.error('Error in checking contact date fields:', error);
                        this.showToast('Error', 'Failed to check contact date field values.', 'error');
                    });
            } else {
                this.saveCampaignEmailData(campaignEmailData);
            }
        } catch (error) {
            console.log('Error ==> ' , error);
        }
    }

    /**
    * Method Name: dateMapHasDateLessThanToday
    * @description: Method to check current and previous date
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    dateMapHasDateLessThanToday(contactDateFieldValues) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        return Object.values(contactDateFieldValues).some(dateString => {
            const dateToCheck = new Date(dateString);
            dateToCheck.setHours(0, 0, 0, 0);
    
            return dateToCheck < today;
        });
    }

    /**
    * Method Name: saveCampaignEmailData
    * @description: Method to save camapign data
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    saveCampaignEmailData(campaignEmailData) {
        const jsonCampaignEmailData = JSON.stringify(campaignEmailData);
        // console.log('jsonCampaignEmailData ==> ', jsonCampaignEmailData);
    
        if (this.camapignId) {
            // console.log(this.camapignId);
            updateCampaignAndEmails({ jsonCampaignEmailData })
                .then(result => {
                    // console.log('Campaign and emails updated successfully:', result);
                    this.showToast('Success', 'Campaign and Emails are saved successfully', 'success');
                    this.navigateToDisplayCampaigns();
                })
                .catch(error => {
                    console.error('Error in updating campaign and emails:', error);
                    this.showToast('Error', 'Failed to update campaign and emails.', 'error');
                });
        } else {
            createCampaignAndEmails({ jsonCampaignEmailData })
                .then(result => {
                    // console.log('Campaign and emails created successfully:', result);
                    this.showToast('Success', 'Campaign and Emails are saved successfully', 'success');
                    this.navigateToDisplayCampaigns();
                })
                .catch(error => {
                    console.error('Error creating campaign and emails:', error);
                    this.showToast('Error', 'Failed to create campaign and emails.', 'error');
                });
        }
    }
    
    /**
    * Method Name: navigateToDisplayCampaigns
    * @description: Method to navigate to display component
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    navigateToDisplayCampaigns() {
        const cmpDef = {
            componentDef: 'c:displayCampaigns'
        };
    
        let encodedDef = btoa(JSON.stringify(cmpDef));
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: "/one/one.app#" + encodedDef
            }
        });
    }


    /**
    * Method Name: validateInputs
    * @description: Method to validate all the input
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    validateInputs() {
        const hasRecipients = this.selectedPrimaryRecipients.length;
        // console.log('hasRecipients ==> ' , hasRecipients);

        const isDateSelected = ((this.specificDate && this.specificDate.trim() != '') || this.selectedContactDateField != '');
        // console.log('isDateSelected ==> ' , isDateSelected);

        const emails = this.emailsWithTemplate.filter(email => email.disabled == false);

        const areEmailsValid = emails.every(email =>
            email.name && email.template && email.daysAfterStartDate !== null && email.timeToSend
        );

        // console.log('areEmailsValid ==> ' , areEmailsValid);
        
        return hasRecipients && isDateSelected && areEmailsValid;
    }

    /**
    * Method Name: transformRecipientsPrimary
    * @description: create map for the primary contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    transformRecipientsPrimary(recipients){
        return recipients.map(recipient => recipient.value);
    }

    /**
    * Method Name: transformRecipients
    * @description: create map for the cc and bcc contacts
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    transformRecipients(recipients) {
        return recipients.map(recipient => `${recipient.value}:${recipient.email}`);
    }
    

    /**
    * Method Name: showToast
    * @description: method to show toast
    * Date: 24/06/2024
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

     /**
    * Method Name: registerErrorListener
    * @description: method to register platform event
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */

    registerErrorListener() {
        onError(error => {
            console.error('Received error from server:', error);
        });
    }

    /**
    * Method Name: disconnectedCallback
    * @description: method to unregister platform event
    * Date: 24/06/2024
    * Created By: Rachit Shah
    */
    disconnectedCallback() {
        unsubscribe(this.subscription, response => {
            console.log('Unsubscribed from platform event channel', response);
        });
    }
}