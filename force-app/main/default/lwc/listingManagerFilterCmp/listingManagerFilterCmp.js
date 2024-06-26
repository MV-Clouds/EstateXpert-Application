import { LightningElement,track} from 'lwc';
import getPicklistValues from '@salesforce/apex/ListingManagerFilterController.getPicklistValues';
import getListingsWithRelatedRecords from '@salesforce/apex/ListingManagerFilterController.getListingsWithRelatedRecords';
import getTheOfferRecords from '@salesforce/apex/ListingManagerFilterController.getTheOfferRecords';

export default class ListingManagerFilterCmp extends LightningElement {

    @track addModal = false;
    @track listings;
    // dyanamic fields selctor variables
    @track objectApiName = '';
    @track fields;
    @track error;
    @track selectedField;
    @track valueFromChild;
    @track isAddButtonDisabled = true;
    @track filterFields =[];
    offerRecords = [];
    @track ListingsWrapper = [];
    @track filteredListings;
    @track staticFields=[{
        label:'Listing Type',
        type:'PICKLIST',
        apiName:'Listing_Type__c',
        objectApiName:'Listing__c',
        operatorName:'equals',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        isFocused:false,
        isNot: false,
        picklist:true,
    },
    {
        label:'Status',
        type:'PICKLIST',
        apiName:'Status__c',
        objectApiName:'Listing__c',
        operatorName:'equals',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        isFocused:false,
        isNot: false,
        picklist:true,     
    },
    {
        label:'Property Type',
        type:'PICKLIST',
        apiName:'Property_Type__c',
        objectApiName:'Listing__c',
        operatorName:'equals',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        isFocused:false,
        isNot: false,
        picklist:true,
    },
    {
        label : 'City',
        type: 'STRING',
        apiName: 'City__c',
        objectApiName :'Listing__c',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        operatorName: 'contains',
        isFocused:false,
        isNot: false,
        string:true,
    },
    {
        label : 'Listing Price',
        type: 'CURRENCY',
        apiName: 'Listing_Price__c',
        objectApiName :'Listing__c',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        operatorName: 'range',
        isRange:true,
        isFocused:false,
        isNot: false,
        currency:true,
    },
    {
        label : 'Bedrooms',
        type: 'DOUBLE',
        apiName: 'Number_Of_Bedrooms__c',
        objectApiName :'Listing__c',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        operatorName: 'range',
        isFocused:false,
        isNot: false,
        double:true,

    },
    {
        label : 'Bathrooms',
        type: 'DOUBLE',
        apiName: 'Number_Of_Bathrooms__c',
        objectApiName :'Listing__c',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        operatorName: 'range',
        isRange:true,
        isFocused:false,
        isNot: false,
        double:true,
    },
    {
        label : 'Size',
        type: 'DOUBLE',
        apiName: 'Number_Of_Bathrooms__c',
        objectApiName :'Lising__c',
        searchTerm:'',
         minValue:0,
        maxValue:0,
        operatorName: 'range',
        isRange:true,
        isFocused:false,
        isNot: false,
        double:true,
    }

]

    connectedCallback(){
        this.filterFields =this.filterFields.concat(this.staticFields);
        this.setPicklistValue();
        this.setListingWapper();
        this.setOfferRecord();
        
    }

    /**
    * Method Name: setPicklistValue
    * @description: get the picklist values one by one for static fields.
    * Date: 13/06/2024
    * Created By: Vyom Soni
    **/    
    setPicklistValue(){
        this.staticFields.forEach(field => {
            if (field.picklist) {
                this.loadPicklistValues(field);
                }
        });
        
    }

