import { LightningElement,track,api} from 'lwc';
import icons from '@salesforce/resourceUrl/listingManagerIcons';
import { loadStyle } from 'lightning/platformResourceLoader';
import designcss from '@salesforce/resourceUrl/listingManagerCss';
import imagee from '@salesforce/resourceUrl/image';
import getListingData from '@salesforce/apex/ListingManagerController.getListingData';
import getForm from '@salesforce/apex/ListingManagerController.getForm';
import { NavigationMixin } from 'lightning/navigation';
import blankImage from '@salesforce/resourceUrl/blankImage';


export default class ListingManager extends NavigationMixin(LightningElement){
    @api objectName = 'Listing__c';
    @track spinnerShow=true;
    @api recordId;
    @api fieldSet = 'ListingManagerFieldSet';
    @track listviewIcon = icons + 'listview.png';
    @track tileviewIcon = icons + 'tileview.png';
    @track mapviewIcon = icons + 'mapview.png';
    @track images = imagee;
    @track showList = true
    @track showTile =false;
    @track showMap = false;
    @track listingData;
    @track fields;
    @track processedListingData = [];    
    @track unchangedProcessListings = [];    
    @track blankImage = blankImage;
    @track sortField = '';
    @track sortOrder = 'asc';
    @track totalSelected=0;
    @track selectedProperties;
    @track selctedListingData;
    @track checkAll = false;
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 30;
    @track totalPages;
    @track shownProcessedListingData = [];
    @track wrapOn = false;
    @track propertyMediaUrls = [];

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
                console.log('result-->',result);
                this.listingData = result.listings;
                this.propertyMediaUrls = result.medias;
                this.listingData.forEach((listing)=>{
                    const prop_id = listing.Property__c;
                    console.log('prop_id-->',prop_id);
                    listing.media_url = this.propertyMediaUrls[prop_id] ? this.propertyMediaUrls[prop_id] : '/resource/blankImage';
                    listing.isChecked = false;
                    console.log('property Image'+this.propertyMediaUrls[prop_id]);
                })
                console.log(JSON.stringify(this.listingData));
                this.processListings();
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
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
                Listing_Price__c:listing.Listing_Price__c,
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
                console.log('Data:'+ JSON.stringify(result));
                if (result) {
                    this.fields = result.fieldsData;
                    console.log(this.fields);
                }
                // this.isLoading = false;
            })
            .catch(error => {
                console.log(error);
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
        this.processedListingData = this.processedListingData.filter(processListing =>
            filteredListing.some(filtered => filtered.Id === processListing.Id)
        );
        this.totalPages = Math.ceil(this.processedListingData.length / this.pageSize);
        if(this.totalPages == 0){
            this.totalPages = 1;
        }
        this.pageNumber = 1;
        this.updateProcessedListingData();
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
        console.log('Hi');
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
        console.log('hi'+recordId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Listing__c', 
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
            // this.listingData[checkboxId].isChecked = event.target.checked;
            this.shownProcessedListingData[checkboxId].isChecked = event.target.checked;
            this.processedListingData.forEach(item1=>{
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
            console.log('error'+e);
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
        this.checkAll = !this.checkAll;
        console.log('hi'+isChecked);
        this.listingData = this.listingData.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.processedListingData = this.processedListingData.map(item => {
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
                objectApiName: 'Listing__c',
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
        this.selctedListingData = this.listingData.filter(listing => listing.isChecked);
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
            const svgElement = this.template.querySelector('.innerDiv1 .filterWrap svg');
            svgElement.classList.remove('svgRotate');

            const filterDiv = this.template.querySelector('.innerDiv1 .filterDiv');
            filterDiv.classList.remove('removeInnerDiv1');

            const div1 = this.template.querySelector('.innerDiv1');
            div1.style.width = '30%';

            const div2 = this.template.querySelector('.innerDiv2');
            div2.style.width = '70%';

            this.wrapOn = false;
        } else {
            const svgElement = this.template.querySelector('.innerDiv1 .filterWrap svg');
            svgElement.classList.add('svgRotate');

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