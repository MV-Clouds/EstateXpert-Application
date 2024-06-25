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

    /**
    * Method Name: ConnectedCallback
    * @description: standard connectedCallback method used to set default filter values in not passed any
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
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

    /**
    * Method Name: handlePropertyTypeChange
    * @description: this method is used to update the filter value for change in propertyType
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handlePropertyTypeChange(event) {
        this.propertyType = event.target.value;
    }

    /**
    * Method Name: handleMinPriceChange
    * @description: this method is used to update the filter value for change in minPrice
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleMinPriceChange(event) {
        this.minPrice = event.target.value;
        if(this.minPrice > this.maxPrice) {
            this.maxPrice = this.minPrice;
        }
    }

    /**
    * Method Name: handleMaxPriceChange
    * @description: this method is used to update the filter value for change in maxPrice
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleMaxPriceChange(event) {
        this.maxPrice = event.target.value;
        if(this.maxPrice < this.minPrice) {
            this.minPrice = this.maxPrice;
        }
    }

    /**
    * Method Name: handleBedroomsChange
    * @description: this method is used to update the filter value for change in bedrooms
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleBedroomsChange(event) {
        this.bedrooms = event.target.value;
    }

    /**
    * Method Name: handleBathroomsChange
    * @description: this method is used to update the filter value for change in bathrooms
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleBathroomsChange(event) {
        this.bathrooms = event.target.value;
    }

    /**
    * Method Name: handleCityChange
    * @description: this method is used to update the filter value for change in city
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleCityChange(event) {
        this.city = event.target.value;
    }

    /**
    * Method Name: handleZipCodeChange
    * @description: this method is used to update the filter value for change in zipCode
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    handleZipCodeChange(event) {
        this.zipCode = event.target.value;
    }

    /**
    * Method Name: closeFilter
    * @description: this method is used to fire a custom event which will close the filter pop up modal dialog
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    closeFilter() {
        this.dispatchEvent(new CustomEvent('filterclose'));
    }

    /**
    * Method Name: applyFilters
    * @description: this method is used to set filter data and fire a custom event to apply filter accordingly in the parent component
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
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

    /**
    * Method Name: increase__value
    * @description: this method is used to update the filter value for change in increase in value for input number
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    increase__value() {
        const input = this.template.querySelector('.input-number');
        input.value = parseInt(input.value, 10) + 1;
    }

    /**
    * Method Name: decrease__value
    * @description: this method is used to update the filter value for change in decrease in value for input number
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    decrease__value() {
        const input = this.template.querySelector('.input-number');
        if (input.value > 0) {
            input.value = parseInt(input.value, 10) - 1;
        }
    }

    /**
    * Method Name: increase__number_of_bathrooms
    * @description: this method is used to update the filter value for increase in number of bathrooms using the input number 
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    increase__number_of_bathrooms() {
        const input = this.template.querySelector('.input-number_bathrooms');
        input.value = parseInt(input.value, 10) + 1;
    }

    /**
    * Method Name: decrease__number_of_bathrooms
    * @description: this method is used to update the filter value for decrease in number of bathrooms using the input number 
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
    decrease__number_of_bathrooms() {
        const input = this.template.querySelector('.input-number_bathrooms');
        if (input.value > 0) {
            input.value = parseInt(input.value, 10) - 1;
        }
    }

    /**
    * Method Name: handleClearFilter
    * @description: this method is used to handle the clear filter when clear button is clicked
    * Date: 17/06/2024
    * Created By: Mitrajsinh Gohil
    */
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