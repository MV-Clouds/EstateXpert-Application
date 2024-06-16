import { LightningElement, track } from 'lwc';

export default class TemplatePreviewModal extends LightningElement {
    @track isRecordSelectOpen = false;

    get toggleIconName() {
        return this.isRecordSelectOpen ? 'utility:chevronleft' : 'utility:chevronright';
    }

    get collapsibleSectionClass() {
        return `collapsible-section ${this.isRecordSelectOpen ? '' : 'collapsed'}`;
    }

    closeModal() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }

    toggleRecordSelectSection() {
        this.isRecordSelectOpen = !this.isRecordSelectOpen;
    }
}
