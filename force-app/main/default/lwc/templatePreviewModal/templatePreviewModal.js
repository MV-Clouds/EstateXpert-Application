import { LightningElement, track, api } from 'lwc';
import getRecordsByObject from '@salesforce/apex/TemplateBuilderController.getRecordsByObject';

export default class TemplatePreviewModal extends LightningElement {
    @track isRecordSelectOpen = false;
    @track selectedRecord = '';
    @api objectName;
    @api templateBody;
    @track recordOptions = [];
    @track recordName = 'Message Body';
    @track updatedBody = '';

    /**
    * Method Name: connectedCallback
    * @description: Method to call fetchRecords method
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback() {
        this.fetchRecords();
    }

    /**
    * Method Name: fetchRecords
    * @description: Method to call records of the selected object
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    fetchRecords() {
        getRecordsByObject({ objectName: this.objectName })
            .then((data) => {
                this.recordOptions = data.map(record => ({
                    label: record.name,
                    value: record.id,
                    data: record // Store the entire record for later use
                }));
            })
            .catch((error) => {
                console.error('Error fetching records:', error);
            });
    }

    get toggleIconName() {
        return this.isRecordSelectOpen ? 'utility:chevronleft' : 'utility:chevronright';
    }

    get collapsibleSectionClass() {
        return `collapsible-section ${this.isRecordSelectOpen ? '' : 'collapsed'}`;
    }

    get contentClass() {
        return `content ${this.isRecordSelectOpen ? '' : 'collapsed'}`;
    }


    /**
    * Method Name: closeModal
    * @description: Method to close the modal
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    closeModal() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }

    /**
    * Method Name: toggleRecordSelectSection
    * @description: Method to check if selectedrecord section is on or off
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    toggleRecordSelectSection() {
        this.isRecordSelectOpen = !this.isRecordSelectOpen;
    }

    /**
    * Method Name: handleRecordChange
    * @description: Method to handle record change logic
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handleRecordChange(event) {
        this.selectedRecord = event.detail.value;
        console.log('selectedRecord ==> ' , this.selectedRecord);
        const selectedOption = this.recordOptions.find(option => option.value === this.selectedRecord);
        this.recordName = selectedOption ? selectedOption.label : 'Preview Section';

        this.updateTemplateBody(selectedOption.data);
    }

    /**
    * Method Name: updateTemplateBody
    * @description: Method to update merged field values
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    updateTemplateBody(record) {
        let tempUpdatedBody = this.templateBody;

        let regex = new RegExp(`{!${this.objectName}\\.(\\w+)}`, 'g');

        tempUpdatedBody = tempUpdatedBody.replace(regex, (match, fieldName) => {
            if (record.hasOwnProperty(fieldName)) {
                return record[fieldName] != null ? record[fieldName] : `{${fieldName} data is empty}`;
            } else {
                return `{${fieldName} data is empty}`;
            }
        });
        
        this.updatedBody = tempUpdatedBody;
    }
}