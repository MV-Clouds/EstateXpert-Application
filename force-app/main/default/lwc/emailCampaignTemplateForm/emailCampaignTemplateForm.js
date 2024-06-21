import { LightningElement, track, wire } from 'lwc';
import getContacts from '@salesforce/apex/EmailCampaignController.getContacts';
import { loadStyle } from 'lightning/platformResourceLoader';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';

export default class EmailCampaignTemplateForm extends LightningElement {
    @track contacts = [];
    @track filteredPrimaryContacts = [];
    @track filteredCCContacts = [];
    @track filteredBCCContacts = [];

    @track selectedPrimaryRecipients = [];
    @track selectedCCRecipients = [];
    @track selectedBCCRecipients = [];

    @track isPrimaryDropdownVisible = false;
    @track isCCDropdownVisible = false;
    @track isBCCDropdownVisible = false;

    @track startDateOptions = [
        { label: 'Using a specific date', value: 'specificDate' },
        { label: 'Using a contact related date field', value: 'contactDateField' },
        { label: 'Sending emails on specific dates', value: 'specificDates' },
    ];
    @track startDateOption = 'specificDate';

    @track emails = [
        { id: 1, name: 'Buyer - First Time', subject: 'Finding the Right Home', daysAfterStartDate: 6, timeToSend: '10:59 AM' },
        { id: 2, name: 'Buyer - First Time', subject: 'Finding the Right Financing', daysAfterStartDate: 5, timeToSend: '03:59 AM' },
    ];

    @wire(getContacts)
    wiredContacts({ error, data }) {
        if (data) {
            this.contacts = data.map(contact => ({
                label: contact.Name,
                value: contact.Id
            }));
            this.filteredPrimaryContacts = [...this.contacts];
            this.filteredCCContacts = [...this.contacts];
            this.filteredBCCContacts = [...this.contacts];
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
        })
        .catch(error => {
            console.error('Error loading external CSS', error);
        });
    }

    handlePrimarySearchInputChange(event) {
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
        const selectedPrimaryIds = new Set(this.selectedPrimaryRecipients.map(recipient => recipient.value));
        const selectedCCIds = new Set(this.selectedCCRecipients.map(recipient => recipient.value));
        const selectedBCCIds = new Set(this.selectedBCCRecipients.map(recipient => recipient.value));

        this.filteredPrimaryContacts = this.contacts.filter(contact =>
            !selectedPrimaryIds.has(contact.value) &&
            !selectedCCIds.has(contact.value) &&
            !selectedBCCIds.has(contact.value)
        );
        
        this.filteredCCContacts = this.contacts.filter(contact =>
            !selectedPrimaryIds.has(contact.value) &&
            !selectedCCIds.has(contact.value) &&
            !selectedBCCIds.has(contact.value)
        );

        this.filteredBCCContacts = this.contacts.filter(contact =>
            !selectedPrimaryIds.has(contact.value) &&
            !selectedCCIds.has(contact.value) &&
            !selectedBCCIds.has(contact.value)
        );
    }

    handleStartDateOptionChange(event) {
        this.startDateOption = event.detail.value;
    }

    handleAddNewEmail() {
        const newId = this.emails.length + 1;
        this.emails = [...this.emails, { id: newId, name: 'New Email', subject: '', daysAfterStartDate: 0, timeToSend: '' }];
    }

    handleDeleteEmail(event) {
        const emailId = event.currentTarget.dataset.id;
        this.emails = this.emails.filter(email => email.id !== parseInt(emailId, 10));
    }

    handleCancel() {
        // Handle cancel logic
    }

    handleSave() {
        // Handle save logic
    }
}
