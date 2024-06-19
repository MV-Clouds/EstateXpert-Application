/*******************************************************************************************
@Name Estate_GeneratePdfCmp
@Author Harsh Vora <harsh200453@gmail.com>
@Date 06/05/2024
@Description This component allows users to select a record and generate a PDF for that record.
*******************************************************************************************/

/* MODIFICATION LOG
Version    Developer        Date        Description
1.0        Harsh Vora     05/06/2024  Initial Creation
*/


import { api, LightningElement, track, wire } from 'lwc';
import getRecords from '@salesforce/apex/Estate_GeneratePdfController.getRecords';
import generateAndInsertPdf from '@salesforce/apex/Estate_GeneratePdfController.generateAndInsertPdf';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class Estate_GeneratePdfCmp extends NavigationMixin(LightningElement) {
    @api recordId;
    @track value;
    @track dropdownOptionsList = [];
    @track selectedId;
    @track isLoading = false;
    @track pdfUrl;

    // hook to initialize component
    connectedCallback() {
        console.log('Record ID:', this.recordId);
    }

    // Wire method to fetch records from Apex controller
    @wire(getRecords)
    wiredRecords({ error, data }) {
        console.log(data);
        if (data) {
            this.dropdownOptionsList = data.map(record => ({
                label: record.Name,
                value: record.Id
            }));
            console.log('Dropdown Options:', this.dropdownOptionsList);
        } else if (error) {
            console.error('Error fetching records:', error);
            this.showToast('Error', 'Failed to fetch records. Please try again later.', 'error');
        }
    }

    // Method to handle PDF generation and preview
    previewPDF() {
        this.isLoading = true;

        generateAndInsertPdf({ selectedId: this.selectedId, recordId: this.recordId })
            .then(result => {
                this.isLoading = false;
                console.log('PDF generated successfully:', result);

                if (result && !result.startsWith('Error')) {
                    this.pdfUrl = result;
                    console.log(this.pdfUrl);

                    const contentDocumentUrl = '/lightning/r/ContentDocument/' + result + '/view';
                    console.log('Redirecting to:', contentDocumentUrl);

                    window.open(contentDocumentUrl, '_self');
                } else {
                    console.error('Error generating PDF:', result);
                    this.showToast('Error', 'Failed to generate PDF.', 'error');
                }
            })
            .catch(error => {
                this.isLoading = false;
                console.error('Error generating PDF:', error);
                this.showToast('Error', 'Failed to generate PDF.', 'error');
            });
    }

    // Handle combobox change event
    handleChange(event) {
        this.selectedId = event.detail.value;
        console.log('Selected ID:', this.selectedId);
        console.log('Record ID:', this.recordId);
    }

    // Utility method to show toast messages
    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }
}