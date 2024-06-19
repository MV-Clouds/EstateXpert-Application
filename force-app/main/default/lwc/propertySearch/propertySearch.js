import { LightningElement, api, track } from 'lwc';
import GetListingTypes from '@salesforce/apex/PropertySearchController.GetListingTypes';

export default class PropertySearch extends LightningElement {
    @api filterValue;
    @track propertyType = '';
    @track propertyTypes = []; 
    @track minPrice = '';
    @track minPriceRange = 0;
    @track maxPrice = '';
    @track maxPriceRange = 1000000;
    @track bedrooms = 0;
    @track bathrooms = 0;
    @track city = '';
    @track zipCode = '';

    connectedCallback(){
        GetListingTypes().then(result => {
            this.propertyTypes = result;
        });

        if(this.filterValue){
            this.propertyType = this.filterValue.propertyType || '';
            this.minPrice = this.filterValue.minPrice || '';
            this.maxPrice = this.filterValue.maxPrice || '';
            this.bedrooms = this.filterValue.bedrooms || 0;
            this.bathrooms = this.filterValue.bathrooms || 0;
            this.city = this.filterValue.city || '';
            this.zipCode = this.filterValue.zipcode || '';
        }
    }

    handlePropertyTypeChange(event) {
        this.propertyType = event.target.value;
    }
    handleMinPriceChange(event) {
        this.minPrice = event.target.value;
        if(this.minPrice > this.maxPrice) {
            this.maxPrice = this.minPrice;
        }
    }
    handleMaxPriceChange(event) {
        this.maxPrice = event.target.value;
        if(this.maxPrice < this.minPrice) {
            this.minPrice = this.maxPrice;
        }
    }
    handleBedroomsChange(event) {
        this.bedrooms = event.target.value;
    }
    handleBathroomsChange(event) {
        this.bathrooms = event.target.value;
    }
    handleCityChange(event) {
        this.city = event.target.value;
    }
    handleZipCodeChange(event) {
        this.zipCode = event.target.value;
    }
    closeFilter() {
        this.dispatchEvent(new CustomEvent('filterclose'));
    }

    applyFilters() {
        try {
            this.bedrooms = this.template.querySelector('.input-number').value;
            this.bathrooms = this.template.querySelector('.input-number_bathrooms').value;
            console.log('--->');
            const filterValues = {
                propertyType: this.propertyType,
                minPrice: this.minPrice,
                maxPrice: this.maxPrice,
                bedrooms: this.bedrooms,
                bathrooms: this.bathrooms,
                city: this.city,
                zipcode: this.zipCode
            };

            console.log('Applying Filters:', filterValues.propertyType);
            this.dispatchEvent(new CustomEvent('changefilter', { detail: filterValues }));
        } catch (error) {
            console.error('Error applying filters:', error);
        }
    }

    increase__value() {
        const input = this.template.querySelector('.input-number');
        input.value = parseInt(input.value, 10) + 1;
    }
    decrease__value() {
        const input = this.template.querySelector('.input-number');
        if (input.value > 0) {
            input.value = parseInt(input.value, 10) - 1;
        }
    }
    increase__number_of_bathrooms() {
        const input = this.template.querySelector('.input-number_bathrooms');
        input.value = parseInt(input.value, 10) + 1;
    }
    decrease__number_of_bathrooms() {
        const input = this.template.querySelector('.input-number_bathrooms');
        if (input.value > 0) {
            input.value = parseInt(input.value, 10) - 1;
        }
    }
    handleClearFilter() {
        this.propertyType = '';
        this.minPrice = '';
        this.maxPrice = '';
        this.bedrooms = 0;
        this.bathrooms = 0;
        this.city = '';
        this.zipCode = '';
        const filterValues = {
                propertyType: this.propertyType,
                minPrice: this.minPrice,
                maxPrice: this.maxPrice,
                bedrooms: this.bedrooms,
                bathrooms: this.bathrooms,
                city: this.city,
                zipcode: this.zipCode
            };
        this.dispatchEvent(new CustomEvent('filterclear', { detail: filterValues }));
    }
}