    /**
    * Method Name: loadPicklistValues
    * @description: add the picklist values in the static fields.
    * Date: 13/06/2024
    * Created By: Vyom Soni
    **/    
    loadPicklistValues(field) {
        getPicklistValues({apiName:field.apiName,objectName:field.objectApiName})
        .then(result => {
            this.filterFields = this.filterFields.map(f => {
                if (f.apiName === field.apiName) {
                    return {
                        ...f,
                        picklistValue: result,
                        unchangePicklistValue: result
                    };
                }
                return f;
            });
            console.log('Updated filterFields:', JSON.stringify(this.filterFields));
        })
        .catch(error => {
            console.error('Error loading picklist values', error);
        });
    }

     /**
    * Method Name: handleChange
    * @description: handle the radio button select.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    setListingWapper(){
        getListingsWithRelatedRecords().then(result => {
            this.listings = result.map(item => JSON.parse(item));
            // console.log('Listings:', JSON.stringify(this.listings[1].Account.Name));
            this.staticFields = [...this.filterFields];
            console.log('static fields'+JSON.stringify(this.staticFields[0]));
        })
        .catch(error => {
            console.error('Error fetching listings', error);
        });
    }

    /**
    * Method Name: setOfferRecord
    * @description: get the offer records.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    setOfferRecord(){
        getTheOfferRecords().then(result => {
            this.offerRecords = result;
            console.log('offer'+JSON.stringify(this.offerRecords));
        })
        .catch(error => {
            console.error('Error fetching listings', error);
        });
    }

      /**
    * Method Name: handleValueSelected
    * @description: this method is set the field from the child field-add cmp .
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    handleValueSelected(event) {
        // Get the value from the event detail and store it in a property
        this.valueFromChild = event.detail;
        console.log('child'+JSON.stringify(this.valueFromChild));
        this.valueFromChild = this.valueFromChild.map(field => {
            return {
                label: field.label,
                type: field.type, // Map field types
                apiName: field.value,
                prevFieldApiName : field.prevFieldApiName,
                objectApiName: field.objectApiName,
                operatorName: field.operation,
                picklistValue:field.picklistValues||[], // Set operatorName based on type
                unchangePicklistValue:field.picklistValues||[], // Set operatorName based on type
                prevApiName : field.prevApiName,
                minValue:0,
                maxValue:0,
                isNot: field.isNot,
                searchTerm:'',
                isFocused:false,
                picklist: field.type === 'PICKLIST',
                string: field.type === 'STRING'||field.type === 'TEXTAREA'||field.type === 'URL'||field.type === 'ID'||field.type === 'EMAIL'||field.type === 'PHONE',
                fieldChecked:false,
                currency: field.type === 'CURRENCY',
                double: field.type === 'DOUBLE',
                date:field.type === 'DATE',
                datetime:field.type === 'DATETIME',
                boolean:field.type === 'BOOLEAN',
                isDateRange:field.operation === 'daterange',
                isDateMax:field.operation === 'datemaximum',
                isDateMin :field.operation === 'dateminimum', 
                isRange:field.operation === 'range',
                isMax:field.operation === 'minimum',
                isMin :field.operation === 'maximum',

            };
        });
        console.log('updated field'+JSON.stringify(this.valueFromChild));
        this.filterFields = [...this.filterFields, ...this.valueFromChild];
    
        console.log('child Value:'+JSON.stringify(this.valueFromChild));
    }

    /**
    * Method Name: handleChange
    * @description: handle the radio button select.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    applyFilters() {
        // Initialize filteredListings with a deep copy of ListingsWrapper
        this.filteredListings = [...this.listings];
        console.log('Initial Listings:', JSON.stringify(this.filteredListings));
    
        this.filterFields.forEach(field => {
            // Check if field has selectedOptions or has valid min/max values for filtering
            const hasSelectedOptions = field.selectedOptions && field.selectedOptions.length > 0;
            const hasMinValue = field.minValue > 0;
            const hasMaxValue = field.maxValue > 0;
            const hasMinDate = field.minDate != null;
            const hasMaxDate = field.maxDate != null;
            const hasFieldChecked = field.fieldChecked != null;
    
            if (hasSelectedOptions || hasMinValue || hasMaxValue || hasMinDate || hasMaxDate || hasFieldChecked) {
                console.log(`Applying filter on field: ${field.apiName}`);
    
                if (field.objectApiName !== 'Listing__c' && field.objectApiName !== 'Offer__c') {
                    // Filter for related record in another object (Contact, Property)
                    console.log('Filtering related object:', field.objectApiName);
                    
                        this.filteredListings = this.filteredListings.filter(wrapper => {
                            const relatedRecord = wrapper[field.prevApiName.replace('__c', '__r')];
                            if (!relatedRecord) return false;
                        
                            if (hasSelectedOptions && (field.picklist || field.string || field.id || field.boolean)) {
                                const values = field.selectedOptions.map(option => option.value);
                                return this.applyOperatorFilter(relatedRecord, field, values);
                            }
                            if (field.currency || field.double) {
                                return this.applyNumericFilter(relatedRecord, field);
                            }
                            if (field.date || field.datetime) {
                                return this.applyDateFilter(relatedRecord, field);
                            }
                            return true;
                        });

                } else if (field.objectApiName === 'Offer__c') {
                    // Filter for related offer records
                    console.log('Filtering related offer records');
                    
                    this.filteredListings = this.filteredListings.filter(wrapper => {
                        const relatedOffers = this.offerRecords.filter(offer => offer.Listing__c === wrapper.Id);
    
                        if (!relatedOffers.length) return false;
    
                        return relatedOffers.some(relatedOffer => {
                            if (field.picklist || field.string || field.id || field.boolean) {
                                const values = field.selectedOptions.map(option => option.value);
                                return this.applyOperatorFilter(relatedOffer, field, values);
                            }
                            if (field.currency || field.double) {
                                return this.applyNumericFilter(relatedOffer, field);
                            }
                            if (field.date || field.datetime) {
                                console.log('Applying date/datetime filter');
                                return this.applyDateFilter(relatedOffer, field);
                            }
                            return true;
                        });
                    });
                } else {
                    // Filter for fields in Listing__c object
                    if (hasSelectedOptions && (field.picklist || field.string || field.id || field.boolean)) {
                        const values = field.selectedOptions.map(option => option.value);
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyOperatorFilter(wrapper.Listing__c, field, values));
                    }
                    
                    if (field.currency || field.double) {
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyNumericFilter(wrapper.Listing__c, field));
                    }
                    
                    if (field.date || field.datetime) {
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyDateFilter(wrapper.Listing__c, field));
                    }

                  
                }
    
                console.log('Listings after applying filter:', JSON.stringify(this.filteredListings));
                this.setFilteredListings();
            } else {
                this.setFilteredListings();
            }
        });
    
        console.log('Final Filtered Listings:', JSON.stringify(this.filteredListings));
    }
    
      /**
    * Method Name: applyOperatorFilter
    * @description: this method handke filtering about string ,picklist,Id,Url,boolean.
    * Date: 014/06/2024
    * Created By: Vyom Soni
    **/
   applyOperatorFilter(record, field, values) {
    const fieldValue = record[field.apiName];
    let isMatch = false;

    if (field.operatorName === 'equals') {
        isMatch = values.includes(fieldValue);
    }
    if (field.operatorName === 'contains' || field.operatorName === 'includes') {
        isMatch = values.some(value => fieldValue.includes(value));
    }
    if (field.operatorName === 'startswith') {
        isMatch = values.some(value => fieldValue.startsWith(value));
    }
    if (field.boolean) {
        isMatch = fieldValue === field.fieldChecked;
    }

    return field.isNot ? !isMatch : isMatch;
}
    

