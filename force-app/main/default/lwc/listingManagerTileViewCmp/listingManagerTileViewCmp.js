import { LightningElement,track,api} from 'lwc';
import blankImage from '@salesforce/resourceUrl/blankImage';
import { NavigationMixin } from 'lightning/navigation';

export default class ListingManagerTileViewCmp extends NavigationMixin(LightningElement) {
    @api listings = [];
    @track blankImage = blankImage;
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 30;
    @track totalPages;
    @track shownProcessedListingData = [];

      /**
    * Method Name : get listingsdata
    * @description : get the filtered listing data from listing manager component reactively
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    @api
    get listingsdata() {
        return this.listings;
    }

      /**
    * Method Name : set listingsdata
    * @description : set the filtered listing data from listing manager component reactively
    * @param: value- data from the parent component
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    set listingsdata(value) {
            if (value && Array.isArray(value)) {
                this.listings = value;
                this.totalPages = Math.ceil(this.listings.length / this.pageSize);
                this.updateProcessedListingData();
                this.updatePaginationButtons();
            } else {
                this.listings = [];
                this.totalPages = 1;
                this.shownProcessedListingData = [];
                this.updatePaginationButtons();
            }   
    }

     /**
    * Method Name : showSection
    * @description : handle error message when no listings is found in the filtering
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    get showSection() {
        return this.shownProcessedListingData.length === 0;
    }
    
    /**
    * Method Name : connectedCallback
    * @description : update the pagination button and listings when component loads
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    connectedCallback(){
        this.totalPages = Math.ceil(this.listings.length / this.pageSize);
        console.log('Listing>'+JSON.stringify(this.listings));
        this.updateProcessedListingData();
        this.updatePaginationButtons();
    }

      /**
    * Method Name : setValueInParent
    * @description : set the listing value from the listing manager component
    * date:4/06/2024
    * Created By: Vyom Soni
    */
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
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    checkBoxValueChange(event) {
        try {
            const checkboxId = Number(event.target.dataset.id);
            const isChecked = event.target.checked;

            // console.log(`Checkbox ID: ${checkboxId}, Checked: ${isChecked}`);

            // Update the shownProcessedListingData array
            this.shownProcessedListingData = this.shownProcessedListingData.map((item, index) => {
                if (index === checkboxId) {
                    // console.log(`Updating shownProcessedListingData at index ${index} with isChecked: ${isChecked}`);
                    return { ...item, isChecked: isChecked };
                }
                return item;
            });

            // console.log('Updated shownProcessedListingData:', JSON.stringify(this.shownProcessedListingData));

            // Sync the changes with the listings array
            this.listings = this.listings.map(item1 => {
                const matchedItem = this.shownProcessedListingData.find(item2 => item1.Id === item2.Id);
                if (matchedItem) {
                    // console.log(`Syncing listing item ID ${item1.Id} with isChecked: ${matchedItem.isChecked}`);
                    return { ...item1, isChecked: matchedItem.isChecked };
                }
                return item1;
            });

            // console.log('Updated listings:', JSON.stringify(this.listings));

            // Call the parent update method if necessary
            this.setValueInParent();
        } catch (e) {
            console.error('Error:', e);
        }
    }

     /**
    * Method Name : redirectToRecord
    * @description : use for the redirect the listing manager to record page of the property
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    redirectToRecord(event){
        event.preventDefault();
        const recordId = event.target.dataset.id;
        if(recordId != null){
            // console.log('hi'+recordId);
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recordId,
                    objectApiName: 'MVEX__Listing__c', 
                    actionName: 'view'
                }
            });
        }
    }

    /**
    * Method Name : updateProcessedListingData,updatePaginationButtons,goToPrevFeaturedProperty,goToNextFeaturedProperty
    * @description : use for the pagination
    * date:4/06/2024
    * Created By: Vyom Soni
    */
    updateProcessedListingData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.shownProcessedListingData = this.listings.slice(start, end);
    }

    /**
    * Method Name :updatePaginationButtons
    * @description : update the padigation next prev button
    * Created By: Vyom Soni
    * date:4/06/2024
    */
    updatePaginationButtons() {
        this.isPrevDisabled = this.pageNumber === 1;
        this.isNextDisabled = this.pageNumber === this.totalPages;
    }

     /**
    * Method Name :goToPrevFeaturedProperty
    * @description : update the page number when the prev button is clicked
    * Created By: Vyom Soni
    * date:4/06/2024
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
    * Method Name :goToNextFeaturedProperty
    * @description : update the page number when the next button is clicked
    * Created By: Vyom Soni
    * date:4/06/2024
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
    * Method Name :scrollToTop
    * @description : scroll to top in tile view
    * Created By: Vyom Soni
    * date:4/06/2024
    */
    scrollToTop() {
        const tableDiv = this.template.querySelector('.mainDiv');
        if (tableDiv) {
            tableDiv.scrollTop = 0; 
        }
    }
    
}