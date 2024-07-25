import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getProperties from '@salesforce/apex/PropertySearchController.getProperties';
import NoImageFound from '@salesforce/resourceUrl/blankImage';
import propertyIcons from '@salesforce/resourceUrl/PropertyIcons';
import location_icon from '@salesforce/resourceUrl/location_icon';
import mapCss_V1 from '@salesforce/resourceUrl/mapCss_V1';
import { loadStyle } from 'lightning/platformResourceLoader';
import getListingTypes from '@salesforce/apex/PropertySearchController.getListingTypes';

const PAGE_SIZE = 6;

export default class DisplayProperties extends NavigationMixin(LightningElement) {
    @api recordId;
    @track mapMarkers = [];
    @track pageNumber = 1;
    @track totalRecords = 0;
    @track properties = [];
    @track currentPage = 1;
    @track searchTerm = '';
    @track filterData = {
        city :'',
        bedrooms : '',
        bathrooms : '',
        minPrice : '',
        maxPrice : '',
        zipcode : '',
        listingType : ''
    };

    @track bathroom_icon = propertyIcons + '/PropertyIcons/Bathroom.png';
    @track bedroom_icon = propertyIcons + '/PropertyIcons/Bedroom.png';
    @track area_icon = propertyIcons + '/PropertyIcons/Area.png';
    @track location_icon = location_icon;
    @track filteredListingData = [];
    @track pagedFilteredListingData = [];
    @track listingData = [];
    @track propertyMediaUrls;
    @track isPropertyAvailable = true;
    @track selectedView = 'Grid'; 
    @track listingTypeOptions = [];

    viewOptions = [
        { label: 'Grid', value: 'Grid' },
        { label: 'List', value: 'List' },
        { label: 'Map View', value: 'map' }
    ];