      /**
    * Method Name: applyNumericFilter
    * @description: this method handke filtering about Numbers, currency.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    applyNumericFilter(record, field) {
        const min = parseFloat(field.minValue) || -Infinity;
        const max = parseFloat(field.maxValue) || Infinity;
        const value = parseFloat(record[field.apiName]);
        if (isNaN(value)) return false;
        const inRange = value >= min && value <= max;
        return field.isNot ? !inRange : inRange;
    }

     /**
    * Method Name: applyDateFilter
    * @description: this method handle the date fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    applyDateFilter(record, field) {
        const recordDateValue = new Date(record[field.apiName]);
    
        if (isNaN(recordDateValue)) return false;
    
        const minDate = field.minDate ? new Date(field.minDate) : new Date(-8640000000000000); // Minimum possible date
        const maxDate = field.maxDate ? new Date(field.maxDate) : new Date(8640000000000000); // Maximum possible date
    
        const inRange = recordDateValue >= minDate && recordDateValue <= maxDate;
        return field.isNot ? !inRange : inRange;
    }
    

      /**
    * Method Name: setFilteredListings
    * @description: set Listings in the Parent listing manager component.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    setFilteredListings(){
        const customEvent = new CustomEvent('valueselected', {
            detail: this.filteredListings
        });
        
        // Dispatch the custom event
        this.dispatchEvent(customEvent);
    }  
   
    // Picklist field methods

        /**
    * Method Name: handleSearchChange1
    * @description: Handle the search option feature in picklist fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleSearchChange1(event) {
    
        const index = event.currentTarget.dataset.id;
        console.log('index'+index);
        this.filterFields[index].searchTerm = event.target.value;
            console.log('index2'+this.filterFields[index].searchTerm);
            this.filterFields[index].picklistValue =this.filterFields[index].unchangePicklistValue.filter(option =>
                option.label.toLowerCase().includes(this.filterFields[index].searchTerm.toLowerCase())
            );
            console.log('index2'+JSON.stringify(this.filterFields[index].picklistValue));
    }

       /**
    * Method Name: handleFocus1
    * @description: Handle the Focus event in picklist fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleFocus1(event) {
        const index = event.currentTarget.dataset.id;
        this.filterFields[index].isFocused = true;
        console.log('index'+index);
        this.filterFields[index].picklistValue = this.filterFields[index].unchangePicklistValue;
        
    }

     /**
    * Method Name: handleBlur1
    * @description: Handle the blur event in picklist fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleBlur1(event) {
        // Delay the blur action to allow click event to be registered

        const index = event.currentTarget.dataset.id;
        console.log('index'+index);
        this.filterFields[index].picklistValue = this.filterFields[index].unchangePicklistValue;
        setTimeout(()=>{
            this.filterFields[index].isFocused = false;
        },300);
    }

       /**
    * Method Name: selectOption1
    * @description: Handle the slection of option in picklist fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    selectOption1(event) {
        const value = event.currentTarget.dataset.id;
        const index = event.currentTarget.dataset.index;
        console.log('value' + value);
        console.log('index' + index);
    
        const field = this.filterFields[index];
        console.log('field' + field);
    
        if (field != null) {
            console.log('HI');
            if (field.selectedOptions == null) {
                field.selectedOptions = [];
            }
    
            // Check if the value already exists in selectedOptions
            const exists = field.selectedOptions.some(option => option.value === value);
            if (!exists) {
                field.selectedOptions = [...field.selectedOptions, {"label": value, "value": value}];
                console.log('selectedOptions' + JSON.stringify(field.selectedOptions));
            } else {
                console.log('Value already exists in selectedOptions');
            }
        }
    
        this.searchTerm1 = ''; // Clear the search term to reset the search
        this.isFocused1 = false; // Close the dropdown
        this.applyFilters();
    }
    
    /**
    * Method Name: removeOptionMethod,removeOption1
    * @description: Handle the remove of pill from under if picklist fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    removeOptionMethod(event){
        this.removeOption1(event);
        setTimeout(()=>{
            this.applyFilters();
        },1000);
    }

    removeOption1(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        const index =  event.currentTarget.dataset.index;
        console.log('index'+index);
        if(index >0){
            this.filterFields[index].selectedOptions = this.filterFields[index].selectedOptions.filter(option => option.value !== optionToRemove);
            console.log('hi'+this.filterFields[index].selectedOptions);
            console.log('hi'+this.filterFields[index].selectedOptions.length);
        }
        if(index == 0){
            this.filterFields[index].selectedOptions= null;
            console.log('hi'+this.filterFields[index].selectedOptions);
            console.log('hi'+this.filterFields[index].selectedOptions.length);
        }
        this.applyFilters();
    }

    // Stiring fields logic

     /**
    * Method Name: handleSearchChangeString
    * @description: Handle the string change in string fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleSearchChangeString(event) {
        const index = event.currentTarget.dataset.id;
        console.log('index'+index);
        this.filterFields[index].searchTerm = event.target.value;
        if (event.key === 'Enter') { // Check if Enter key was pressed
            this.addTheString(event);
        }
        console.log('filere'+this.filterFields[index].searchTerm);
    }

    // Adds the city to the selected options list
    /**
    * Method Name: addTheString
    * @description: Handle the string add in the multi selection in string fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    addTheString(event) {
        const index = event.currentTarget.dataset.id;
        const value = this.filterFields[index].searchTerm;
        
        console.log('value: ' + value);
        
        if (value !== '') {
            const field = this.filterFields[index];
        
            if (field.selectedOptions == null) {
                field.selectedOptions = [];
            }
        
            // Check if the value already exists in selectedOptions
            const isValueAlreadySelected = field.selectedOptions.some(option => option.value === value);
        
            if (!isValueAlreadySelected) {
                field.selectedOptions = [...field.selectedOptions, {"label": value, "value": value}];
                console.log('selectedOptions: ' + JSON.stringify(field.selectedOptions));
                this.filterFields[index].searchTerm = '';
            } else {
                console.log('Value already exists in selectedOptions');
            }
        }
        
        this.applyFilters();
    }

     /**
    * Method Name: handleMinValueChange
    * @description: handle the min value change in the number Input field.
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    handleMinValueChange(event) {
        const index = event.currentTarget.dataset.index;
        console.log('index'+index);
        const value = event.target.value;
        this.filterFields[index].minValue = value;
        console.log('filterFields'+this.filterFields[index].minValue);
        this.applyFilters();
    }

    
      /**
    * Method Name: handleMaxValueChange
    * @description: Handle change in the max input field.
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    handleMaxValueChange(event) {
        const index = event.currentTarget.dataset.index;
        console.log('index'+index);
        const value = event.target.value;
        this.filterFields[index].maxValue = value;
        console.log('filterFields'+this.filterFields[index].maxValue);
        this.applyFilters();
    }

     /**
    * Method Name: incrementMinValue
    * @description:  Increment the min input value
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    incrementMinValue(event) {
        const index = event.currentTarget.dataset.index;
        console.log('index'+index);
        const currentValue = parseInt(this.filterFields[index].minValue, 10);
        if (!isNaN(currentValue)) {
            this.filterFields[index].minValue = currentValue + 1;
            console.log('filterFields'+this.filterFields[index].minValue);
        } else {
            this.filterFields[index].minValue = 0;
        }
        this.applyFilters();
    }

      /**
    * Method Name: decrementMinValue
    * @description:  decrement the min input value
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    decrementMinValue(event) {
        const index = event.currentTarget.dataset.index;
        const currentValue = parseInt(this.filterFields[index].minValue, 10);
        if (!isNaN(currentValue) && currentValue > 0) {
            this.filterFields[index].minValue = currentValue - 1;
        } else {
            this.filterFields[index].minValue = 0;
        }
        this.applyFilters();
    }

         /**
    * Method Name: incrementMaxValue
    * @description:  incremaent the max input value
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    incrementMaxValue(event) {
        const index = event.currentTarget.dataset.index;
        const currentValue = parseInt(this.filterFields[index].maxValue, 10);
        if (!isNaN(currentValue)) {
            this.filterFields[index].maxValue = currentValue + 1;
        } else {
            this.filterFields[index].maxValue = 0;
        }
        this.applyFilters();
    }

         /**
    * Method Name: decrementMaxValue
    * @description:  decrement the max input value
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    decrementMaxValue(event) {
        const index = event.currentTarget.dataset.index;
        const currentValue = parseInt(this.filterFields[index].maxValue, 10);
        if (!isNaN(currentValue) && currentValue > 0) {
            this.filterFields[index].maxValue = currentValue - 1;
        } else {
            this.filterFields[index].maxValue = 0;
        }
        this.applyFilters();
    }

        /**
    * Method Name: checkboxFieldChange
    * @description:  handle th checkbox field change
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    checkboxFieldChange(event){
        const index = event.currentTarget.dataset.index;
        this.filterFields[index].fieldChecked = !this.filterFields[index].fieldChecked;
        this.applyFilters();
    }

       /**
    * Method Name: handleMinDate
    * @description:  handle min date field change
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    handleMinDate(event) {
        const index = event.currentTarget.dataset.id;
        const newValue = event.target.value;
        this.filterFields[index].minDate = newValue;
        console.log(`Updated minDate for field ${this.filterFields[index].apiName}:`, this.filterFields[index].minDate);
        this.applyFilters();
    }

        /**
    * Method Name: handleMaxDate
    * @description:  handle max date field change
    * Date: 9/06/2024
    * Created By: Vyom Soni
    **/
    handleMaxDate(event) {
        const index = event.currentTarget.dataset.id;
        const newValue = event.target.value;
        this.filterFields[index].maxDate = newValue;
        console.log(`Updated maxDate for field ${this.filterFields[index].apiName}:`, this.filterFields[index].maxDate);
        this.applyFilters();
    }

