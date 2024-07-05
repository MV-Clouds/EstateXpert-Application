import { LightningElement,track,api} from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import designcss from '@salesforce/resourceUrl/listingManagerCss';
import getListingData from '@salesforce/apex/ListingManagerController.getListingData';
import getForm from '@salesforce/apex/ListingManagerController.getForm';
import { NavigationMixin } from 'lightning/navigation';
import Icons from '@salesforce/resourceUrl/listingManagerIcons';


export default class ListingManager extends NavigationMixin(LightningElement){
    @api objectName = 'MVEX__Listing__c';
    @api recordId;
    @api fieldSet = 'MVEX__ListingManagerFieldSet';
    //Icons
    @track listIcon = Icons + '/ListIcon.png';
    @track tileIcon = Icons + '/TileIcon.png';
    @track mapIcon = Icons + '/MapIcon.png';
    @track arrowUp = Icons + '/arrowUp.png';
    @track leftIcon = Icons + '/left.png'
    @track spinnerShow=true;
    @track showList = true
    @track showTile =false;
    @track showMap = false;
    @track listingData = [];
    @track unchangedListingData = [];
    @track fields = [];
    @track processedListingData = [];    
    @track unchangedProcessListings = [];    
    @track sortField = '';
    @track sortOrder = 'asc';
    @track totalSelected=0;
    @track selectedProperties;
    @track selectedListingData;
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 30;
    @track totalPages;
    @track shownProcessedListingData = [];
    @track wrapOn = false;
    @track propertyMediaUrls = [];
     /**
    * Method Name : checkAll
    * @description : handle the checkAll checkbox in list view.
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    get checkAll() {
        return this.processedListingData.every(item => item.isChecked);
    }

     /**
    * Method Name : showSection
    * @description : getter for the show no result found text when shownProcessedListingData.length === 0.
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    get showSection() {
        return this.shownProcessedListingData.length === 0;
    }

     /**
    * Method Name : connectedCallback
    * @description : retrieve fields name from the field-set and retrieve listing records.
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    connectedCallback(){
        loadStyle(this, designcss);
        this.loadFormData();
        this.getListingData();
    }

     /**
    * Method Name : getListingData
    * @description : retrieve the data listing data from the salesforce
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    getListingData(){
        this.spinnerShow = true;
        getListingData()
            .then(result => {
                
                this.listingData = result.listings;
                this.propertyMediaUrls = result.medias;
                this.listingData.forEach((listing)=>{
                    const prop_id = listing.MVEX__Property__c;
                    listing.media_url = this.propertyMediaUrls[prop_id] ? this.propertyMediaUrls[prop_id] : '/resource/MVEX__blankImage';
                    listing.isChecked = false;
                })
                this.unchangedListingData = this.listingData;
                this.processListings();
            })
            .catch(error => {
                console.warn('error ->'+error);
            });
        
    }

    /**
    * Method Name : processListings
    * @description : set the listing data inorder of the fields data
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    processListings() {
        // Process the listing data and create the required data structure
        this.processedListingData = this.listingData.map(listing => {
            // For each listing, map the fields to create an array of ordered fields
            let orderedFields = this.fields.map(field => {
                return {
                    fieldName: field.fieldName,
                    value: listing[field.fieldName] || '' // Get the value of each field from the listing data
                };
            });
            // Return the listing with its processed ordered fields
            return {
                Id: listing.Id,
                Name: listing.Name,
                media_url: listing.media_url,
                Listing_Price__c:listing.MVEX__Listing_Price__c,
                isChecked: listing.isChecked,
                orderedFields
            };
        });
        this.unchangedProcessListings = this.processedListingData;
        this.totalPages = Math.ceil(this.processedListingData.length / this.pageSize);
        this.spinnerShow = false;
        this.updateProcessedListingData();
        this.updatePaginationButtons();
    }

    
    /**
    * Method Name : loadFormData
    * @description : retrieve the fields data from the salesforce
    * 3/06/2024
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
            .finally(() => {

            });
    }

    /**
    * Method Name : handleFilteredListings
    * @description : set the data comming from the filter cmp
    * Date: 14/06/2024
    * Created By:Vyom Soni
    */
    handleFilteredListings(event){
        const filteredListing = event.detail;
        this.processedListingData = this.unchangedProcessListings;
        this.listingData = this.unchangedListingData;
        this.processedListingData = this.processedListingData.filter(processListing =>
            filteredListing.some(filtered => filtered.Id === processListing.Id)
        );
        this.listingData = this.listingData.filter(processListing => 
            filteredListing.some(filter =>filter.Id === processListing.Id)
        );
        this.totalPages = Math.ceil(this.processedListingData.length / this.pageSize);
        if(this.totalPages == 0){
            this.totalPages = 1;
        }
        this.pageNumber = 1;
        this.updateProcessedListingData();
        this.updateSelectedProperties();
        this.updatePaginationButtons();
    }


    //handle data from the tile cmp
    /**
    * Method Name : handleListingSelect
    * @description : handle data from the tile cmp
    * Date: 14/06/2024
    * Created By:Vyom Soni
    */
    handleListingSelect(event){
        // console.log('Hi');
        this.processedListingData = event.detail;
        this.updateProcessedListingData();
        this.updateSelectedProperties();
    }


