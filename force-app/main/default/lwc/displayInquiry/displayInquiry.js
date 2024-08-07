import { LightningElement, track ,wire} from 'lwc';
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
    }



    applyFiltersData(listing) {
        try {
            this.pagedFilteredInquiryData = this.inquirydata;
            this.isInquiryAvailable = this.pagedFilteredInquiryData.length > 0;
            this.totalRecords = this.pagedFilteredInquiryData.length;
            this.currentPage = 1;
    
            console.log('filters ==> ', JSON.stringify(this.filters));
            console.log('listing ==> ', listing);
    
            let filterResults = [];
    
            this.filters.forEach((filter, index) => {
                console.log(`Processing filter at index ${index}: ${filter}`);
                let [object, field, operation, valueField] = filter.split(':');
                console.log(object);
                console.log(field);
                console.log(operation);
                console.log(valueField);
                console.log(index + 1);
    
                let filteredData = this.pagedFilteredInquiryData.filter(record => {
                    let recordValue, listingValue;
    
                    if (object === 'Inquiry__c') {
                        recordValue = record[field];
                        listingValue = listing[valueField];
                    } else if (object === 'Listing__c') {
                        recordValue = listing[field];
                        listingValue = record[valueField];
                    }
    
                    if (operation === 'contains') {
                        return recordValue && recordValue.includes(listingValue);
                    } else if (operation === 'equalTo') {
                        return recordValue === listingValue;
                    } else if (operation === 'greaterThan') {
                        console.log('1 ==> ' ,parseFloat(recordValue));
                        console.log('2 ==> ' ,parseFloat(listingValue));
                        return parseFloat(recordValue) > parseFloat(listingValue);
                    } else if (operation === 'lessThan') {
                        return parseFloat(recordValue) < parseFloat(listingValue);
                    }
    
                    return false;
                });
    
                filterResults[index+1] = filteredData; 
            });
    
            console.log('logicalExpression ==> ', this.logicalExpression);
    
            // Evaluate logical expression
            let finalFilteredData = this.evaluateLogicalExpression(filterResults, this.logicalExpression);
    
            this.pagedFilteredInquiryData = finalFilteredData;
            this.inquirydata = finalFilteredData;
            this.totalRecords = finalFilteredData.length;
            this.isInquiryAvailable = this.pagedFilteredInquiryData.length > 0;
    
    
        } catch (error) {
            console.log('Error applying filters:', error);
            this.showToast('Error', 'Error applying filters', 'error');
        }
    }
    
    // Function to evaluate the logical expression
    evaluateLogicalExpression(filterResults, logicalExpression) {
        try {
            let finalFilteredData = [];
            console.log('filterResults ==> ', JSON.stringify(filterResults));
    
            // Create sets for each filter result
            let resultSets = {};
            Object.keys(filterResults).forEach(index => {
                if (filterResults[index] && filterResults[index].length > 0) {
                    resultSets[index] = new Set(filterResults[index].map(item => JSON.stringify(item)));
                    console.log(`Length of resultSets[${index}] ==> `, resultSets[index].size);
                }
            });
    
            console.log('resultSets ==> ', JSON.stringify(resultSets));
    
            // Parse logical expression
            let expression = logicalExpression.replace(/\b(\d+)\b/g, match => {
                return resultSets[match] ? `resultSets["${match}"]` : 'new Set()';
            });
            console.log('expression ==> ', expression);
    
            // Evaluate the logical expression
            let finalSet = new Function('resultSets', `
                let result = new Set();
                ${expression.split('||').map(term => `result = new Set([...result, ...${term.trim()}]);`).join('\n')}
                return result;
            `)(resultSets);
    
            console.log('finalSet ==> ', finalSet);
    
            finalFilteredData = Array.from(finalSet).map(item => JSON.parse(item));
            console.log('finalFilteredData ==> ', finalFilteredData);
    
            return finalFilteredData;
    
        } catch (error) {
            console.log('Error evaluating logical expression:', error);
            return [];
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
                } else if (this.objectName === 'Inquiry__c') {
                    const inquiry = data.inquiryRec;
                    console.log('Inquiry Rec ==> ', inquiry);
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
}
