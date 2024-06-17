import { LightningElement,track,api} from 'lwc';
import blankImage from '@salesforce/resourceUrl/blankImage';
import getListingData from '@salesforce/apex/ListingManagerController.getListingData';
import { NavigationMixin } from 'lightning/navigation';

export default class ListingManagerTileViewCmp extends NavigationMixin(LightningElement) {
    @track listingData ;
    @track blankImage = blankImage;
    @api listings = [];
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 6;
    @track totalPages;
    @track shownProcessedListingData = [];

    connectedCallback(){
        // this.getListingData();
        this.totalPages = Math.ceil(this.listings.length / this.pageSize);
        this.updateProcessedListingData();
        this.updatePaginationButtons();
    }

     /**
    * Method Name : getListingData
    * @description : retrieve the lisitngs from the salesforce
    * Created By: Vyom Soni
    */
    // getListingData(){
    //     getListingData()
    //         .then(result => {
    //             this.listingData = result;
    //             this.listingData.forEach((listing)=>{
    //                 listing.isChecked = false;
    //                 listing.imageUrl__c = listing.imageUrl__c ? listing.imageUrl__c : this.blankImage;
    //             })
    //         })
    //         .catch(error => {
    //             this.error = error;
    //             this.data = undefined;
    //         });
    // }
    setValueInParent(){
          // Create a custom event with the value you want to pass to the parent
          const customEvent = new CustomEvent('valueselected', {
            detail: this.listings
        });
        
        // Dispatch the custom event
        this.dispatchEvent(customEvent);
    }

    /**
    * Method Name : checkBoxValueChange
    * @description : change the listing state when the checkboxs is updated
    * Created By: Vyom Soni
    */
    checkBoxValueChange(event) {
        try {
            const checkboxId = Number(event.target.dataset.id);
            const isChecked = event.target.checked;

            console.log(`Checkbox ID: ${checkboxId}, Checked: ${isChecked}`);

            // Update the shownProcessedListingData array
            this.shownProcessedListingData = this.shownProcessedListingData.map((item, index) => {
                if (index === checkboxId) {
                    console.log(`Updating shownProcessedListingData at index ${index} with isChecked: ${isChecked}`);
                    return { ...item, isChecked: isChecked };
                }
                return item;
            });

            console.log('Updated shownProcessedListingData:', JSON.stringify(this.shownProcessedListingData));

            // Sync the changes with the listings array
            this.listings = this.listings.map(item1 => {
                const matchedItem = this.shownProcessedListingData.find(item2 => item1.Id === item2.Id);
                if (matchedItem) {
                    console.log(`Syncing listing item ID ${item1.Id} with isChecked: ${matchedItem.isChecked}`);
                    return { ...item1, isChecked: matchedItem.isChecked };
                }
                return item1;
            });

            console.log('Updated listings:', JSON.stringify(this.listings));

            // Call the parent update method if necessary
            this.setValueInParent();
        } catch (e) {
            console.error('Error:', e);
        }
    }

     /**
    * Method Name : redirectToRecord
    * @description : use for the redirect the listing manager to record page of the property
    * Created By: Vyom Soni
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
    * Method Name : updateProcessedListingData,updatePaginationButtons,goToPrevFeaturedProperty,goToNextFeaturedProperty
    * @description : use for the pagination
    * Created By: Vyom Soni
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

    
}