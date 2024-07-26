import { LightningElement, api, track ,wire} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getListings from '@salesforce/apex/PropertySearchController.getListings';
import NoImageFound from '@salesforce/resourceUrl/blankImage';
import propertyIcons from '@salesforce/resourceUrl/PropertyIcons';
import location_icon from '@salesforce/resourceUrl/location_icon';
import mapCss_V1 from '@salesforce/resourceUrl/mapCss_V1';
import { loadStyle } from 'lightning/platformResourceLoader';
import getListingTypes from '@salesforce/apex/PropertySearchController.getListingTypes';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
// const PAGE_SIZE = 6;

export default class DisplayProperties extends NavigationMixin(LightningElement) {
    @api recordId;
    @track mapMarkers = [];
    @track totalRecords = 0;
    @track properties = [];
    @track currentPage = 1;
    @track searchTerm = '';
    @track filterData = {
        city: '',
        bedrooms: '',
        bathrooms: '',
        minPrice: '',
        maxPrice: '',
        zipcode: '',
        listingTypes: []
    };
    
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
    @track listingTypeOptions = [];
    @track isInitial = false;

    get isFilterButtonDisabled() {
        const { city, bedrooms, bathrooms, minPrice, maxPrice, zipcode } = this.filterData;
        return !city && !bedrooms && !bathrooms && !minPrice && !maxPrice && !zipcode;
    }

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

    get rentButtonClass() {
        if(this.filterData.listingTypes){
            return this.filterData.listingTypes.includes('Rent') ? 'slds-button slds-button_brand' : 'slds-button slds-button_neutral';
        }
        else{
            return 'slds-button slds-button_neutral';
        }
    }
    
    get saleButtonClass() {
        if(this.filterData.listingTypes){
            return this.filterData.listingTypes.includes('Sale') ? 'slds-button slds-button_brand' : 'slds-button slds-button_neutral';
        }
        else{
            return 'slds-button slds-button_neutral';
        }
    }

    @wire(CurrentPageReference) pageRef;
    get objectName() {
        if (this.pageRef && this.pageRef.attributes) {
            return this.pageRef.attributes.objectApiName;
        }
        return null;
    }

    connectedCallback() {
        console.log('Object Name ==> ' , this.objectName);
        console.log('recordId => ' , this.recordId);
        this.isLoading = true;
        this.fetchListings();
        this.fetchListingTypes();
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

    fetchListings() {
        getListings({ recordId: this.recordId , objectName : this.objectName})
            .then(result => {
                this.isInitial = true;
                console.log('result ==> ' , result);
                const resultListing = result.listings;

                this.filteredListingData = resultListing;
                this.listingData = resultListing;
                this.propertyMediaUrls = result.medias;

                this.listingData.forEach(row => {
                    const prop_id = row.Property__c;
                    row.media_url = this.propertyMediaUrls[prop_id];
                });

                this.filteredListingData.forEach(row => {
                    const prop_id = row.Property__c;
                    row.media_url = row.Primary_Image_URL__c || this.propertyMediaUrls[prop_id] || NoImageFound;
                    row.Listing_Price__c = row.Listing_Price__c;
                    row.Listing_Type__c = row.Listing_Type__c || 'Sale';
                    row.Bedrooms__c = row.Bedrooms__c || 0;
                    row.Bathrooms__c = row.Bathrooms__c || 0;
                });

                this.pagedFilteredListingData = this.filteredListingData;
                this.totalRecords = this.pagedFilteredListingData.length;
                this.isPropertyAvailable = this.totalRecords > 0;

                if(this.objectName == 'Listing__c'){
                    const listing = result.listingRec;
                    const listingBedroom = listing.Bedrooms__c;
                    const listingBathroom = listing.Bathrooms__c;
                    this.filterData.bedrooms = listingBedroom;
                    this.filterData.bathrooms = listingBathroom;
                    this.applyFilters();
                }

                else if(this.objectName == 'Inquiry__c'){
                    const inquiry = result.inquiryRec;
                    const listingBedroom = inquiry.Bathrooms_min__c;
                    const listingBathroom = inquiry.Bedrooms_min__c;
                    this.filterData.bedrooms = listingBedroom;
                    this.filterData.bathrooms = listingBathroom;
                    this.applyFilters();
                }
                this.updateMapMarkers();
            })
            .catch(error => console.error('Error getting properties from apex:', error));
    }

    fetchListingTypes() {
        getListingTypes()
            .then(result => {
                this.listingTypeOptions = result.map(type => ({ label: type, value: type }));
            })
            .catch(error => console.error(error));
    }

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

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.filterData[field] = event.target.value;
    }

