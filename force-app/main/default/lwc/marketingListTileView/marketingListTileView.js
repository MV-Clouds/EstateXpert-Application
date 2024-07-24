import { LightningElement,track,api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class MarketingListTileView extends NavigationMixin(LightningElement) {
    @api contacts = [];
    @track isPrevDisabled = true;
    @track isNextDisabled = false;
    @track pageNumber = 1;
    @track pageSize = 30;
    @track totalPages;
    @track shownProcessedContactData = [];

     /**
    * Method Name : get contactsdata
    * @description : get the filtered contact data from MarketinglistCmp component reactively
    * date:24/06/2024
    * Created By: Vyom Soni
    */
     @api
    get contactsdata() {
        return this.contacts;
    }
 
    /**
     * Method Name : set contactsdata
     * @description : set the filtered contact data from contact manager component reactively
     * @param: value- data from the parent component
     * date:24/06/2024
     * Created By: Vyom Soni
    */
    set contactsdata(value) {
            if (value && Array.isArray(value)) {
                if(this.contacts.length != value.length){
                    this.pageNumber = 1;
                }
                 this.contacts = value;
                 this.totalPages = Math.ceil(this.contacts.length / this.pageSize);
                 if(this.totalPages == 0){
                    this.totalPages = 1;
                }
                 this.updateProcessedContactData();
                 this.updatePaginationButtons();
            } else {
                 this.contacts = [];
                 this.pageNumber = 1;
                 this.totalPages = 1;
                 this.shownProcessedContactData = [];
                 this.updatePaginationButtons();
            }   
    }

    /**
    * Method Name : showSection
    * @description : handle error message when no contacts is found in the filtering
    * date:24/06/2024
    * Created By: Vyom Soni
    */
    get showSection() {
        return this.shownProcessedContactData.length === 0;
    }
 
    /**
    * Method Name : connectedCallback
    * @description : update the pagination button and contacts when component loads
    * date:24/06/2024
    * Created By: Vyom Soni
    */
    connectedCallback(){
        this.totalPages = Math.ceil(this.contacts.length / this.pageSize);
        this.updateProcessedContactData();
        this.updatePaginationButtons();
    }

    /**
    * Method Name : setValueInParent
    * @description : set the contact value from the contact manager component
    * date:24/06/2024
    * Created By: Vyom Soni
    */
    setValueInParent(){
          // Create a custom event with the value you want to pass to the parent
          const customEvent = new CustomEvent('valueselected', {
            detail: this.contacts
        });
        
        // Dispatch the custom event
        this.dispatchEvent(customEvent);
    }

    /**
    * Method Name : checkBoxValueChange
    * @description : change the contact state when the checkboxs is updated
    * date:24/06/2024
    * Created By: Vyom Soni
    */
    checkBoxValueChange(event) {
        try {
            const checkboxId = Number(event.target.dataset.id);
            const isChecked = event.target.checked;

            // Update the shownProcessedContactData array
            this.shownProcessedContactData = this.shownProcessedContactData.map((item, index) => {
                if (index === checkboxId) {
                    return { ...item, isChecked: isChecked };
                }
                return item;
            });

            // Sync the changes with the conatcts array
            this.contacts = this.contacts.map(item1 => {
                const matchedItem = this.shownProcessedContactData.find(item2 => item1.Id === item2.Id);
                if (matchedItem) {
                    return { ...item1, isChecked: matchedItem.isChecked };
                }
                return item1;
            });

            // Call the parent update method if necessary
            this.setValueInParent();
        } catch (e) {
            console.error('Error:', e);
        }
    }

     /**
    * Method Name : redirectToRecord
    * @description : use for the redirect the contact manager to record page of the property
    * date:24/06/2024
    * Created By: Vyom Soni
    */
    redirectToRecord(event){
        event.preventDefault();
        const recordId = event.target.dataset.id;
        if(recordId != null){
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recordId,
                    objectApiName: 'Contact', 
                    actionName: 'view'
                }
            });
        }
    }

    /**
    * Method Name : updateProcessedContactData,updatePaginationButtons,goToPrevFeaturedProperty,goToNextFeaturedProperty
    * @description : use for the pagination
    * date:24/06/2024
    * Created By: Vyom Soni
    */
    updateProcessedContactData() {
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.shownProcessedContactData = this.contacts.slice(start, end);
    }

    /**
    * Method Name :updatePaginationButtons
    * @description : update the padigation next prev button
    * Created By: Vyom Soni
    * date:24/06/2024
    */
    updatePaginationButtons() {
        this.isPrevDisabled = this.pageNumber === 1;
        this.isNextDisabled = this.pageNumber === this.totalPages;
    }

     /**
    * Method Name :goToPrevFeaturedProperty
    * @description : update the page number when the prev button is clicked
    * Created By: Vyom Soni
    * date:24/06/2024
    */
    goToPrevFeaturedProperty() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.updateProcessedContactData();
            this.updatePaginationButtons();
            this.scrollToTop();
        }
    }

  /**
    * Method Name :goToNextFeaturedProperty
    * @description : update the page number when the next button is clicked
    * Created By: Vyom Soni
    * date:24/06/2024
    */
    goToNextFeaturedProperty() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.updateProcessedContactData();
            this.updatePaginationButtons();
            this.scrollToTop();
        }
    }

    /**
    * Method Name :scrollToTop
    * @description : scroll to top in tile view
    * Created By: Vyom Soni
    * date:24/06/2024
    */
        scrollToTop() {
            const tableDiv = this.template.querySelector('.mainDiv');
            if (tableDiv) {
                tableDiv.scrollTop = 0; 
            }
        }

}