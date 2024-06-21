import { LightningElement, track, wire } from 'lwc';
import getContacts from '@salesforce/apex/EmailCampaignController.getContacts';
import { loadStyle } from 'lightning/platformResourceLoader';
import externalCss from '@salesforce/resourceUrl/emailCampaignCss';

export default class EmailCampaignTemplateForm extends LightningElement {
    @track primaryRecipients = [];
    @track selectedRecipients = []; // Track selected recipients
    @track contacts = [];
    @track filteredContacts = [];
    @track isDropdownVisible = false;

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
            this.filteredContacts = [...this.contacts];
        } else if (error) {
            console.error('Error fetching contacts:', error);
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

    handleSearchInputChange(event) {
        const searchTerm = event.target.value.toLowerCase();
        if (searchTerm) {
            this.filteredContacts = this.contacts.filter(contact =>
                contact.label.toLowerCase().includes(searchTerm)
            );
        } else {
            this.filteredContacts = [...this.contacts];
        }
    }

    handleSearchInputFocus() {
        this.isDropdownVisible = true;
    }

    handleSearchInputBlur() {
        setTimeout(() => {
            this.isDropdownVisible = false;
        }, 100);
    }

    handleSelectContact(event) {
        const contactId = event.currentTarget.dataset.id;
        const selectedContact = this.contacts.find(contact => contact.value === contactId);
        if (selectedContact && !this.selectedRecipients.some(recipient => recipient.value === contactId)) {
            this.selectedRecipients = [...this.selectedRecipients, selectedContact];
        }
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

    removeRecipient(event) {
        const recipientId = event.currentTarget.dataset.id;
        this.selectedRecipients = this.selectedRecipients.filter(recipient => recipient.value !== recipientId);
    }

    handleCancel() {
        // Handle cancel logic
    }

    handleSave() {
        // Handle save logic
    }
}
