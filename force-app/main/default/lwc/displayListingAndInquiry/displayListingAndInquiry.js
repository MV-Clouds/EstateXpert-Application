import { LightningElement, track ,wire} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRecords from '@salesforce/apex/PropertySearchController.getRecords';
import NoImageFound from '@salesforce/resourceUrl/blankImage';
import propertyIcons from '@salesforce/resourceUrl/PropertyIcons';
import location_icon from '@salesforce/resourceUrl/location_icon';
import mapCss_V1 from '@salesforce/resourceUrl/mapCss_V1';
import { loadStyle } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import getMetadata from '@salesforce/apex/DynamicMappingCmp.getMetadata';

export default class DisplayListingAndInquiry extends NavigationMixin(LightningElement) {
    @track recordId;
    
    @track mapMarkers = [];
    @track totalRecords = 0;
    @track properties = [];
    @track currentPage = 1;
    @track searchTerm = '';
    @track isLoading = false;
    @track pageSize = 6;
    @track bathroom_icon = propertyIcons + '/PropertyIcons/Bathroom.png';
    @track bedroom_icon = propertyIcons + '/PropertyIcons/Bedroom.png';
    @track location_icon = location_icon;
    @track filteredListingData = [];
    @track pagedFilteredListingData = [];
    @track listingData = [];
    @track propertyMediaUrls;
    @track isPropertyAvailable = true;
    @track selectedView = 'Grid'; 
    @track filters = '';
    @track isAutoSync = false;
    @track logicalExpression = '';
    
    @track NoImageFoundUrl = NoImageFound;

    get gridButtonClass() {
        return this.isGridView ? 'slds-button slds-button_brand' : 'slds-button slds-button_neutral';
    }

    get listButtonClass() {
        return this.isListView ? 'slds-button slds-button_brand' : 'slds-button slds-button_neutral';
    }

    get mapButtonClass() {
        return this.isMapView ? 'slds-button slds-button_brand' : 'slds-button slds-button_neutral';
    }

    get isListView() {
        return this.selectedView === 'List';
    }

    get isMapView() {
        return this.selectedView === 'map';
    }

    get isGridView() {
        return this.selectedView === 'Grid';
    }

    get totalProperties() {
        return this.pagedFilteredListingData.length;
    }