    get columnClass() {
        const screenWidth = window.innerWidth;
        if (screenWidth >= 992) {
            return 'slds-col slds-size--1-of-4'; // 4 columns for large screens
        } else if (screenWidth >= 768) {
            return 'slds-col slds-size--1-of-3'; // 3 columns for medium screens
        } else {
            return 'slds-col slds-size--1-of-2'; // 2 columns for small screens
        }
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
        return Math.ceil(this.totalProperties / PAGE_SIZE);
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    get pagedProperties() {
        const startIndex = (this.currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return this.pagedFilteredListingData.slice(startIndex, endIndex);
    }

    /**
    * Method Name: ConnectedCallback
    * @description: Standard ConnectedCallback method which executes when the component is loaded and it is calling apex to fetch all the properties and loading map library
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    connectedCallback() {
        this.fetchProperties();
        this.fetchListingTypes();
        loadStyle(this, mapCss_V1)
            .then(() => {
                console.log('CSS loaded2');
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
            });
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to get all properties data from the apex and update the property list to display them
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    fetchProperties() {
        getProperties({ recordId: this.recordId})
            .then(result => {
                this.filteredListingData = result.listings;
                this.listingData = result.listings;
                this.propertyMediaUrls = result.medias;
                this.listingData.forEach(row => {
                    const prop_id = row.Property__c;
                    row.media_url = this.propertyMediaUrls[prop_id];
                    console.log(row.media_url);
                });
                this.filteredListingData.forEach(row => {
                    const prop_id = row.Property__c;
                    row.media_url = row.rimary_Image_URL__c ? row.Primary_Image_URL__c : (this.propertyMediaUrls[prop_id] ? this.propertyMediaUrls[prop_id] : NoImageFound);
                    row.Listing_Price__c = row.Listing_Price__c ? row.Listing_Price__c : 'TBD';
                    row.Listing_Type__c = row.Listing_Type__c ? row.Listing_Type__c : 'Sale';
                    row.Bedrooms__c = row.Bedrooms__c ? row.Bedrooms__c : 0;
                    row.Bathrooms__c = row.Bathrooms__c ? row.Bathrooms__c : 0;
                });
                this.pagedFilteredListingData = this.filteredListingData;
                this.totalRecords = this.pagedFilteredListingData.length;
                console.log(this.totalRecords);
                this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
                this.updateMapMarkers();
            })
            .catch(error => {
                console.error('Error getting properties from apex:', error);
            });
    }

    fetchListingTypes() {
        getListingTypes()
            .then(result => {
                this.listingTypeOptions = result.map(type => ({ label: type, value: type }));
            })
            .catch(error => {
                console.error(error);
            });
    }


    /**
    * Method Name: updateMapMarkers
    * @description: this method is used to update and set the markers on the map for the properties with the pagination
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    updateMapMarkers() {
        try{
        const startIndex = (this.currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const currentPageData = this.pagedFilteredListingData.slice(startIndex, endIndex);

        this.mapMarkers = currentPageData.map(listing => {
            console.log('listing.City__c:-> ',listing.City__c,' listing.Name:-> ',listing.Name);
            return {
                id: listing.Id,
                location: {
                    Street: listing.Street__c,
                    City: listing.City__c,
                    State: listing.State__c,
                    Country: listing.Country__c
                },
                title: listing.Name,
                description: `City: ${listing.City__c}, Sq Ft: ${listing.Sq_Ft__c}`,
                icon: 'custom:custom26', // Set custom marker icon
                media_url: listing.media_url // Set media URL for the image
            };
        });
    }catch(error){
        console.log('error--->',error);
    }
        // this.pagedFilteredListingData = this.listingData;
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.filterData[field] = event.target.value;
        console.log('filterdata ==> ' , JSON.stringify(this.filterData));
    }
    
    /**
    * Method Name: applyFilters
    * @description: this method is used to filter the original list of properties and store the filtered properties in the pagedFilteredListingData
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */

    applyFilters() {

        const { listingType, minPrice, maxPrice, bedrooms, bathrooms, city, zipcode } = this.filterData;
        // console.log('const { listingType, minPrice, maxPrice, bedrooms, bathrooms, city, zip }  ==>' , { listingType, minPrice, maxPrice, bedrooms, bathrooms, city, zip } );
        console.log('listingType ==> ' , listingType);

        this.pagedFilteredListingData = this.listingData.filter(property => {
            const searchProperty = property.Name.toLowerCase().includes(this.searchTerm)
            const matcheslistingType = !listingType || property.Listing_Type__c == listingType;
            const matchesPrice = (minPrice != 0 ? property.Listing_Price__c >= minPrice ? true : false : true) &&
                (maxPrice != 0 ? property.Listing_Price__c <= maxPrice ? true : false : true)
            const matchesBedrooms = bedrooms != 0 ? property.Bedrooms__c == bedrooms ? true : false : true;
            console.log('matchesBedrooms ==> ' , matchesBedrooms);
            const matchesBathrooms = bathrooms != 0 ? property.Bathrooms__c == bathrooms ? true : false : true;
            console.log('matchesBathrooms ==> ' , matchesBathrooms);
            const matchesCity = city != '' ? (property.City__c != undefined && property.City__c != '') ? property.City__c.toLowerCase() == city.toLowerCase() ? true : false : false : true;
            const matchesZipCode = zipcode != '' ? property.Zip_Postal_Code__c != '' ? property.Zip_Postal_Code__c == zip ? true : false : false : true;

            return searchProperty && matcheslistingType && matchesPrice && matchesBedrooms && matchesBathrooms && matchesCity && matchesZipCode;

        });

        this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
        this.currentPage = 1;
        this.totalRecords = this.pagedFilteredListingData.length;
        this.updateMapMarkers();
    }

    /**
    * Method Name: clearFilter
    * @description: this method is used to clear out all the filters and show the original list of properties
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    clearFilter(event) {
        this.isPropertyAvailable = true;
        const filterDataToClear = {
            city :'',
            bedrooms : '',
            bathrooms : '',
            minPrice : '',
            maxPrice : '',
            zipcode : '',
            listingType : ''
        };
        this.filterData = filterDataToClear;
        this.pagedFilteredListingData = this.listingData;
        this.searchTerm = ''
        this.updateMapMarkers();
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to filter the properties based on the search key without overriding other filters
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
        this.currentPage = 1; // Reset to first page on search
        this.totalRecords = this.pagedFilteredListingData.length;
        this.isPropertyAvailable = this.totalRecords > 0;
        this.updateMapMarkers();
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to change the view type for the properties with an option for list, grid and map view
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleViewChange(event) {
        this.selectedView = event.detail.value;
        if (this.selectedView === 'map') {
            this.pageNumber = 1; // Reset page number when switching to map view
        }
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to navigate to listing record page on click of view more
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    navigateToRecord(event) {
        const recordId = event.currentTarget.dataset.id;
        console.log(recordId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'view'
            }
        });
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to go to first page of pagination
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToFirst() {
        this.currentPage = 1;
        this.scrollToTop();
        this.updateMapMarkers();
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to go to previous page of pagination
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToPrevious() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.scrollToTop();
            this.updateMapMarkers();
        }
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to go to next page of pagination
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.scrollToTop();
            this.updateMapMarkers();
        }
    }

    /**
    * Method Name: fetchProperties
    * @description: this method is used to go to last page of pagination
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    goToLast() {
        this.currentPage = this.totalPages;
        this.scrollToTop();
        this.updateMapMarkers();
    }

    /**
    * Method Name: scrollToTop
    * @description: this method is used to scroll the page automatically to the top on click of any pagination buttons
    * Date: 26/06/2024
    * Created By: Mitrajsinh Gohil
    */
    scrollToTop() {
        const scrollOptions = {
            left: 0,
            top: 0,
            behavior: 'smooth'
        }
        window.scrollTo(scrollOptions);
    }
}