    applyFilters() {
        try {
            const { listingTypes, minPrice, maxPrice, bedrooms, bathrooms, city, zipcode } = this.filterData;
    
            if (minPrice && maxPrice && parseFloat(maxPrice) < parseFloat(minPrice)) {
                this.showToast('Error', 'Max price cannot be less than Min price.', 'error');
                return;
            }
    
            this.pagedFilteredListingData = this.listingData.filter(property => {
                const searchProperty = property.Name.toLowerCase().includes(this.searchTerm);
                const matchesListingType = listingTypes.length === 0 || listingTypes.includes(property.Listing_Type__c);
                const matchesPrice = (!minPrice || property.Listing_Price__c >= minPrice) &&
                                     (!maxPrice || property.Listing_Price__c <= maxPrice);
                const matchesBedrooms = !bedrooms || property.Bedrooms__c == bedrooms;
                const matchesBathrooms = !bathrooms || property.Bathrooms__c == bathrooms;
                const matchesCity = !city || (property.City__c && property.City__c.toLowerCase() === city.toLowerCase());
                const matchesZipcode = !zipcode || property.Zip_Postal_Code__c === zipcode;
    
                return searchProperty && matchesListingType && matchesPrice && matchesBedrooms && matchesBathrooms && matchesCity && matchesZipcode;
            });
    
            this.isPropertyAvailable = this.pagedFilteredListingData.length > 0;
            this.currentPage = 1;
            if(!this.searchTerm && !this.isInitial){
                this.showToast('Success', 'Filter applied successfully', 'success');
            }

            if(this.isInitial){
                this.isInitial = false;
            }
            this.totalRecords = this.pagedFilteredListingData.length;

            this.updateMapMarkers();
        } catch (error) {
            console.log('Error ==> ', error);
            console.log(JSON.stringify(err));
        }
    }
    

    clearFilter() {
        this.filterData = {
            city: '',
            bedrooms: '',
            bathrooms: '',
            minPrice: '',
            maxPrice: '',
            zipcode: '',
            listingTypes: []
        };
        this.pagedFilteredListingData = this.listingData;
        this.searchTerm = '';

        if(this.listingData.length > 0){
            this.isPropertyAvailable = true;
        }
        this.showToast('Success', 'Filter cleared successfully', 'success');
        this.updateMapMarkers();
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
        this.currentPage = 1; // Reset to first page on search
        this.totalRecords = this.pagedFilteredListingData.length;
        this.isPropertyAvailable = this.totalRecords > 0;
        this.updateMapMarkers();
    }

    setGridView() {
        this.selectedView = 'Grid';
        this.currentPage = 1;
    }

    setListView() {
        this.selectedView = 'List';
        this.currentPage = 1;
    }

    setMapView() {
        this.selectedView = 'map';
        this.currentPage = 1;
        this.updateMapMarkers();
    }

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

    handleRentClick() {
        this.toggleListingType('Rent');
    }
    
    handleSaleClick() {
        this.toggleListingType('Sale');
    }

    toggleListingType(listingType) {
        try {
            const index = this.filterData.listingTypes.indexOf(listingType);
            console.log(index);
            if (index > -1) {
                this.filterData.listingTypes.splice(index, 1);
            } else {
                this.filterData.listingTypes.push(listingType);
            }
            this.applyFilters();
        } catch (error) {
            console.error('Error toggling listing type:', error);
        }
    }

    

    goToFirst() {
        this.currentPage = 1;
        this.scrollToTop();
        this.updateMapMarkers();
    }

    goToPrevious() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.scrollToTop();
            this.updateMapMarkers();
        }
    }

    goToNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.scrollToTop();
            this.updateMapMarkers();
        }
    }

    goToLast() {
        this.currentPage = this.totalPages;
        this.scrollToTop();
        this.updateMapMarkers();
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

}
