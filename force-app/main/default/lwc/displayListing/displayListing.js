import { LightningElement, api, track ,wire} from 'lwc';
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

export default class DisplayListing extends NavigationMixin(LightningElement) {
    @api recordId;
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
    @track propertyMediaUrls = [];
    @track isPropertyAvailable = true;
    @track selectedView = 'Grid'; 
    @track filters = '';
    @track isAutoSync = false;
    @track logicalExpression = '';

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
        return this.pagedFilteredListingData.slice(startIndex, startIndex + this.pageSize).map(property => {
            return {
                ...property,
                media_url: property.media_url ? property.media_url : NoImageFound
            };
        });
    }
    

    @wire(CurrentPageReference) pageRef;
    get objectName() {
        if (this.pageRef && this.pageRef.attributes) {
            return this.pageRef.attributes.objectApiName;
        }
        return null;
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
        console.log('recordId => ' , this.recordId);
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
        getRecords({ recId: this.recordId , objectName : this.objectName})
            .then(result => {
                console.log('result ==> ' , result);

                const data = result;
                let inquiry = {};
                if (this.objectName === 'Inquiry__c') {
                    this.listingData = data.listings;
                    inquiry = data.inquiries[0];
                }

                this.applyFiltersData(inquiry);
            })
            .catch(error => console.error('Error getting properties from apex:', error));
    }

    applyFiltersData(inquiry) {
        try {
            this.pagedFilteredListingData = this.listingData;
            this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
            this.totalRecords = this.pagedFilteredListingData.length;
            this.currentPage = 1;
    
            console.log('filters ==> ', JSON.stringify(this.filters));
            console.log('inquiry ==> ', inquiry);
    
            let filterResults = {};
    
            this.filters.forEach((filter, index) => {
                console.log(`Processing filter at index ${index}: ${filter}`);
                let [object, field, operation, valueField] = filter.split(':');
    
                console.log(object, field, operation, valueField);
    
                let filteredData = this.pagedFilteredListingData.filter(record => {
                    let recordValue, inquiryValue;
    
                    if (object === 'Inquiry__c') {
                        recordValue = inquiry[field];
                        inquiryValue = record[valueField];
                    } else if (object === 'Listing__c') {
                        recordValue = record[field];
                        inquiryValue = inquiry[valueField];
                    }
    
                    if (recordValue == null || inquiryValue == null) {
                        return false;
                    }
    
                    if (operation === 'contains') {
                        if (typeof recordValue === 'string' && typeof inquiryValue === 'string') {
                            return recordValue.includes(inquiryValue);
                        }
                    } else if (operation === 'equalTo') {
                        return recordValue === inquiryValue;
                    } else if (operation === 'greaterThan') {
                        return parseFloat(recordValue) > parseFloat(inquiryValue);
                    } else if (operation === 'lessThan') {
                        return parseFloat(recordValue) < parseFloat(inquiryValue);
                    }
    
                    return false;
                });
    
                filterResults[index + 1] = filteredData;
            });
    
            console.log('logicalExpression ==> ', this.logicalExpression);
    
            // Evaluate logical expression
            let finalFilteredData = this.evaluateLogicalExpression(filterResults, this.logicalExpression);
    
            this.pagedFilteredListingData = finalFilteredData;
            this.listingData = finalFilteredData;
            this.totalRecords = finalFilteredData.length;
            this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
    
            this.updateMapMarkers();
    
        } catch (error) {
            console.log('Error applying filters:', error);
            this.showToast('Error', 'Error applying filters', 'error');
        }
    }
    
    
    
    evaluateLogicalExpression(filterResults, logicalExpression) {
        try {
            let finalFilteredData = [];
            console.log('filterResults ==> ', JSON.stringify(filterResults));
            console.log('filterResults length ==> ', Object.keys(filterResults).length);
    
            let resultSets = {};
            Object.keys(filterResults).forEach(index => {
                if (filterResults[index] && filterResults[index].length > 0) {
                    console.log(index);
                    resultSets[index] = new Set(filterResults[index].map(item => JSON.stringify(item)));
                    console.log(`Length of resultSets[${index}] ==> `, resultSets[index].size);
                }
            });
    
            console.log('resultSets ==> ', JSON.stringify(resultSets));
    
            let expression = logicalExpression.replace(/\b(\d+)\b/g, match => {
                return resultSets[match] ? `resultSets["${match}"]` : 'new Set()';
            });
    
            console.log('Initial expression ==> ', expression);
    
            expression = expression.replace(/\|\|\s*new Set\(\)\s*\|\|/g, '||');
            expression = expression.replace(/&&\s*new Set\(\)\s*&&/g, '&&');
            expression = expression.replace(/\bnew Set\(\)\s*\|\|\s*new Set\(\)\b/g, 'new Set()');
            expression = expression.replace(/\bnew Set\(\)\s*&&\s*new Set\(\)\b/g, 'new Set()');
            expression = expression.replace(/\bnew Set\(\)\s*\|\|/g, '');
            expression = expression.replace(/\|\|\s*\bnew Set\(\)\b/g, '');
            expression = expression.replace(/\bnew Set\(\)\s*&&/g, '');
            expression = expression.replace(/&&\s*\bnew Set\(\)\b/g, '');
    
            console.log('Cleaned expression ==> ', expression);
    
            let finalSet = new Function('resultSets', `
                let result = new Set();
                let evaluate = (sets) => {
                    if (sets) {
                        if (Array.isArray(sets)) {
                            sets.forEach(set => evaluate(set));
                        } else if (sets instanceof Set) {
                            sets.forEach(item => result.add(item));
                        }
                    }
                };
                let intersection = (set1, set2) => {
                    let result = new Set();
                    set1.forEach(item => {
                        if (set2.has(item)) {
                            result.add(item);
                        }
                    });
                    return result;
                };
                let union = (set1, set2) => {
                    let result = new Set(set1);
                    set2.forEach(item => result.add(item));
                    return result;
                };
                let evaluatedExpression = ${expression};
                evaluate(evaluatedExpression);
                return result;
            `)(resultSets);
    
            console.log('finalSet ==> ', finalSet);
    
            finalFilteredData = Array.from(finalSet).map(item => JSON.parse(item));
            console.log('finalFilteredData ==> ', JSON.stringify(finalFilteredData));
            console.log('finalFilteredData ==> ',finalFilteredData.length);
    
            return finalFilteredData;
    
        } catch (error) {
            console.log('Error evaluating logical expression:', error);
            return [];
        }
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
    * Method Name: applyFilters
    * @description: this method is used apply filter
    * Date: 25/07/2024
    * Created By: Rachit Shah
    */
    applyFilters() {
        try {
    
            this.pagedFilteredListingData = this.listingData.filter(listing => {
                const searchListing = listing.Name.toLowerCase().includes(this.searchTerm);
                return searchListing;
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
    * Method Name: handleSearch
    * @description: this method is used to filter the properties based on the search key without overriding other filters
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */ 
    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
        this.currentPage = 1;
        this.totalRecords = this.pagedFilteredListingData.length;
        this.isPropertyAvailable = this.totalRecords > 0;
        this.updateMapMarkers();
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
