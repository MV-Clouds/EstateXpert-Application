import { api, LightningElement, track, wire } from 'lwc';
import getRecords from '@salesforce/apex/PDFViewerV2.getRecords';
import initialize from '@salesforce/apex/PDFViewerV2.initialize';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class GeneratePdf extends NavigationMixin(LightningElement) {
    @api recordId;
    @track value;
    @track dropdownOptionsList = [];
    @track selectedId;
    @track isLoading = false;
    @track pdfUrl;

    connectedCallback() {
        console.log('Record ID:', this.recordId);
        // Check if recordId is available
        if (this.recordId) {
            this.selectedId = this.recordId;
        }
    }

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

    handleChange(event) {
        this.selectedId = event.detail.value;
        console.log('Selected ID:', this.selectedId);
    }

    // previewPDF() {
    //     // Check if selectedId is available
    //     if (!this.selectedId) {
    //         this.showToast('Error', 'Please select a record.', 'error');
    //         return;
    //     }

    //     this.isLoading = true;

    //     initialize({ selectedId: this.selectedId, recordId: this.recordId })
    //         .then(result => {
    //             console.log('Success:', result);
    //             this.isLoading = false;
    //             this[NavigationMixin.GenerateUrl]({
    //                 type: 'standard__webPage',
    //                 attributes: {
    //                     url: `/apex/PDFV2?selectedId=${this.selectedId}&recordId=${this.recordId}`
    //                 }
    //             }).then(generatedUrl => {
    //                 window.open(generatedUrl);
    //             });
    //         })
    //         .catch(error => {
    //             console.error('Error initializing PDF generation:', error);
    //             this.isLoading = false;
    //             this.showToast('Error', 'Failed to initialize PDF generation. Please try again later.', 'error');
    //         });
    // }
    previewPDF() {
        // Check if selectedId is available
        if (!this.selectedId) {
            this.showToast('Error', 'Please select a record.', 'error');
            return;
        }
    
        this.isLoading = true;
    
        initialize({ selectedId: this.selectedId, recordId: this.recordId })
            .then(result => {
                console.log('Success:', result);
                this.isLoading = false;
                this[NavigationMixin.GenerateUrl]({
                    type: 'standard__webPage',
                    attributes: {
                        url: `/apex/PDFV2?selectedId=${this.selectedId}&recordId=${this.recordId}`
                    }
                }).then(generatedUrl => {
                    window.open(generatedUrl);
                });
            })
            .catch(error => {
                console.error('Error initializing PDF generation:', error);
                this.isLoading = false;
                this.showToast('Error', 'Failed to initialize PDF generation. Please try again later.', 'error');
            });
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