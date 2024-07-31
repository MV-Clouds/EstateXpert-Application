import { LightningElement, track, api } from 'lwc';
import getRecordsByObject from '@salesforce/apex/TemplateBuilderController.getRecordsByObject';
import summerNote_Editor from '@salesforce/resourceUrl/summerNote_Editor';
import { loadStyle } from 'lightning/platformResourceLoader';

export default class TemplatePreviewModal extends LightningElement {
    @api objectName;
    @api templateBody;
    @track isRecordSelectOpen = false;
    @track selectedRecord = '';
    @track recordName = 'Message Body';
    @track updatedBody = '';
    @track recordOptions = [{ label: 'None', value: 'none' }];
    @track hasLibraryLoaded = false;


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
    * Method Name: connectedCallback
    * @description: Method to call fetchRecords method
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback() {
        this.updatedBody = this.templateBody;
        this.fetchRecords();
    }

    renderedCallback(){

        Promise.all([
            loadStyle(this, summerNote_Editor + '/summernote-lite-pdf.css'),
        ]).then(() => {
            console.log('Success 112');
            const richText = this.template.querySelector('.richText');
            richText && (richText.innerHTML = this.setTempValue(this.updatedBody));
    
        })
        .catch(error => {
            console.log('Error ==> ' , error);
        });        

    }

    /**
    * Method Name: renderedCallback
    * @description: Method to load external library
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    renderedCallback() {
        if (!this.hasLibraryLoaded) {
            loadStyle(this, summerNote_Editor + '/summernote-lite-pdf.css')
            .then(() => {
                this.hasLibraryLoaded = true;
                this.updateRichTextContent();
            })
            .catch(() => {
                console.log('Error loading style:', error);
                });
        } else {
            this.updateRichTextContent();
        }
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
                const records = data.map(record => ({
                    label: record.name,
                    value: record.id,
                    data: record 
                }));

                this.recordOptions = [...this.recordOptions, ...records];

            })
            .catch((error) => {
                console.error('Error fetching records:', error);
            });
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

        if (this.selectedRecord === 'none') {
            this.recordName = '';
            this.updatedBody = this.templateBody;
        } else {
            const selectedOption = this.recordOptions.find(option => option.value === this.selectedRecord);
            this.recordName = selectedOption ? selectedOption.label : 'Preview Section';
            this.updateTemplateBody(selectedOption.data);
        }
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

        tempUpdatedBody = tempUpdatedBody.replace(regex, (fieldName) => {
            if (record.hasOwnProperty(fieldName)) {

                return record[fieldName] != null ? record[fieldName] : `{${fieldName} data is empty}`;
            }

            return `{${fieldName} data is empty}`;
            
        });
        
        this.updatedBody = tempUpdatedBody;
    }

    /**
    * Method Name: setTempValue
    * @description: Method to set template body for appling css
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */

    setTempValue(value){
        return `<div class=" note-editor2 note-frame2">
                    <div class="note-editing-area2">
                        <div aria-multiline="true" role="textbox" class="note-editable2">
                            ${value}
                        </div>
                    </div> 
                </div>`
    }

    /**
    * Method Name: updateRichTextContent
    * @description: Method to change innertext value for the templatebody
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    updateRichTextContent() {
        const richText = this.template.querySelector('.richText');
        if (richText) {
            richText.innerHTML = this.setTempValue(this.updatedBody);
        }
    }

}