    get totalPages() {
        return Math.ceil(this.totalProperties / this.pageSize);
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    get pagedProperties() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.pagedFilteredListingData.slice(startIndex, startIndex + this.pageSize);
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
    * @description: Standard ConnectedCallback method which executes when the component is loaded and it is calling apex to fetch all the properties and loading map library
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    * Last modified by : Rachit Shah
    */
    connectedCallback() {
        console.log('Object Name ==> ' , this.objectName);
        console.log('recordId ==> ' , this.recordId);

        this.isLoading = true;
        this.fetchMetadataRecords();
        loadStyle(this, mapCss_V1)
            .then(() =>{
                console.log('CSS loaded');
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
                this.isLoading = false;
            });
    }
    applyFiltersData() {
        try {
            if (this.objectName === 'Listing__c') {
                // Parse conditions from filters
                const conditions = this.filters.map((filter) => {
                    const [field, operator, value] = filter.split(':');
                    return { field, operator, value: value.toLowerCase() };
                });
    
                // Ensure there's at least one listing and inquiry
                if (this.listingData.length === 0 || this.inquiryData.length === 0) {
                    this.pagedFilteredListingData = [];
                    this.isPropertyAvailable = false;
                    this.totalRecords = 0;
                    this.currentPage = 1;
                    this.updateMapMarkers();
                    return;
                }
    
                console.log('listingData ==> ' , this.listingData.length);
                const filteredListings = this.inquiryData.filter(property => {
                    return conditions.every(condition => {
                        const { field, operator, value } = condition;
                        const propertyValue = property[value] ? property[value] : '';
                        console.log('propertyValue ==> ' , propertyValue);

                        const listing = this.listingData[0];
                        console.log('listing ==> ' , listing);
                        console.log('value ==> ' ,field);
                        const actualValue = listing[field];
                        console.log('actualValue ==> ' , actualValue);
    
                        switch (operator) {
                            case 'equalTo':
                                return propertyValue === actualValue;
                            case 'contains':
                                return propertyValue.includes(actualValue);
                            case 'greaterThan':
                                return parseFloat(propertyValue) > parseFloat(value);
                            case 'lessThan':
                                return parseFloat(propertyValue) < parseFloat(value);
                            default:
                                return false;
                        }
                    });
                });
    
                if (this.logicalExpression) {
                    const logicalResults = filteredListings.map(property => {
                        const conditionsResults = conditions.map(condition => {
                            const { field, operator, value } = condition;
                            const propertyValue = property[field] ? property[field].toLowerCase() : '';

    
                            switch (operator) {
                                case 'equalTo':
                                    return propertyValue === value;
                                case 'contains':
                                    return propertyValue.includes(value);
                                case 'greaterThan':
                                    return parseFloat(propertyValue) > parseFloat(value);
                                case 'lessThan':
                                    return parseFloat(propertyValue) < parseFloat(value);
                                default:
                                    return false;
                            }
                        });
                        return this.evaluateLogicalExpression(this.logicalExpression, conditionsResults);
                    });
    
                    this.pagedFilteredListingData = filteredListings.filter((_, index) => logicalResults[index]);
                } else {
                    this.pagedFilteredListingData = filteredListings;
                }
    
                this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
                this.totalRecords = this.pagedFilteredListingData.length;
                this.currentPage = 1;
    
                this.updateMapMarkers();
            }
        } catch (error) {
            console.log('Error applying filters:', error);
            this.showToast('Error', 'Error applying filters', 'error');
        }
    }
    
    
    evaluateLogicalExpression(expression, results) {
        try {
            const expressionToEvaluate = expression.replace(/\d+/g, match => {
                const index = parseInt(match) - 1;
                return results[index] ? 'true' : 'false';
            });
    
            return eval(expressionToEvaluate);
        } catch (error) {
            console.error('Error evaluating expression:', error);
            return false;
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
    * @description: this method is used to get all properties data from the apex and update the property list to display them
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    * Last modified by : Rachit Shah
    */

    fetchListings() {
        getRecords({ recId: this.recordId, objectName: this.objectName })
            .then(result => {
                console.log('result ==> ', result);
    
                const data = result;
    
                if (this.objectName === 'Listing__c') {
                    this.listingData = data.listings;
                    this.inquiryData = data.inquiries || [];
                    console.log('Listing Data ==> ', this.listingData);
                    console.log('Inquiries ==> ', this.inquiryData);
                } else if (this.objectName === 'Inquiry__c') {
                    const inquiry = data.inquiryRec;
                    console.log('Inquiry Rec ==> ', inquiry);
                }
    
                this.applyFiltersData();
                this.updateMapMarkers();
            })
            .catch(error => console.error('Error getting properties from apex:', error));
    }
    /**
    * Method Name: updateMapMarkers
    * @description: this method is used to update and set the markers on the map for the properties with the pagination
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    * Last modified by : Rachit Shah
    */
    updateMapMarkers() {

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const currentPageData = this.pagedFilteredListingData.slice(startIndex, startIndex + this.pageSize);

        this.mapMarkers = currentPageData.map(listing => ({
            id: listing.Id,
            location: {
                Street: listing.Street__c,
                City: listing.City__c,
                State: listing.State__c,
                Country: listing.Country__c
            },
            title: listing.Name,
            description: `City: ${listing.City__c}, Sq Ft: ${listing.Sq_Ft__c}`,
            icon: 'custom:custom26',
            media_url: listing.media_url
        }));

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
        this.totalRecords = this.pagedFilteredListingData.length;
        this.isPropertyAvailable = this.totalRecords > 0;
        this.applyFilters();
        this.updateMapMarkers();
    }

    /**
    * Method Name: applyFilters
    * @description: this method is used apply filter
    * Date: 25/07/2024
    * Created By: Rachit Shah
    */
    applyFilters() {
        try {
    
            this.pagedFilteredListingData = this.listingData.filter(property => {
                const searchProperty = property.Name.toLowerCase().includes(this.searchTerm);
                return searchProperty;
            });
    
            this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
            this.currentPage = 1;
            this.totalRecords = this.pagedFilteredListingData.length;

            this.updateMapMarkers();
        } catch (error) {
            console.log('Error ==> ', error);
            console.log(JSON.stringify(err));
        }
    }

    /**
    * Method Name: setGridView
    * @description: this method is used to set grid view
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    setGridView() {
        this.selectedView = 'Grid';
        this.currentPage = 1;
    }

    /**
    * Method Name: setListView
    * @description: this method is used to set list view
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    setListView() {
        this.selectedView = 'List';
        this.currentPage = 1;
    }

    /**
    * Method Name: setMapView
    * @description: this method is used to set map view
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    setMapView() {
        this.selectedView = 'map';
        this.currentPage = 1;
        this.updateMapMarkers();
    }

    /**
    * Method Name: navigateToRecord
    * @description: this method is used to navigate to listing record page on click of view more
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    navigateToRecord(event) {
        const propertyId = event.target.dataset.id;
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: propertyId,
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
        this.updateMapMarkers();
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
            this.updateMapMarkers();
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
            this.updateMapMarkers();
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
        this.updateMapMarkers();
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