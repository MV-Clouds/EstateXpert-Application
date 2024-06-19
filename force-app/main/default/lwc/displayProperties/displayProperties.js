import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import GetProperties from '@salesforce/apex/PropertySearchController.GetProperties';
import NoImageFound from '@salesforce/resourceUrl/NoImageFound';
import propertyIcons from '@salesforce/resourceUrl/PropertyIcons';
import location_icon from '@salesforce/resourceUrl/location_icon';
import mapCss_V1 from '@salesforce/resourceUrl/mapCss_V1';
import { loadStyle } from 'lightning/platformResourceLoader';

const PAGE_SIZE = 8;

export default class DisplayProperties extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;

    @track mapMarkers = [];
    @track pageNumber = 1;
    @track pageSize = 5;
    @track searchKey = '';
    @track totalRecords = 0;

    @track properties = [];
    @track currentPage = 1;
    @track searchTerm = '';
    @track isModalOpen = false;
    @track filterData = {
        propertyType: '',
        minPrice: 0,
        maxPrice: 0,
        bedrooms: 0,
        bathrooms: 0,
        city: '',
        zipcode: ''
    };
    //@track bathroom_icon = bathroom_icon;
    //@track bedroom_icon = bedroom_icon;
    @track bathroom_icon = propertyIcons + '/PropertyIcons/Bathroom.png';
    @track bedroom_icon = propertyIcons + '/PropertyIcons/Bedroom.png';
    @track area_icon = propertyIcons + '/PropertyIcons/Area.png';
    @track location_icon = location_icon;
    @track FilteredListingData = [];
    @track pagedFilteredListingData = [];
    @track ListingData = [];
    @track propertyMediaUrls;
    @track isPropertyAvailable = true;
    @track isInitalRender = true;
    @track selectedView = 'Grid'; // Default view is Grid

    viewOptions = [
        { label: 'Grid', value: 'Grid' },
        { label: 'List', value: 'List' },
        { label: 'Map View', value: 'map' }
    ];

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

    connectedCallback() {
        this.fetchProperties();
        loadStyle(this, mapCss_V1)
            .then(() => {
                console.log('CSS loaded');
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
            });
    }

    fetchProperties() {
        GetProperties({ RecordId: this.recordId, object_name: this.objectApiName })
            .then(result => {
                this.FilteredListingData = result.Listings;
                this.ListingData = result.Listings;
                this.propertyMediaUrls = result.Medias;
                this.ListingData.forEach(row => {
                    const prop_id = row.Property__c;
                    row.media_url = this.propertyMediaUrls[prop_id];
                    console.log(row.media_url);
                });
                this.FilteredListingData.forEach(row => {
                    const prop_id = row.Property__c;
                    row.media_url = row.Primary_Image_URL__c ? row.Primary_Image_URL__c : (this.propertyMediaUrls[prop_id] ? this.propertyMediaUrls[prop_id] : NoImageFound);
                    row.Listing_Price__c = row.Listing_Price__c ? row.Listing_Price__c : 'TBD';
                    row.Listing_Type__c = row.Listing_Type__c ? row.Listing_Type__c : 'Sale';
                    row.Bedrooms__c = row.Bedrooms__c ? row.Bedrooms__c : 0;
                    row.FullBathrooms__c = row.FullBathrooms__c ? row.FullBathrooms__c : 0;
                });
                this.pagedFilteredListingData = this.FilteredListingData;
                this.totalRecords = this.pagedFilteredListingData.length;
                console.log(this.totalRecords);
                this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
                this.updateMapMarkers();
            })
            .catch(error => {
                console.error('Error getting properties from apex:', error);
            });
    }

    updateMapMarkers() {
        const startIndex = (this.currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const currentPageData = this.pagedFilteredListingData.slice(startIndex, endIndex);

        this.mapMarkers = currentPageData.map(listing => {
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
    }

    doapplyfilters(event) {
        this.filterData = event.detail;
        this.filterProperties();
        this.isModalOpen = false;
    }

    filterProperties() {
        const { propertyType, minPrice, maxPrice, bedrooms, bathrooms, city, zipCode } = this.filterData;


        this.pagedFilteredListingData = this.ListingData.filter(property => {
            const searchProperty = property.Name.toLowerCase().includes(this.searchTerm)
            const matchesPropertyType = !propertyType || property.Listing_Type__c == propertyType;
            const matchesPrice = (minPrice != 0 ? property.Listing_Price__c >= minPrice ? true : false : true) &&
                                 (maxPrice != 0 ? property.Listing_Price__c <= maxPrice ? true : false : true)
            const matchesBedrooms = bedrooms != 0  ? property.Bedrooms__c == bedrooms ? true : false : true;
            const matchesBathrooms = bathrooms!= 0 ? property.FullBathrooms__c == bathrooms ? true : false : true;
            const matchesCity = !city || property.City__c.toLowerCase() == city.toLowerCase();
            const matchesZipCode = !zipCode || property.Zipcode__c == zipCode;

            return searchProperty && matchesPropertyType && matchesPrice && matchesBedrooms && matchesBathrooms && matchesCity && matchesZipCode;
        });



        this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;


        this.currentPage = 1;
        this.totalRecords = this.pagedFilteredListingData.length;
        this.updateMapMarkers();
    }

    handleFilter() {
        this.isModalOpen = !this.isModalOpen;
    }

    clearFilter(event) {
        this.filterData = event.detail;
        this.pagedFilteredListingData = this.ListingData
        this.searchTerm = ''
        this.filterProperties();
        this.isModalOpen = false;
    }

    closeFilter(event){
        this.isModalOpen = false;
    }

    handleSearch(event) {
        console.log('OUTPUT : search:- ',event.target.value);
        this.searchTerm = event.target.value.toLowerCase();
        // this.pagedFilteredListingData
        // this.pagedFilteredListingData = this.ListingData.filter(property =>
        //     property.Name.toLowerCase().includes(this.searchTerm)
        // );
        this.filterProperties();
        this.currentPage = 1; // Reset to first page on search
        this.totalRecords = this.pagedFilteredListingData.length;
        this.isPropertyAvailable = this.totalRecords > 0;
        this.updateMapMarkers();
    }

    handleViewChange(event) {
        this.selectedView = event.detail.value;
        if (this.selectedView === 'map') {
            this.pageNumber = 1; // Reset page number when switching to map view
        }
    }

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

    goToFirst() {
        this.currentPage = 1;
        this.updateMapMarkers();
    }

    goToPrevious() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.updateMapMarkers();
        }
    }

    goToNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.updateMapMarkers();
        }
    }

    goToLast() {
        this.currentPage = this.totalPages;
        this.updateMapMarkers();
    }
}