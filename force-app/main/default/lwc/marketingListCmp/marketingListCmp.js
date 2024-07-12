import { LightningElement,track,api} from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import designcss from '@salesforce/resourceUrl/listingManagerCss';
import getContactData from '@salesforce/apex/MarketingListCmpController.getContactData';
import getForm from '@salesforce/apex/MarketingListCmpController.getForm';
import { NavigationMixin } from 'lightning/navigation';

export default class MarketingListCmp extends NavigationMixin(LightningElement) {
    @api objectName = 'Contact';
    @api recordId;
    @api fieldSet = 'MVEX__MarketingListFieldSet';
    @track spinnerShow=true;
    @track showList = true
    @track showTile =false;
    @track contactData =[];
    @track fields =[];
    @track processedContactData = [];    
    @track unchangedProcessContact = [];    
    @track sortField = '';
    @track sortOrder = 'asc';
    @track totalSelected=0;
    @track selectedProperties;
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 30;
    @track totalPages;
    @track shownProcessedContactData = [];
    @track selectedFieldsString = [];

     /**
    * Method Name : checkAll
    * @description : handle the checkAll checkbox in list view.
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
     get checkAll() {
        return this.processedContactData.every(item => item.isChecked);
    }

     /**
    * Method Name : showSection
    * @description : getter for the show no result found text when shownProcessedContactData.length === 0.
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    get showSection() {
        return this.shownProcessedContactData.length === 0;
    }

      /**
    * Method Name : connectedCallback
    * @description : retrieve fields name from the field-set and retrieve Contact records.
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    connectedCallback(){
        loadStyle(this, designcss);
        this.loadFormData();
        this.getContactData();
    }
    
      /**
    * Method Name : getContactData
    * @description : retrieve the data Contact data from the salesforce
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    getContactData(){
        this.spinnerShow = true;
        getContactData()
            .then(result => {
                this.contactData = result.contacts;
                this.contactData.forEach((con)=>{
                    con.isChecked = false;
                })
                this.processContacts();
            })
            .catch(error => {
                console.warn('error ->'+error);
            });
    }

      /**
    * Method Name : processContacts
    * @description : set the contact data inorder of the fields data
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    processContacts() {
        this.processedContactData = this.contactData.map(con => {
            let orderedFields = this.fields.map(field => {
                return {
                    fieldName: field.fieldName,
                    value: con[field.fieldName] || '' 
                };
            });
            return {
                Id: con.Id,
                Name: con.Name,
                Email: con.Email,
                Phone: con.Phone,
                LeadSource : con.LeadSource,
                isChecked: con.isChecked,
                orderedFields
            };
        });
        this.unchangedProcessContact = this.processedContactData;
        this.totalPages = Math.ceil(this.processedContactData.length / this.pageSize);
        this.spinnerShow = false;
        this.updateProcessedContactData();
        this.updatePaginationButtons();
    }
     
    /**
    * Method Name : loadFormData
    * @description : retrieve the fields data from the salesforce
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    loadFormData() {
        getForm({ recordId: this.recordId, objectName: this.objectName, fieldSetName: this.fieldSet })
            .then(result => {
                if (result) {
                    this.fields = result.fieldsData;
                }
            })
            .catch(error => {
                console.warn('error ->'+error);
            })
    }

    /**
    * Method Name : handleFilteredContacts
    * @description : set the data comming from the filter cmp
    *  Date: 22/06/2024
    * Created By:Vyom Soni
    */
    handleFilteredContacts(event){
        const filteredContact = event.detail.filtercontacts;
        this.selectedFieldsString =event.detail.fields;
        this.processedContactData = this.unchangedProcessContact;
        this.processedContactData = this.processedContactData.filter(processCon =>
            filteredContact.some(filtered => filtered.Id === processCon.Id)
        );
        this.contactData = this.contactData.filter(processCon => 
            filteredContact.some(filter =>filter.Id === processCon.Id)
        );
        this.totalPages = Math.ceil(this.processedContactData.length / this.pageSize);
        if(this.totalPages == 0){
            this.totalPages = 1;
        }
        this.pageNumber = 1;
        this.updateProcessedContactData();
        this.updateSelectedProperties();
        this.updatePaginationButtons();
    }


    /**
    * Method Name : handleContactSelect
    * @description : handle data from the tile cmp
    *  Date: 22/06/2024
    * Created By:Vyom Soni
    */
    handleContactSelect(event){
        this.processedContactData = event.detail;
        this.updateProcessedContactData();
        this.updateSelectedProperties();
    }

