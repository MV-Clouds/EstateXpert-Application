import { LightningElement, wire, track , api } from 'lwc';
import getTemplates from '@salesforce/apex/TemplateBuilderController.getTemplates';
import deleteTemplate from '@salesforce/apex/TemplateBuilderController.deleteTemplate';
import { loadStyle } from 'lightning/platformResourceLoader';
import externalCss from '@salesforce/resourceUrl/templateCss';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import updateTemplateStatus from '@salesforce/apex/TemplateBuilderController.updateTemplateStatus';

const PAGE_SIZE = 10;

export default class TemplateBuilder extends NavigationMixin(LightningElement) {
    @api nameForTemplate = 'New';
    @track totalPages = 0;
    @track currentPage = 1;
    @track templates = [];
    @track filteredTemplates = [];
    @track visibleTemplates = [];
    @track currentRecId;
    @track totalRecodslength = 0;
    @track newPageNumber;
    @track selectedobject = '';
    @track selectedDescription = '';
    @track selectedTemplateBody = ''; 
    @track isModalOpen = false;
    @track isLoading = false; 
    @track isPreviewModal = false;
    @track isPreviousDisabled = true;
    @track isNextDisabled = false;    
    @track nameForTemplateValue = '';
    

    /**
    * Method Name: setCurrentPageReference
    * @description: Method to load the data when click on the tab or again come on the tab with redirection
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.currentPageReference = currentPageReference;
        if (currentPageReference.state) {
            if (currentPageReference.attributes.apiName == 'template_builder') {
                this.newPageNumber = currentPageReference.attributes.pageNumber;
                this.fetchTemplates();
            }
        }
    }

    /**
    * Method Name: connectedCallback
    * @description: Method to load static resource css and call fetchTemplates method
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback() {

        this.nameForTemplateValue = this.nameForTemplate;
        Promise.all([
            loadStyle(this, externalCss)
        ])
        .then(res => {
            console.log('External Css Loaded');
        })
        .catch(error => {
            console.log('Error occuring during loading external css', error);
        });
        this.fetchTemplates();
    }
    
    /**
    * Method Name: fetchTemplates
    * @description: Method to call apex and get all the templates
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    fetchTemplates() {
        this.isLoading = true;
        getTemplates()
            .then(data => {
                console.log('OUTPUT : ',data);
                this.totalRecodslength = data.length;
                // data.sort((a, b) => {
                //     const labelA = a.Label__c.toLowerCase();
                //     const labelB = b.Label__c.toLowerCase();

                //     if (labelA < labelB) return -1;
                //     if (labelA > labelB) return 1;
                //     return 0;
                // });
    
                this.processTemplates(data);
                this.isLoading = false; 
            
            })
            .catch(error => {
                this.isLoading = false;
            });
    }

    /**
    * Method Name: processTemplates
    * @description: helper method to add the extra column in the data and call pagination methods
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    processTemplates(data) {
        // this.templates = data
        console.log('data ==> ', data);
        this.templates = data.map((template, index) => ({
            ...template,
            rowIndex: index + 1,
            isActive: template.Status__c,
            CreatedDateformatted: this.formatDate(template.CreatedDate)
        }));
        
        this.filteredTemplates = this.templates;
        this.calculateTotalPages();

        if(this.newPageNumber != undefined){
            this.currentPage = this.newPageNumber;
        }

        this.displayTemplates();
    }


    /**
    * Method Name: formatDate
    * @description: method to change the date formate to display in js
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
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

    /**
    * Method Name: calculateTotalPages
    * @description: method to calulate toal pages
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredTemplates.length / PAGE_SIZE);
        this.updatePaginationButtons();
    }

     /**
    * Method Name: displayTemplates
    * @description: method to display templates in the page of pagination
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    displayTemplates() {
        // Ensure currentPage is within valid range
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
        var startIndex = (this.currentPage - 1) * PAGE_SIZE;
        console.log('startIndex ==> ' , startIndex);

        if(startIndex < 0){
            startIndex = 0;
        }
        console.log('startIndex2 ==> ' , startIndex);

        this.visibleTemplates = this.filteredTemplates.slice(startIndex, startIndex + PAGE_SIZE);
        console.log('this.visibleTemplates ==> ' ,JSON.stringify(this.visibleTemplates));
        this.updatePaginationButtons();
    }

    /**
    * Method Name: previousPage
    * @description: method to go back in the previous page
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayTemplates();

        if(this.newPageNumber != undefined){
            this.newPageNumber = undefined;
            this.updatePaginationButtons();
        }

        }

    }

    /**
    * Method Name: nextPage
    * @description: method to go next in the next page
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.displayTemplates();
        }
    }

    /**
    * Method Name: handleSearch
    * @description: method search the template based on the label of that template
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        
        this.filteredTemplates = this.templates.filter(template =>
            template.Label__c.toLowerCase().includes(searchTerm)
            );
            this.filteredTemplates = this.filteredTemplates.map((template, index) => ({
                ...template,
                rowIndex: index + 1,
            }));
        this.calculateTotalPages();
        this.currentPage = 1;
        this.displayTemplates();
    }

    /**
    * Method Name: handleStatusChange
    * @description: method to change the status of the template in ui based on toggle effect
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleStatusChange(event) {
        const templateId = event.target.dataset.id;
        const isActive = event.target.checked;

        updateTemplateStatus({ templateId: templateId, status: isActive })
            .then(() => {
                const template = this.templates.find(tmpl => tmpl.Id === templateId);
                if (template) {
                    template.isActive = isActive;
                    template.Status__c = isActive ? 'Active' : 'Inactive';
                    this.filteredTemplates = [...this.templates];
                    this.displayTemplates();
                    this.showToast('Status Change', `Template status changed to: ${template.Status__c}`, 'success');
                }
            })
            .catch(error => {
                this.showToast('Error', `Error updating template status: ${error.body.message}`, 'error');
            });
    }

    /**
    * Method Name: handleModalClose
    * @description: method to close the modal
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleModalClose() {
        this.isModalOpen = false;
    }

    /**
    * Method Name: handlePreview
    * @description: method to preview component(ui is pending)
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handlePreview(event) {
        const templateId = event.target.dataset.id;
        const template = this.templates.find(tmpl => tmpl.Id === templateId);
        this.selectedobject = template.Object_Name__c;
        this.selectedTemplateBody = template.Template_Body__c;
        this.isPreviewModal = true;
    }

    /**
    * Method Name: handleEdit
    * @description: method to call Template_Editor tab with sending data
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleEdit(event) {
        const templateId = event.target.dataset.id;
        const template = this.templates.find(tmpl => tmpl.Id === templateId);
        this.currentRecId = templateId;

        if (template) {    
            console.log('template ==>' , JSON.stringify(template));
            const navigationState = {
                selectedObject: template.Object_Name__c ? template.Object_Name__c : '',
                label: template.Label__c ? template.Label__c : '',
                description: template.Description__c ? template.Description__c  : '',
                type : template.Template_Type__c ? template.Template_Type__c : '',
                templateTypeSelect : template.Template_pattern__c ? template.Template_pattern__c : '',
                subject : template.Subject__c ? template.Subject__c : '',
                myrecordId : templateId,
                isQuickTemplate : template.Template_pattern__c == 'quickTemplate' ?  true : false,
                isEmailTemplate : template.Template_Type__c == 'Email' ?  true : false,
                bodyOfTemplate : '',
                isFirstTimeLoaded : true,
                templateTypeForCreation : 'Edit'
            };
    
            const serializedState = JSON.stringify(navigationState);
            
            let cmpDef;                
            cmpDef = {
                componentDef: 'c:templateModalChild',
                attributes: {                    
                    c__navigationState: serializedState,
                    c__recordId : templateId
                }                
                };

            let encodedDef = btoa(JSON.stringify(cmpDef));
                this[NavigationMixin.Navigate]({
                type: "standard__webPage",
                attributes: {
                    url:  "/one/one.app#" + encodedDef                                                         
                }
            });

            this.closeModal();
    
        } else {
            this.showToast('Error', 'Please fill in all required fields', 'error');
        }
    }

    /**
    * Method Name: handleDelete
    * @description: method to delete the template from the table
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleDelete(event) {
        this.isLoading = true;
        const templateId = event.target.dataset.id;
        const templateIndex = this.templates.findIndex(tmpl => tmpl.Id === templateId);
        if (templateIndex !== -1) {
            const template = this.templates[templateIndex];
            deleteTemplate({ templateId: template.Id })
                .then(() => {
                    this.templates.splice(templateIndex, 1);

                    this.templates.forEach((tmpl, index) => {
                        tmpl.rowIndex = index + 1;
                    });

                    this.filteredTemplates = [...this.templates];
                    this.calculateTotalPages();
                    
                    const startIndex = (this.currentPage - 1) * PAGE_SIZE;
                    if (startIndex >= this.filteredTemplates.length && this.currentPage > 1) {
                        this.currentPage--;
                    }
                    
                    this.displayTemplates();
                    this.isLoading = false;
                    this.showToast('Success', `Template '${template.Label__c}' deleted successfully.`, 'success');
                })
                .catch(error => {
                    this.isLoading = false;
                    this.showToast('Error', `Error deleting template: ${error.body.message}`, 'error');
                });
        }
    }
    
    /**
    * Method Name: updatePaginationButtons
    * @description: method to update paginations button
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    updatePaginationButtons() {
        this.isPreviousDisabled = (this.currentPage == 1);

        if(this.newPageNumber != undefined){
            if(this.newPageNumber != 1 && (this.newPageNumber == this.totalPages)){
                this.isPreviousDisabled = false;
            }
            this.isNextDisabled = true;
        }
        else{
            this.isNextDisabled = this.currentPage === this.totalPages;
        }
    }
    
    /**
    * Method Name: handleAdd
    * @description: method to open the modal for the adding template
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleAdd() {
        this.nameForTemplateValue = 'New';
        this.isModalOpen = true;
    }

    /**
    * Method Name: showToast
    * @description: method to show toast message
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    /**
    * Method Name: handleCloseModal
    * @description: method to close modal
    * Date: 12/06/2024
    * Created By: Rachit Shah
    */
    handleCloseModal(){
        this.isPreviewModal = false;
    }
}