     // Clears the search input field
    /**
    * Method Name: clearSearch
    * @description: Removes a field from the filed list.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
     clearSearch(event) {
        const index = event.currentTarget.dataset.id;
        if (index > -1 && index < this.filterFields.length) {
            this.filterFields.splice(index, 1);
        }
        this.applyFilters();
    }

     //handel reset
       /**
    * Method Name: handleReset
    * @description: Remove the all except static fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleReset(){
        // this.filterFields = this.staticFields
        console.log()
        this.filterFields = this.staticFields;
        console.log('statc'+this.staticFields)
        console.log('filter'+this.filterFields)
        console.log('filter'+this.filterFields.length)
        console.log('filter'+this.staticFields[0].picklistValues)
        this.filterFields = this.staticFields.map(field => {
            return {
                ...field, // Spread the existing field properties
                selectedOptions: null,
                minValue: null,
                maxValue: null,
                minDate: null,
                maxDate: null,
                fieldChecked: null
            };
        });
        this.applyFilters();
    }

    // Modal cmp 
       /**
    * Method Name: handleReset
    * @description: Remove the all except static fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleClose() {
        this.addModal = false;
    }

        /**
    * Method Name: handleReset
    * @description: Remove the all except static fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleSave() {
        this.addModal = false;
        const childComponent = this.template.querySelector('c-listing-manager-filter-add-cmp');

        if (childComponent) {
            // Call the method on the child component
            childComponent.handleButtonClick();
        }
    }

    
        /**
    * Method Name: handleFieldChange
    * @description: fetch the custom event data and set pop-up add button disable.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleFieldChange(event) {
        const field = event.detail;
        this.isAddButtonDisabled = (field.length === 0 && field.operation == null);
        
    }

        /**
    * Method Name: handleReset
    * @description: Remove the all except static fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    openModal(){
        this.addModal = true;
    }
    
}