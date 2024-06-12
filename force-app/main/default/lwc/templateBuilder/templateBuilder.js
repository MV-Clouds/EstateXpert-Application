import { LightningElement, wire, track , api } from 'lwc';
import getTemplates from '@salesforce/apex/TemplateBuilderController.getTemplates';
import deleteTemplate from '@salesforce/apex/TemplateBuilderController.deleteTemplate';
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
    @track isModalOpen = false;
    @api nameForTemplate = 'New';
    @track selectedobject = '';
    @track selectedTemplate = '';
    @track selectedDescription = '';
    @track selectedType = '';

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

    @wire(getTemplates)
    wiredTemplates({ error, data }) {
        if (data) {
            console.log(JSON.stringify(data));
            this.templates = data.map((template, index) => ({
                ...template,
                rowIndex: index + 1,
                CreatedDateformatted: this.formatDate(template.CreatedDate)
            }));

            this.filteredTemplates = this.templates;
            this.calculateTotalPages();
            this.displayTemplates();
        } else if (error) {
            this.error = error;
        }
    }

    formatDate(dateStr) {
        var formatdate = new Date(dateStr);
        formatdate.setDate(formatdate.getDate());
        var formattedDate = new Date(formatdate.getFullYear(), formatdate.getMonth(), formatdate.getDate(), 0, 0, 0);
        const day = formattedDate.getDate();
        const month = formattedDate.getMonth() + 1; // Month is zero-based, so we add 1
        const year = formattedDate.getFullYear();
        const paddedDay = day < 10 ? `0${day}` : day;
        const paddedMonth = month < 10 ? `0${month}` : month;
        const formattedDateStr = `${paddedDay}/${paddedMonth}/${year}`;
        return formattedDateStr;
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

    handleModalClose() {
        this.isModalOpen = false;
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
            console.log(JSON.stringify(template));
            this.nameForTemplate = 'Edit';
            this.selectedobject = template.Object_Name__c ? template.Object_Name__c : '';
            this.selectedTemplate = template.Label__c ? template.Label__c : '';
            this.selectedDescription = template.Description__c ? template.Description__c : '';
            this.selectedType = template.Template_Type__c ? template.Template_Type__c : '';
            this.isModalOpen = true;

        }
    }

    handleDelete(event) {
        const templateId = event.target.dataset.id;
        const templateIndex = this.templates.findIndex(tmpl => tmpl.Id === templateId);
        if (templateIndex !== -1) {
            const template = this.templates[templateIndex];
            deleteTemplate({ templateId: template.Id })
                .then(() => {
                    this.templates.splice(templateIndex, 1);
                    this.filteredTemplates = [...this.templates];
                    this.calculateTotalPages();
                    this.displayTemplates();
                    // Show success toast
                    this.showToast('Success', `Template '${template.Label__c}' deleted successfully.`, 'success');
                })
                .catch(error => {
                    // Show error toast
                    this.showToast('Error', `Error deleting template: ${error.body.message}`, 'error');
                });
        }
    }
    

    handleAdd() {
        console.log('Clicked');
        this.nameForTemplate = 'New';
        this.isModalOpen = true;
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
