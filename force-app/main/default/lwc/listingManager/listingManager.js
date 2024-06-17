import { LightningElement,track,api} from 'lwc';
import icons from '@salesforce/resourceUrl/listingManagerIcons';
import { loadStyle } from 'lightning/platformResourceLoader';
import designcss from '@salesforce/resourceUrl/listingManagerCss';
import imagee from '@salesforce/resourceUrl/image';
import getListingData from '@salesforce/apex/ListingManagerController.getListingData';
import getForm from '@salesforce/apex/ListingManagerController.getForm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import blankImage from '@salesforce/resourceUrl/blankImage';


export default class ListingManager extends NavigationMixin(LightningElement){
    @api objectName = 'Listing__c';
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
    @track pageSize = 6;
    @track totalPages;
    @track shownProcessedListingData = [];
    @track wrapOn = false;

    connectedCallback(){
        loadStyle(this, designcss);
        this.loadFormData();
        this.getListingData();
    }

     /**
    * Method Name : getListingData
    * @description : retrieve the data listing data from the salesforce
    * Created By:Vyom Soni
    */
    getListingData(){
        getListingData()
            .then(result => {
                this.listingData = result;
                this.listingData.forEach((listing)=>{
                    listing.isChecked = false;
                    listing.imageUrl__c = listing.imageUrl__c ? listing.imageUrl__c : this.blankImage;
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
                imageUrl__c: listing.imageUrl__c,
                Listing_Price__c:listing.Listing_Price__c,
                isChecked: listing.isChecked,
                orderedFields
            };
        });
        this.unchangedProcessListings = this.processedListingData;
        console.log('Hi1');
        console.log('hi'+JSON.stringify(this.processedListingData));
        this.totalPages = Math.ceil(this.processedListingData.length / this.pageSize);
        this.updateProcessedListingData();
        this.updatePaginationButtons();
    }

    
    /**
    * Method Name : loadFormData
    * @description : retrieve the fields data from the salesforce
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


    //handle the filtered data from the filetr component
    handleFilteredListings(event){
        const filteredListing = event.detail;
        this.processedListingData = this.unchangedProcessListings;
        this.processedListingData = this.processedListingData.filter(processListing =>
            filteredListing.some(filtered => filtered.Id === processListing.Id)
        );
        this.updateProcessedListingData();
        this.updatePaginationButtons();
    }


    //handle data from the tile cmp
    handleListingSelect(event){
        console.log('Hi');
        this.processedListingData = event.detail;
        this.updateProcessedListingData();
        this.updateSelectedProperties();
    }


     /**
    * Method Name : handleMenuTabClick
    * @description : handle the menu clicks in the header
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
    * @description : redirect to recordPage
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
    * Method Name : updateSelectedProperties
    * @description : update the properties as selected
    * Created By:Vyom Soni
    */
    updateSelectedProperties() {
        this.selectedProperties = this.processedListingData.filter(listing => listing.isChecked);
        this.selctedListingData = this.listingData.filter(listing => listing.isChecked);
        this.totalSelected = this.selectedProperties.length;
    }

    selectAllCheckbox(event){
        const isChecked = event.target.checked;
        this.checkAll = !this.checkAll;
        console.log('hi'+isChecked);
        this.listingData = this.listingData.map(item => {
            return { ...item, isChecked: isChecked };
        });
        this.shownProcessedListingData = this.shownProcessedListingData.map(item => {
            return { ...item, isChecked: isChecked };
        });
       this.processedListingData.forEach(item1=>{
        this.shownProcessedListingData.forEach(item2=>{
            if(item1.Id == item2.Id){
                item1.isChecked = item2.isChecked;
            }
        })
       })
        
        this.updateSelectedProperties();
    }

    /**
    * Method Name : sortClick
    * @description : this methods apply the sorting on the all fields
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
    * Method Name : updateProcessedListingData,updatePaginationButtons,goToPrevFeaturedProperty,goToNextFeaturedProperty
    * @description : this all method is used for the pagination in list view
    * Created By:Vyom Soni
    */
    updateProcessedListingData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.shownProcessedListingData = this.processedListingData.slice(start, end);
    }

    updatePaginationButtons() {
        this.isPrevDisabled = this.pageNumber === 1;
        this.isNextDisabled = this.pageNumber === this.totalPages;
    }

    goToPrevFeaturedProperty() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updateProcessedListingData();
            this.updatePaginationButtons();
        }
    }

    goToNextFeaturedProperty() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updateProcessedListingData();
            this.updatePaginationButtons();
        }
    }

    get totalSelected() {
        return this.processedListingData.filter(listing => listing.isChecked).length;
    }

    /**
    * Method Name : wrapFilter
    * @description : this method is used for the wrap the filter
    * Created By:Vyom Soni
    */
    wrapFilter(){
        if(this.wrapOn == true){
            const div1 = this.template.querySelectorAll('.innerDiv1');
            div1.forEach(icon => {
                icon.classList.add('slds-size_4-of-12');
            });
            const div2 = this.template.querySelectorAll('.innerDiv2');
            div2.forEach(icon => {
                icon.classList.add('slds-size_8-of-12');
            });
            const svgElement = this.template.querySelectorAll('.innerDiv1 .filterWrap svg');
            svgElement[0].classList.remove('svgRotate');
            this.wrapOn = false;
            const filterDiv = this.template.querySelectorAll('.innerDiv1 .filterDiv');
            filterDiv.forEach(icon => {
                icon.classList.remove('removeInnerDiv1');
            });
        }else{
            const div1 = this.template.querySelectorAll('.innerDiv1');
            div1.forEach(icon => {
                icon.classList.remove('slds-size_4-of-12');
            });
            const filterDiv = this.template.querySelectorAll('.innerDiv1 .filterDiv');
            filterDiv.forEach(icon => {
                icon.classList.add('removeInnerDiv1');
            });
            const div2 = this.template.querySelectorAll('.innerDiv2');
            div2.forEach(icon => {
                icon.classList.remove('slds-size_8-of-12');
            });
            const svgElement = this.template.querySelectorAll('.innerDiv1 .filterWrap svg');
            svgElement[0].classList.add('svgRotate');
            this.wrapOn = true;
        }
    }
}