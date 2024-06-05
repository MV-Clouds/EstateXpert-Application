import { LightningElement,track,api} from 'lwc';
import blankImage from '@salesforce/resourceUrl/blankImage';
import getListingData from '@salesforce/apex/ListingManagerController.getListingData';
import { NavigationMixin } from 'lightning/navigation';

export default class ListingManagerTileViewCmp extends NavigationMixin(LightningElement) {
    @track listingData;
    @track blankImage = blankImage;
    @api listings = [];
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 6;
    @track totalPages;
    @track shownProcessedListingData = [];

    connectedCallback(){
        this.getListingData();
        this.totalPages = Math.ceil(this.listings.length / this.pageSize);
        this.updateProcessedListingData();
        this.updatePaginationButtons();
    }

     /**
    * Method Name : getListingData
    * @description : retrieve the lisitngs from the salesforce
    */
    getListingData(){
        getListingData()
            .then(result => {
                this.listingData = result;
                this.listingData.forEach((listing)=>{
                    listing.isChecked = false;
                    listing.imageUrl__c = listing.imageUrl__c ? listing.imageUrl__c : this.blankImage;
                })
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
            });
    }

    /**
    * Method Name : checkBoxValueChange
    * @description : change the listing state when the checkboxs is updated
    */
    checkBoxValueChange(event){
        const checkboxId = Number(event.target.dataset.id);
        console.log('hi'+typeof checkboxId);
        this.listingData[checkboxId].ischeked = true;
    }

     /**
    * Method Name : redirectToRecord
    * @description : use for the redirect the listing manager to record page of the property
    */
    redirectToRecord(event){
        event.preventDefault();
        const recordId = event.target.dataset.id;
        if(recordId != null){
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
    }

    /**
    * Method Name : updateProcessedListingData
    * @description : use for the pagination
    */
    updateProcessedListingData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.shownProcessedListingData = this.listings.slice(start, end);
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
    
}