     /**
    * Method Name : handleMenuTabClick
    * @description : handle the menu clicks in the header
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    handleMenuTabClick(evt){
        let target = evt.currentTarget.dataset.tabId;
        this.showList = false;
        this.showTile = false;
        if(target == "1"){
            this.showList = true;
        }else if(target == "2"){
            this.showTile = true;
        }
                this.template.querySelectorAll(".menuButton").forEach(tabel => {
                        tabel.classList.remove("activeButton");
                });
                this.template.querySelector('[data-tab-id="' + target + '"]').classList.add("activeButton");
                this.template.querySelectorAll(".menuButton svg").forEach(tabdata => {
                    tabdata.classList.remove("activeSvg");
                });
                this.template.querySelector('[data-id="' + target + '"]').classList.add("activeSvg");
    }
    
    /**
    * Method Name : redirectToRecord
    * @description : redirect to contact record recordPage
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    redirectToRecord(event){
        const recordId = event.target.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Contact',
                actionName: 'view'
            }
        });
    }

    /**
    * Method Name : checkBoxValueChange
    * @description : handle the checkbox change
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    checkBoxValueChange(event){
        try{
            const checkboxId = Number(event.target.dataset.id);
            this.shownProcessedContactData[checkboxId].isChecked = event.target.checked;
            this.processedContactData.forEach(item1=>{
                this.shownProcessedContactData.forEach(item2=>{
                    if(item1.Id == item2.Id){
                        item1.isChecked = item2.isChecked;
                    }
                })
               })
            this.unchangedProcessContact.forEach(item1=>{
                this.shownProcessedContactData.forEach(item2=>{
                    if(item1.Id == item2.Id){
                        item1.isChecked = item2.isChecked;
                    }
                })
               })
            this.contactData.forEach(item1=>{
                this.shownProcessedContactData.forEach(item2=>{
                    if(item1.Id == item2.Id){
                        item1.isChecked = item2.isChecked;
                    }
                })
               })
        }catch (e){
            console.log('error ->'+e);
        }
        this.updateSelectedProperties();
    }

      /**
    * Method Name : selectAllCheckbox
    * @description : select the all checkbox
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    selectAllCheckbox(event){
        const isChecked = event.target.checked;
        this.contactData = this.contactData.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.processedContactData = this.processedContactData.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.unchangedProcessContact = this.unchangedProcessContact.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.updateProcessedContactData();
        this.updateSelectedProperties();
    }

    
      /**
    * Method Name : goTONewContact
    * @description : Redirect the new contact page
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    goTOContactPage(){
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Contact',
                actionName: 'new'
            },
            state: {
                useRecordTypeCheck: 1
            }
        });
    }

     /**
    * Method Name : updateSelectedProperties
    * @description : update the properties as selected
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    updateSelectedProperties() {
        this.selectedProperties = this.processedContactData.filter(con => con.isChecked);
        this.totalSelected = this.selectedProperties.length;
    }

    /**
    * Method Name : sortClick
    * @description : this methods apply the sorting on the all fields
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    sortClick(event) {
        const fieldName = event.currentTarget.dataset.id;
        if (this.sortField === fieldName) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = fieldName;
            this.sortOrder = 'asc';
        }
        this.sortData();
        this.updateSortIcons();
    }

     /**
    * Method Name : sortData
    * @description : this methods apply the sorting on the all fields
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    sortData() {
        this.shownProcessedContactData = [...this.shownProcessedContactData].sort((a, b) => {
            let aValue, bValue;

            if (this.sortField === 'Name') {
                aValue = a.Name;
                bValue = b.Name;
            } else {
                aValue = a.orderedFields.find(field => field.fieldName === this.sortField).value;
                bValue = b.orderedFields.find(field => field.fieldName === this.sortField).value;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            let compare = 0;
            if (aValue > bValue) {
                compare = 1;
            } else if (aValue < bValue) {
                compare = -1;
            }

            return this.sortOrder === 'asc' ? compare : -compare;
        });

    }

    /**
    * Method Name : updateSortIcons
    * @description : this method update the sort icons in the wrapbutton
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    updateSortIcons() {
        const allHeaders = this.template.querySelectorAll('.slds-icon-utility-arrowdown svg');
        allHeaders.forEach(icon => {
            icon.classList.remove('rotate-asc', 'rotate-desc');
        });

        const currentHeader = this.template.querySelector('[data-index="' + this.sortField + '"]');
        if (currentHeader) {
            currentHeader.classList.add(this.sortOrder === 'asc' ? 'rotate-asc' : 'rotate-desc');
        }
    }

    //pagination login

     /**
    * Method Name : updateProcessedContactData
    * @description : this method update shown contacts in pagination
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    updateProcessedContactData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.shownProcessedContactData = this.processedContactData.slice(start, end);
    }

    /**
    * Method Name : updatePaginationButtons
    * @description : update the pagination buttons
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    updatePaginationButtons() {
        this.isPrevDisabled = this.pageNumber === 1;
        this.isNextDisabled = this.pageNumber === this.totalPages;
    }

     /**
    * Method Name : goToPrevFeaturedProperty
    * @description : handle the back button click in the  pagination
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    goToPrevFeaturedProperty() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updateProcessedContactData();
            this.updatePaginationButtons();
            setTimeout(() => {
                this.scrollToTop();
            }, 0);
        }
    }

     /**
    * Method Name : goToNextFeaturedProperty
    * @description : handle the next button click in the  pagination
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    goToNextFeaturedProperty() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updateProcessedContactData();
            this.updatePaginationButtons();
            setTimeout(() => {
                this.scrollToTop();
            }, 0);
        }
    }

    /**
    * Method Name : scrollToTop
    * @description : scroll to top in list
    * Date: 22/06/2024
    * Created By:Vyom Soni
    */
    scrollToTop() {
        const tableDiv = this.template.querySelector('.tableDiv');
            if (tableDiv) {
                tableDiv.scrollTop = 0; 
        }
    }
    
}