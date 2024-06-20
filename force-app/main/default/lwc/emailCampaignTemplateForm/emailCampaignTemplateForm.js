import { LightningElement, track } from 'lwc';

export default class EmailCampaignTemplateForm extends LightningElement {
    @track primaryRecipients = [];
    @track contacts = [
        { label: 'Andrew Busby Mobile', value: 'Andrew Busby Mobile' },
        // Add more contact options here
    ];
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

    handlePrimaryRecipientsChange(event) {
        this.primaryRecipients = event.detail.value;
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

    handleEdit(){
        console.log('Edit button is clicked');
    }
}
