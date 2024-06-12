import { LightningElement, wire, track } from 'lwc';
import getTemplates from '@salesforce/apex/TemplateBuilderController.getTemplates';
import { loadStyle } from 'lightning/platformResourceLoader';
import externalCss from '@salesforce/resourceUrl/templateCss';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const PAGE_SIZE = 10; // Number of templates per page

export default class TemplateBuilder extends LightningElement {
    @track templates = [];
    @track filteredTemplates = [];
    @track visibleTemplates = [];
    @track currentPage = 1;
    @track totalPages = 0;
    @track error;

    connectedCallback(){
        loadStyle(this, externalCss)
            .then(() => {
                console.log('External Css Loaded');
            })
            .catch(error => {
                console.log('Error occurring during loading external css', error);
            });
    }

    @wire(getTemplates)
    wiredTemplates({ error, data }) {
        if (data) {
            this.templates = data.map((template, index) => ({
                ...template,
                rowIndex: index + 1,
                isActive: template.Status__c === 'Active'
            }));
            this.filteredTemplates = this.templates;
            this.calculateTotalPages();
            this.displayTemplates();
        } else if (error) {
            this.error = error;
        }
    }

    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredTemplates.length / PAGE_SIZE);
    }

    displayTemplates() {
        const startIndex = (this.currentPage - 1) * PAGE_SIZE;
        this.visibleTemplates = this.filteredTemplates.slice(startIndex, startIndex + PAGE_SIZE);
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayTemplates();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.displayTemplates();
        }
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        this.filteredTemplates = this.templates.filter(template =>
            template.Label__c.toLowerCase().includes(searchTerm)
        );
        this.calculateTotalPages();
        this.currentPage = 1;
        this.displayTemplates();
    }

    handleStatusChange(event) {
        const templateId = event.target.dataset.id;
        const template = this.templates.find(tmpl => tmpl.Id === templateId);
        if (template) {
            template.isActive = event.target.checked;
            template.Status__c = event.target.checked ? 'Active' : 'Inactive';
            this.filteredTemplates = [...this.templates];
            this.displayTemplates();
            this.showToast('Status Change', `Template status changed to: ${template.Status__c}`, 'success');
        }
    }

    handlePreview(event) {
        const templateId = event.target.dataset.id;
        const template = this.templates.find(tmpl => tmpl.Id === templateId);
        if (template) {
            this.showToast('Preview', `Preview template: ${template.Label__c}`, 'info');
        }
    }

    handleEdit(event) {
        const templateId = event.target.dataset.id;
        const template = this.templates.find(tmpl => tmpl.Id === templateId);
        if (template) {
            this.showToast('Edit', `Edit template: ${template.Label__c}`, 'info');
        }
    }

    handleDelete(event) {
        const templateId = event.target.dataset.id;
        const template = this.templates.find(tmpl => tmpl.Id === templateId);
        if (template) {
            this.showToast('Delete', `Delete template: ${template.Label__c}`, 'error');
        }
    }

    handleAdd(event) {
        console.log('Clicked');
    }

    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage === this.totalPages;
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}
