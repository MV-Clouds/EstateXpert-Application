import { LightningElement, track ,wire , api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRecords from '@salesforce/apex/PropertySearchController.getRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import getMetadata from '@salesforce/apex/DynamicMappingCmp.getMetadata';

export default class displayInquiry extends NavigationMixin(LightningElement) {
    @track recordId;
    @track totalRecords = 0;
    @track inquiries = [];
    @track currentPage = 1;
    @track searchTerm = '';
    @track isLoading = false;
    @track pageSize = 6;
    @track pagedFilteredInquiryData = [];
    @track inquirydata = [];
    @track isInquiryAvailable = true;
    @track filters = '';
    @track isAutoSync = false;
    @track logicalExpression = '';   
    
    @track isShowModal = false;

    @track selectedConditionType = 'Custom Logic Is Met';
    @track mappings = [];

    conditionOptions = [
        { label: 'All Condition Are Met', value: 'All Condition Are Met' },
        { label: 'Any Condition Is Met', value: 'Any Condition Is Met' },
        { label: 'Custom Logic Is Met', value: 'Custom Logic Is Met' }
    ];

    get isCustomLogicSelected() {
        return this.selectedConditionType === 'Custom Logic Is Met';
    }

    get totalinquiries() {
        return this.pagedFilteredInquiryData.length;
    }

    get totalPages() {
        return Math.ceil(this.totalinquiries / this.pageSize);
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    get pagedInquries() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.pagedFilteredInquiryData.slice(startIndex, startIndex + this.pageSize);
    }

    @wire(CurrentPageReference) pageRef;
    get objectName() {
        if (this.pageRef && this.pageRef.attributes) {
            return this.pageRef.attributes.objectApiName;
        }
        return null;
    }

    @wire(CurrentPageReference)
    getPageReferenceParameters(currentPageReference) {
       if (currentPageReference) {
          console.log(currentPageReference);
          this.recordId = currentPageReference.attributes.recordId;
       }
    }

    get isInquiryObject(){
        this.objectName === 'Inquiry__c';
    }

    /**
    * Method Name: ConnectedCallback
    * @description: Standard ConnectedCallback method which executes when the component is loaded and it is calling apex to fetch all the inquiries and loading map library
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    * Last modified by : Rachit Shah
    */
    connectedCallback() {
        console.log('Object Name ==> ' , this.objectName);
        console.log('recordId ==> ' , this.recordId);
        this.fetchMetadataRecords();
        window.addEventListener('click', this.handleOutsideClick.bind(this));

    }



    applyFiltersData(listing) {
        try {
            this.pagedFilteredInquiryData = this.inquirydata;

            console.log('logical expression ==> ' , this.logicalExpression);
            console.log('inquirydata ==> ' , JSON.stringify(this.inquirydata));
    
            console.log('filters ==> ', JSON.stringify(this.filters));
            console.log('listing ==> ', listing);

            if(this.isAutoSync){
                console.log('True');

                this.pagedFilteredInquiryData = this.inquirydata.filter(listing => {
                    let inquiryMaxBedrooms = inquiry.Bedroom_max__c || 0;
                    let inquiryMinBedrooms = inquiry.Bedroom_min__c || 0;
                    let listingBedrooms = listing.Bedrooms__c || 0;
    
                    let inquiryMaxBathrooms = inquiry.Bathroom_max__c || 0;
                    let inquiryMinBathrooms = inquiry.Bathroom_min__c || 0;
                    let listingBathrooms = listing.Bathrooms__c || 0;
    
                    let inquiryAddress = inquiry.Address__c || '';
                    let listingAddress = listing.Address__c || '';
    
                    let inquiryCity = inquiry.City__c || '';
                    let listingCity = listing.City__c || '';
    
                    return (
                        (listingBedrooms >= inquiryMinBedrooms && listingBedrooms <= inquiryMaxBedrooms) 
                        &&
                        (listingBathrooms >= inquiryMinBathrooms && listingBathrooms <= inquiryMaxBathrooms)
                        &&
                        (listingAddress.includes(inquiryAddress) || listingCity.includes(inquiryCity))
                    );
                });

            }

            else{
                const parsedFilters = this.filters.map(filter => {
                    const [object, field, operator, valueField] = filter.split(':');
                    return { object, field, operator, valueField };
                });


                this.mappings = this.filters.map((mappingStr, index) => {
                    const [object, field, operator, valueField] = mappingStr.split(':');
                    
                    if (object === 'Inquiry__c') {
                        return {
                            id: index + 1,
                            field: field,
                            operator: operator,
                            valueField: listing[valueField] ? listing[valueField] : '' ,
                        };
                    } else if (object === 'Listing__c') {
                        return {
                            id: index + 1,
                            field: valueField,
                            operator: this.reverseOperator(operator),
                            valueField: listing[field] ? listing[field] : '',
                        };
                    }
                });
    

        
                if (!this.logicalExpression || this.logicalExpression.trim() === '') {
                    this.logicalExpression = parsedFilters.map((_, index) => index + 1).join(' && ');
                }
                
                this.pagedFilteredInquiryData = this.inquirydata.filter(inquiry => {
                    let filterResults = [];
        
                    parsedFilters.forEach((filter, index) => {
                        let fieldValue, filterValue;
        
                        if (filter.object === 'Inquiry__c') {
                            fieldValue = inquiry[filter.field];
                            filterValue = listing[filter.valueField];
                        } else if (filter.object === 'Listing__c') {
                            fieldValue = listing[filter.field];
                            filterValue = inquiry[filter.valueField];
                        }
    
                        console.log('fieldValue ==> ' , fieldValue , ' filterValue ==>' , filterValue);
                        console.log('operator ==> ' , filter.operator);
                        console.log('object ==> ' , filter.object);
        
                        switch (filter.operator) {
                            case 'lessThan':
                                filterResults[index + 1] = parseFloat(fieldValue) < parseFloat(filterValue);
                                break;
                            case 'greaterThan':
                                filterResults[index + 1] = parseFloat(fieldValue) > parseFloat(filterValue);
                                break;
                            case 'equalTo':
                                filterResults[index + 1] = fieldValue === filterValue;
                                break;
                            case 'contains':
                                filterResults[index + 1] = fieldValue && fieldValue.includes(filterValue);
                                break;
                        }
                    });
        
                    const evaluationResult = eval(this.logicalExpression.replace(/\d+/g, match => filterResults[match]));
                    console.log('evaluationResult ==> ' , evaluationResult);
                    return evaluationResult;
                });
            }

            this.inquirydata = this.pagedFilteredInquiryData;
            console.log('inquirydata ==> ' , JSON.stringify(this.inquirydata));
            this.isInquiryAvailable = this.pagedFilteredInquiryData.length > 0;
            this.totalRecords = this.pagedFilteredInquiryData.length;
            this.currentPage = 1;
    
        } catch (error) {
            console.log('Error applying filters:', error);
            this.showToast('Error', 'Error applying filters', 'error');
        }
    }

    reverseOperator(operator) {
        switch (operator) {
            case 'lessThan':
                return 'greaterThan';
            case 'greaterThan':
                return 'lessThan';
            case 'equalTo':
                return 'equalTo';
            case 'contains':
                return 'contains';
            default:
                return operator; 
        }
    }
    

    fetchMetadataRecords(){
        getMetadata()
        .then((result) => {
            
            if (result && result.length > 0) {
                this.filters = result[0] ? result[0].split(';') : [];
                this.isAutoSync = result[1] === 'true';
                this.logicalExpression = result[2] || '';
            }

            console.log('filters ==> ' , JSON.stringify(result));

            this.fetchListings();
        })
        .catch((error) => {
            console.error('Error fetching metadata:', error);
            this.showToast('Error', 'Error fetching metadata', 'error');
            this.isLoading = false;
        });
    }

    /**
    * Method Name: fetchListings
    * @description: this method is used to get all inquiries data from the apex and update the property list to display them
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    * Last modified by : Rachit Shah
    */

    fetchListings() {
        getRecords({ recId: this.recordId, objectName: this.objectName })
            .then(result => {
                console.log('result ==> ', result);
    
                const data = result;
                let listing = {};
                if (this.objectName === 'Listing__c') {
                    this.inquirydata = data.inquiries;
                    listing = data.listings[0];
                }
    
                this.applyFiltersData(listing);
            })
            .catch(error => console.error('Error getting inquiries from apex:', error));
    }

    /**
    * Method Name: handleSearch
    * @description: this method is used to filter the properties based on the search key without overriding other filters
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */ 
    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.currentPage = 1;
        this.totalRecords = this.pagedFilteredInquiryData.length;
        this.isInquiryAvailable = this.totalRecords > 0;
        this.applyFilters();
    }

    /**
    * Method Name: applyFilters
    * @description: this method is used apply filter
    * Date: 25/07/2024
    * Created By: Rachit Shah
    */
    applyFilters() {
        try {
    
            this.pagedFilteredInquiryData = this.inquirydata.filter(inquiry => {
                const searchInquiry = inquiry.Name.toLowerCase().includes(this.searchTerm);
                return searchInquiry;
            });
    
            this.isInquiryAvailable = this.pagedFilteredInquiryData.length > 0;
            this.currentPage = 1;
            this.totalRecords = this.pagedFilteredInquiryData.length;

        } catch (error) {
            console.log('Error ==> ', error);
            console.log(JSON.stringify(err));
        }
    }

    /**
    * Method Name: navigateToRecord
    * @description: this method is used to navigate to listing record page on click of view more
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    navigateToRecord(event) {
        const inquiryid = event.target.dataset.id;
        console.log('inquiryid ==> ' ,inquiryid);
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: inquiryid,
                actionName: 'view'
            }
        }).then(url => {
            window.open(url, '_blank');
        }).catch(error => {
            console.error('Error generating URL: ', error);
        });
    }

    /**
    * Method Name: goToFirst
    * @description: this method is used to go in first page
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToFirst() {
        this.currentPage = 1;
    }

    /**
    * Method Name: goToPrevious
    * @description: this method is used to go in preious page
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToPrevious() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
        }
    }

    /**
    * Method Name: goToNext
    * @description: this method is used to go in next page
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
        }
    }

    /**
    * Method Name: goToLast
    * @description: this method is used to go in last page
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToLast() {
        this.currentPage = this.totalPages;
    }

    /**
    * Method Name: showToast
    * @description: this method is used to show toast message
    * Date: 26/07/2024
    * Created By: Mitrajsinh Gohil
    */
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }


    showModalBox() {  
        this.isShowModal = true;
    }

    hideModalBox() {  
        this.isShowModal = false;
    }

    handleOutsideClick(event) {
        let isButtonClicked = this.template.querySelector('.open-modal-button').contains(event.target);
        const isClickInsideModal = this.template.querySelector('.slds-modal__container').contains(event.target);

        console.log('isClickInsideModal ==> ' , isClickInsideModal);
        console.log('isModalOpened ==> ' , this.isShowModal);
        console.log('isButtonClicked ==> ' , isButtonClicked);
    
        if (!isClickInsideModal && isButtonClicked) {
            isButtonClicked = false;
            this.hideModalBox();
        }
    }

    handleConditionTypeChange(event) {
        this.selectedConditionType = event.detail.value;
    }

    handleLogicalExpressionChange(event) {
        this.logicalExpression = event.detail.value;
    }

    addCondition() {
        // Logic to add a new condition to the mappings array
        const newMapping = { id: Date.now(), inquiryField: '', operator: '', listingValue: '' };
        this.mappings = [...this.mappings, newMapping];
    }

    applyModalFilters(){
        console.log('filter button is clicked');
    }

    

    disconnectedCallback() {
        // Clean up the event listener when the component is removed
        window.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
    
}