     /**
    * Method Name : handleMenuTabClick
    * @description : handle the menu clicks in the header
    *  Date: 3/06/2024
    * Created By:Vyom Soni
    */
     handleMenuTabClick(evt){
        let target = evt.currentTarget.dataset.tabId;
        this.showList = false;
        this.showTile = false;
        this.showMap = false;
        if(target == "1"){
            this.showList = true;
        }else if(target == "2"){
            this.showTile = true;
        }else if(target == "3"){
            this.showMap = true;
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
    * @description : redirect to listing record recordPage
    * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    redirectToRecord(event){
        const recordId = event.target.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'MVEX__Listing__c', 
                actionName: 'view'
            }
        });
    }

    /**
    * Method Name : checkBoxValueChange
    * @description : handle the checkbox change
    * date: 3/06/2024
    * Created By:Vyom Soni
    */
    checkBoxValueChange(event){
        try{
            const checkboxId = Number(event.target.dataset.id);
            this.shownProcessedListingData[checkboxId].isChecked = event.target.checked;
            this.processedListingData.forEach(item1=>{
                this.shownProcessedListingData.forEach(item2=>{
                    if(item1.Id == item2.Id){
                        item1.isChecked = item2.isChecked;
                    }
                })
               })
            this.unchangedProcessListings.forEach(item1=>{
                this.shownProcessedListingData.forEach(item2=>{
                    if(item1.Id == item2.Id){
                        item1.isChecked = item2.isChecked;
                    }
                })
               })
            this.listingData.forEach(item1=>{
                this.shownProcessedListingData.forEach(item2=>{
                    if(item1.Id == item2.Id){
                        item1.isChecked = item2.isChecked;
                    }
                })
               })
        }catch (e){
            console.warn('error ->'+e);
        }
        this.updateSelectedProperties();
    }

      /**
    * Method Name : selectAllCheckbox
    * @description : select the all checkbox
    * date: 3/06/2024
    * Created By:Vyom Soni
    */
    selectAllCheckbox(event){
        const isChecked = event.target.checked;
        this.listingData = this.listingData.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.processedListingData = this.processedListingData.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.unchangedProcessListings = this.unchangedProcessListings.map(item => {
            return { ...item, isChecked: isChecked };
        });
        
        this.updateProcessedListingData();
        this.updateSelectedProperties();
    }

    
      /**
    * Method Name : goTONewListing
    * @description : Redirect the new listing page
    * date: 3/06/2024
    * Created By:Vyom Soni
    */
    goTONewListing(){
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'MVEX__Listing__c',
                actionName: 'new'
            }
        });
    }

    /**
    * Method Name : updateSelectedProperties
    * @description : update the properties as selected
    * date: 3/06/2024
    * Created By:Vyom Soni
    */
    updateSelectedProperties() {
        this.selectedProperties = this.processedListingData.filter(listing => listing.isChecked);
        this.selectedListingData = this.listingData.filter(listing => listing.isChecked);
        this.totalSelected = this.selectedProperties.length;
    }


    /**
    * Method Name : sortClick
    * @description : this methods apply the sorting on the all fields
    * date: 3/06/2024
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
    * date: 3/06/2024
    * Created By:Vyom Soni
    */
    sortData() {
        this.shownProcessedListingData = [...this.shownProcessedListingData].sort((a, b) => {
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
    * date : 3/06/2024
    * Created By:Vyom Soni
    */
     updateSortIcons() {
        const allHeaders = this.template.querySelectorAll('.slds-icon-utility-arrowdown img');
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
    * Method Name : updateProcessedListingData
    * @description : this method update shown listing in pagination
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    updateProcessedListingData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.shownProcessedListingData = this.processedListingData.slice(start, end);
    }

      /**
    * Method Name : updatePaginationButtons
    * @description : update the pagination buttons
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    updatePaginationButtons() {
        this.isPrevDisabled = this.pageNumber === 1;
        this.isNextDisabled = this.pageNumber === this.totalPages;
    }

       /**
    * Method Name : goToPrevFeaturedProperty
    * @description : handle the back button click in the  pagination
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    goToPrevFeaturedProperty() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updateProcessedListingData();
            this.updatePaginationButtons();
            setTimeout(() => {
                this.scrollToTop();
            }, 0);
        }
    }

       /**
    * Method Name : goToNextFeaturedProperty
    * @description : handle the next button click in the  pagination
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    goToNextFeaturedProperty() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updateProcessedListingData();
            this.updatePaginationButtons();
            setTimeout(() => {
                this.scrollToTop();
            }, 0);
        }
    }

         /**
    * Method Name : scrollToTop
    * @description : scroll to top in list
    * * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    scrollToTop() {
        const tableDiv = this.template.querySelector('.tableDiv');
        if (tableDiv) {
            tableDiv.scrollTop = 0; 
        }
    }


    /**
    * Method Name : wrapFilter
    * @description : this method is used for the wrap the filter
    * date: 3/06/2024
    * Created By:Vyom Soni
    */
    wrapFilter() {
        if (this.wrapOn) {
            const svgElement = this.template.querySelector('.innerDiv1 .filterWrap img');
            svgElement.classList.remove('imgRotate');

            const filterDiv = this.template.querySelector('.innerDiv1 .filterDiv');
            filterDiv.classList.remove('removeInnerDiv1');

            const div1 = this.template.querySelector('.innerDiv1');
            div1.style.width = '30%';

            const div2 = this.template.querySelector('.innerDiv2');
            div2.style.width = '70%';

            this.wrapOn = false;
        } else {
            const svgElement = this.template.querySelector('.innerDiv1 .filterWrap img');
            svgElement.classList.add('imgRotate');

            const filterDiv = this.template.querySelector('.innerDiv1 .filterDiv');
            filterDiv.classList.add('removeInnerDiv1');

            const div1 = this.template.querySelector('.innerDiv1');
            div1.style.width = 'fit-content';

            const div2 = this.template.querySelector('.innerDiv2');
            div2.style.width = '100%';

            this.wrapOn = true;
        }
    }
}