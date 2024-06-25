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

    /**
    * Method Name: ConnectedCallback
    * @description: Standard connectCallback method
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    connectedCallback() {
        console.log('Record ID:', this.recordId);
        // Check if recordId is available
        if (this.recordId) {
            this.selectedId = this.recordId;
        }
    }

    /**
    * Method Name: wiredRecords
    * @description: this wire method is used to get all the dropdown records
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
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

    /**
    * Method Name: handleChange
    * @description: this method updates the selectedId when ever the user change the selected id using the dropdown
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleChange(event) {
        this.selectedId = event.detail.value;
        console.log('Selected ID:', this.selectedId);
    }

    /**
    * Method Name: previewPDF
    * @description: this method is used to initialize the preview and navigate to preview page
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
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
    
    /**
    * Method Name: showToast
    * @description: this method is used to show standard toast messages
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }
}