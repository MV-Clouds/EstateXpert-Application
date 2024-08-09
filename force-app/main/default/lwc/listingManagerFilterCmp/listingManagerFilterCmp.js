import { LightningElement,track} from 'lwc';
import getStaticFields from '@salesforce/apex/ListingManagerFilterController.getStaticFields';
import getPicklistValues from '@salesforce/apex/ListingManagerFilterController.getPicklistValues';
import getListingsWithRelatedRecords from '@salesforce/apex/ListingManagerFilterController.getListingsWithRelatedRecords';
import getTheOfferRecords from '@salesforce/apex/ListingManagerFilterController.getTheOfferRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ListingManagerFilterCmp extends LightningElement {

    @track addModal = false;
    @track listings = [];
    @track objectApiName = '';
    @track valueFromChild = [];
    @track isAddButtonDisabled = true;
    @track filterFields =[];
    @track offerRecords = [];
    @track filteredListings;
    @track staticFields=[];

    /**
    * Method Name: connectedCallback
    * @description: set the get static fields, set listing record wrapper, set offre records.
    * Date: 13/06/2024
    * Created By: Vyom Soni
    **/   
    connectedCallback(){
        
        this.initializeStaticFields();
        this.setListingWapper();
        this.setOfferRecord();
        
    }

    /**
    * Method Name: initializeStaticFields
    * @description: get the static fields from custom metadata.
    * Date: 03/07/2024
    * Created By: Vyom Soni
    **/  
    initializeStaticFields() {
        getStaticFields()
            .then(result => {
                this.staticFields = JSON.parse(result);
                this.filterFields = this.filterFields.concat(this.staticFields);
                this.setPicklistValue();
            })
            .catch(error => {
                console.error('Error loading static fields from metadata', error);
            });
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
    * @param: field- field's object
    * Date: 13/06/2024
    * Created By: Vyom Soni
    **/    
    loadPicklistValues(field) {
        getPicklistValues({apiName:field.apiName,objectName:field.objectApiName})
        .then(result => {
            this.staticFields = this.staticFields.map(f => {
                if (f.apiName === field.apiName) {
                    return {
                        ...f,
                        picklistValue: result,
                        unchangePicklistValue: result
                    };
                }
                return f;
            });
            this.filterFields = [...this.staticFields];
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
            this.staticFields = [...this.filterFields];
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
        this.valueFromChild = this.valueFromChild.map(field => {
            return {
                label: field.label,
                type: field.type, // Map field types
                apiName: field.value,
                prevFieldApiName : field.prevFieldApiName,
                objectApiName: field.objectApiName,
                operatorName: field.operation,
                picklistValue: field.picklistValues||[], // Set operatorName based on type
                unchangePicklistValue: field.picklistValues||[], // Set operatorName based on type
                prevApiName : field.prevApiName,
                minValue:null,
                maxValue:null,
                minDate:null,
                maxDate:null,
                isNot: field.isNot || false,
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
                message:''
            };
        });
        this.valueFromChild.forEach(newField => {
            const isFieldPresent = this.filterFields.some(field => 
                (field.apiName === newField.apiName ||field.value === newField.apiName)&&
                field.label === newField.label &&
                field.objectApiName === newField.objectApiName &&
                field.type === newField.type &&
                field.isNot === newField.isNot
            );
            if (!isFieldPresent) {
                this.filterFields = [...this.filterFields, newField];
            }else{
                const evt = new ShowToastEvent({
                    title: 'Field is not added',
                    message: `${newField.label} is already added in filter fields`,
                    variant: 'error',
                });
                this.dispatchEvent(evt);
            }
        });
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
        this.filterFields.forEach(field => {
            // Check if field has selectedOptions or has valid min/max values for filtering
            const hasSelectedOptions = field.selectedOptions && field.selectedOptions.length > 0;
            const hasMinValue = field.minValue > 0;
            const hasMaxValue = field.maxValue > 0;
            const hasMinDate = field.minDate != null;
            const hasMaxDate = field.maxDate != null;
            const hasFieldChecked = field.fieldChecked != null;
    
            if (hasSelectedOptions || hasMinValue || hasMaxValue || hasMinDate || hasMaxDate || hasFieldChecked) {
              
                if (field.objectApiName !== 'MVEX__Listing__c' && field.objectApiName !== 'MVEX__Offer__c') {
                    
                        this.filteredListings = this.filteredListings.filter(wrapper => {
                            const relatedRecord = wrapper[field.prevApiName.replace('__c', '__r')];
                            if (!relatedRecord) return false;
                        
                            if (hasSelectedOptions && (field.picklist || field.string || field.id)) {
                                const values = field.selectedOptions.map(option => option.value);
                                return this.applyOperatorFilter(relatedRecord, field, values);
                            }
                            if (field.boolean) {
                                return this.applyBooleanFilter(relatedRecord, field);
                            }
                            if (field.currency || field.double) {
                                return this.applyNumericFilter(relatedRecord, field);
                            }
                            if (field.date || field.datetime) {
                                return this.applyDateFilter(relatedRecord, field);
                            }
                            return true;
                        });

                } else if (field.objectApiName === 'MVEX__Offer__c') {
                    // Filter for related offer records
                    
                    this.filteredListings = this.filteredListings.filter(wrapper => {
                        const relatedOffers = this.offerRecords.filter(offer => offer.MVEX__Listing__c === wrapper.Id);
    
                        if (!relatedOffers.length) return false;
    
                        return relatedOffers.some(relatedOffer => {
                            if (field.picklist || field.string || field.id ) {
                                const values = field.selectedOptions.map(option => option.value);
                                return this.applyOperatorFilter(relatedOffer, field, values);
                            }
                            if (field.boolean) {
                                return this.applyBooleanFilter(relatedOffer, field);
                            }
                            if (field.currency || field.double) {
                                return this.applyNumericFilter(relatedOffer, field);
                            }
                            if (field.date || field.datetime) {
                                return this.applyDateFilter(relatedOffer, field);
                            }
                            return true;
                        });
                    });
                } else {
                    // Filter for fields in Listing__c object
                    if (hasSelectedOptions && (field.picklist || field.string || field.id )) {
                        const values = field.selectedOptions.map(option => option.value);
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyOperatorFilter(wrapper.MVEX__Listing__c, field, values));
                    }
                    
                    if (field.boolean) {
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyBooleanFilter(wrapper.MVEX__Listing__c, field));
                    }
                    if (field.currency || field.double) {
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyNumericFilter(wrapper.MVEX__Listing__c, field));
                    }
                    
                    if (field.date || field.datetime) {
                        this.filteredListings = this.filteredListings.filter(wrapper => this.applyDateFilter(wrapper.MVEX__Listing__c, field));
                    }
                }
                this.setFilteredListings();
            } else {
                this.setFilteredListings();
            }
        });
    }
    
      /**
    * Method Name: applyOperatorFilter
    * @description: this method handke filtering about string ,picklist,Id,Url,boolean.
    * @param: record- single record.field
    * @param: field- field's object
    * Date: 014/06/2024
    * Created By: Vyom Soni
    **/
    applyOperatorFilter(record, field, values) {
        const fieldValue = record[field.apiName];
        let isMatch = false;
    
        if (fieldValue !== undefined && fieldValue !== null) {
            const fieldValueLower = fieldValue.toString().toLowerCase();
    
            if (field.operatorName === 'equals') {
                isMatch = values.some(value => fieldValueLower === value.toString().toLowerCase());
            } else if (field.operatorName === 'contains') {
                isMatch = values.some(value => fieldValueLower.includes(value.toString().toLowerCase()));
            } else if (field.operatorName === 'includes') {
                isMatch = values.some(value => value.toString().toLowerCase().includes(fieldValueLower));
            } else if (field.operatorName === 'startswith') {
                isMatch = values.some(value => fieldValueLower.startsWith(value.toString().toLowerCase()));
            } 
        }
    
        return field.isNot ? !isMatch : isMatch;
    }

     /**
    * Method Name: applyBooleanFilter
    * @description: this method apply in boolean filter case.
    * @param: record- single record.field
    * @param: field- field's object
    * Date: 014/06/2024
    * Created By: Vyom Soni
    **/
    applyBooleanFilter(record, field) {
        const fieldValue = record[field.apiName];
        let isMatch = false;
    
        if (fieldValue !== undefined && fieldValue !== null) {
            if (field.boolean) {
                isMatch = fieldValue === field.fieldChecked;
            }
        }
    
        return field.isNot ? !isMatch : isMatch;
    }
    

      /**
    * Method Name: applyNumericFilter
    * @description: this method handke filtering about Numbers, currency.
    * @param: record- single record.field
    * @param: field- field's object
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
    * @param: record- single record.field
    * @param: field- field's object
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
        this.filterFields[index].searchTerm = event.target.value;
        if (this.filterFields[index].searchTerm.length > 50) {
            this.filterFields[index].message = 'The character length should not greater then 50 characters.';
        } else {
            this.filterFields[index].message = null; // Clear the message if the input length is valid
            this.filterFields[index].picklistValue =this.filterFields[index].unchangePicklistValue.filter(option =>
                option.label.toLowerCase().includes(this.filterFields[index].searchTerm.toLowerCase().trim())
            );
            if (event.key === 'Enter') { // Check if Enter key was pressed
                let fields = this.filterFields; // Assuming this is where 'fields' should be declared
                const value = this.filterFields[index].picklistValue[0].value;
                const field = fields[index]; // Access 'fields' instead of 'this.filterFields'
                if (field != null) {
                    if (field.selectedOptions == null) {
                        field.selectedOptions = [];
                    }
                    // Check if the value already exists in selectedOptions
                    const exists = field.selectedOptions.some(option => option.value === value);
                    if (!exists) {
                        this.filterFields[index].searchTerm = '';
                        field.selectedOptions = [...field.selectedOptions, {"label": value, "value": value}];
                        this.applyFilters();
        
                        const newPicklistValue = field.unchangePicklistValue.map(option => {
                            if (option.value === value) {
                                return {...option, showRightIcon: true};
                            }
                            return option;
                        });
                        field.picklistValue = newPicklistValue;
                        field.unchangePicklistValue = newPicklistValue;
                        fields[index] = field;
                        this.filterFields = fields;
                        const inputs = this.template.querySelectorAll('.picklist-input');
                        // Loop through each input and call the blur method
                        inputs.forEach(input => input.blur());
                        this.handleBlur1(event);
                    } else {
                       console.log('Value already exists in selectedOptions');
                    }
                }
            }
        }
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
        this.filterFields[index].isFocused = false;
    }


     /**
    * Method Name: handlePreventDefault
    * @description: prevent default events when the options div clicked.
    * Date: 23/07/2024
    * Created By: Vyom Soni
    **/
    handlePreventDefault(event){
        event.preventDefault();
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
     
        let fields = this.filterFields; // Assuming this is where 'fields' should be declared
        const inputs = this.template.querySelectorAll('.picklist-input');
        // Loop through each input and call the blur method
        inputs.forEach(input => input.blur());


        const field = fields[index]; // Access 'fields' instead of 'this.filterFields'
        
        if (field != null) {
            if (field.selectedOptions == null) {
                field.selectedOptions = [];
            }

            // Check if the value already exists in selectedOptions
            const exists = field.selectedOptions.some(option => option.value === value);
            if (!exists) {
                this.filterFields[index].searchTerm = '';
                field.selectedOptions = [...field.selectedOptions, {"label": value, "value": value}];
                this.applyFilters();

                const newPicklistValue = field.unchangePicklistValue.map(option => {
                    if (option.value === value) {
                        return {...option, showRightIcon: true};
                    }
                    return option;
                });

                field.picklistValue = newPicklistValue;
                field.unchangePicklistValue = newPicklistValue;
                fields[index] = field;
                this.filterFields = fields;
                this.filterFields[index].isFocused = false;
            } else {
               console.log('Value already exists in selectedOptions');
               this.filterFields[index].isFocused = false;
            }
        }
    }
    
    /**
    * Method Name: removeOptionMethod
    * @description: Handle the remove of pill from under if picklist fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    removeOptionMethod(event){
        this.removeOption1(event);
        this.applyFilters();
    }

     /**
    * Method Name: removeOption1
    * @description: Handle the remove of pill from under if picklist fiedls.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    removeOption1(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        const index = event.currentTarget.dataset.index;
        this.filterFields[index].searchTerm = '';
    
        if (index > -1) {
            let fields = [...this.filterFields];
            let field = {...fields[index]};
            
            // Update the selectedOptions array
            field.selectedOptions = field.selectedOptions.filter(option => option.value !== optionToRemove);
            this.applyFilters();
            if (field.selectedOptions.length === 0) {
                this.applyFilters();
                field.selectedOptions = null;
              
            }
    
            // Update the picklistValues array to set showRightIcon to false
            const newPicklistValue = field.picklistValue.map(option => {
                if (option.value === optionToRemove) {
                    return {...option, showRightIcon: false};
                }
                return option;
            });
    
            field.picklistValue = newPicklistValue;
            field.unchangePicklistValue = newPicklistValue;
            fields[index] = field;
            this.filterFields = fields;
    
        }
    }
    
    /**
    * Method Name: removeOptionMethodString
    * @description: call the removeOptionString and applyFilter method.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    removeOptionMethodString(event){
        this.removeOptionString(event);
        this.applyFilters();
    }

     /**
    * Method Name: removeOptionString
    * @description: Handle remove the pill from the string fields.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    removeOptionString(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        const index = event.currentTarget.dataset.index;
       
        if (index > -1) {
            this.filterFields[index].selectedOptions = this.filterFields[index].selectedOptions.filter(option => option.value !== optionToRemove);
            if (this.filterFields[index].selectedOptions.length === 0) {
                this.filterFields[index].selectedOptions = null;
            }
            this.applyFilters();
        }
    
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
        this.filterFields[index].searchTerm = event.target.value;
        // this.filterFields[index].message = 'The character length execceded 50 characters.';
        if (this.filterFields[index].searchTerm.length > 50) {
            this.filterFields[index].message = 'The character length should not greater then 50 characters.';
        } else {
            this.filterFields[index].message = null; // Clear the message if the input length is valid
            if (event.key === 'Enter') { // Check if Enter key was pressed
                this.addTheString(event);
            }
        }
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
        const value = this.filterFields[index].searchTerm.trim();
        
        
        if (value !== '') {
            const field = this.filterFields[index];
        
            if (field.selectedOptions == null) {
                field.selectedOptions = [];
            }
        
            // Check if the value already exists in selectedOptions
            const isValueAlreadySelected = field.selectedOptions.some(option => option.value === value);
        
            if (!isValueAlreadySelected) {
                field.selectedOptions = [...field.selectedOptions, {"label": value, "value": value}];
                this.filterFields[index].searchTerm = '';
            } else {
               console.log('Value already exists in selectedOptions');
            }
        }
        
        this.applyFilters();
    }
    /**
     * Method Name: handleMinValueChange
     * @description: Handle the min value change in the number Input field.
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    handleMinValueChange(event) {
        const index = event.currentTarget.dataset.index;
        let value = parseInt(event.target.value, 10);
        if(isNaN(value)){
            value = null;
        }
        this.filterFields[index].minValue = value;
        if ( this.filterFields[index].isMin == true|| value <= this.filterFields[index].maxValue|| value === 0) {
            this.applyFilters();
            this.filterFields[index].message = null;
        } else{
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
        }
    }

    /**
     * Method Name: handleMaxValueChange
     * @description: Handle change in the max input field.
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    handleMaxValueChange(event) {
        const index = event.currentTarget.dataset.index;
        let value = parseInt(event.target.value, 10);
        if(isNaN(value)){
            value = null;
        }
        try{
            this.filterFields[index].maxValue = value;
            if ((this.filterFields[index].isMax ==true ||value === 0 || value >= this.filterFields[index].minValue)) {
                this.applyFilters();
                this.filterFields[index].message = '';
            }else{
                this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
            }
        }catch(e){
            console.log('errro ->'+e);
        }
    }

    /**
     * Method Name: incrementMinValue
     * @description: Increment the min input value
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    incrementMinValue(event) {
        const index = event.currentTarget.dataset.index;
        let currentValue = parseInt(this.filterFields[index].minValue, 10);
        if (isNaN(currentValue)) {
            currentValue = null;
        }
        this.filterFields[index].minValue = currentValue + 1;
        if (this.filterFields[index].isMin == true||currentValue + 1 <= this.filterFields[index].maxValue) {
            this.applyFilters();
            this.filterFields[index].message = null;
        }else{
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
        }
    
    }

    /**
     * Method Name: decrementMinValue
     * @description: Decrement the min input value
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    decrementMinValue(event) {
        const index = event.currentTarget.dataset.index;
        let currentValue = parseInt(this.filterFields[index].minValue, 10);
        if (isNaN(currentValue) || currentValue <= 0) {
            currentValue = null;
        } else {
            currentValue--;
        }
        this.filterFields[index].minValue = currentValue;
        if (this.filterFields[index].isMin == true||currentValue - 1 <= this.filterFields[index].maxValue) {
            this.applyFilters();
            this.filterFields[index].message = null;
        } else{
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
        }
    }
    /**
     * Method Name: incrementMaxValue
     * @description: Increment the max input value
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    incrementMaxValue(event) {
        const index = event.currentTarget.dataset.index;
        let currentValue = parseInt(this.filterFields[index].maxValue, 10);
        if (isNaN(currentValue)) {
            currentValue = null;
        }
        this.filterFields[index].maxValue = currentValue + 1;
        if (this.filterFields[index].isMax == true||currentValue + 1 >= this.filterFields[index].minValue) {
            this.applyFilters();
            this.filterFields[index].message = null;
        } else{
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
        }
    }

    /**
     * Method Name: decrementMaxValue
     * @description: Decrement the max input value
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    decrementMaxValue(event) {
        const index = event.currentTarget.dataset.index;
        let currentValue = parseInt(this.filterFields[index].maxValue, 10);
        if (isNaN(currentValue) || currentValue <= this.filterFields[index].minValue) {
            //alert('Max value cannot be less than min value.');
            currentValue = null;
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
        } else {
            currentValue--;
        }
        this.filterFields[index].maxValue = currentValue;
        if (this.filterFields[index].isMax == true||currentValue - 1 >= this.filterFields[index].minValue) {
            this.applyFilters();
            this.filterFields[index].message = null;
        } 
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
        // Perform validation
        const minDate = new Date(this.filterFields[index].minDate);
        const maxDate = new Date(this.filterFields[index].maxDate);
        
        if (minDate <= maxDate || this.filterFields[index].isDateMin == true) {
            this.applyFilters();
            this.filterFields[index].message = null;
        } else {
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
            console.warn(`Min date should be less than or equal to max date for field ${this.filterFields[index].apiName}`);
        }
    }
    
    /**
     * Method Name: handleMaxDate
     * @description: handle max date field change
     * Date: 9/06/2024
     * Created By: Vyom Soni
     **/
    handleMaxDate(event) {
        const index = event.currentTarget.dataset.id;
        const newValue = event.target.value;
        this.filterFields[index].maxDate = newValue;
        // Perform validation
        const minDate = new Date(this.filterFields[index].minDate);
        const maxDate = new Date(this.filterFields[index].maxDate);
    
        if (minDate <= maxDate || this.filterFields[index].isDateMax == true) {
            this.applyFilters(); 
            this.filterFields[index].message = null;
        } else {
            this.filterFields[index].message = 'Min Value can not be Greater than the Max Value';
            console.warn(`Max date should be greater than or equal to min date for field ${this.filterFields[index].apiName}`);
        }
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
        console.log('static fields'+JSON.stringify(this.staticFields));
        this.staticFields.forEach(field => {
            if (field.picklistValue) {
              field.picklistValue.forEach(picklist => {
                picklist.showRightIcon = false;
              });
            }
            if (field.unchangePicklistValue) {
              field.unchangePicklistValue.forEach(picklist => {
                picklist.showRightIcon = false;
              });
            }
          });
        this.filterFields = this.staticFields;
        this.filterFields = this.staticFields.map(field => {
            return {
                ...field, // Spread the existing field properties
                selectedOptions: null,
                picklistValue:field.picklistValue,
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
    * Method Name: handleClose
    * @description: handle the close event of modal.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    handleClose() {
        this.addModal = false;
    }

    /**
    * Method Name: handleSave
    * @description: handle the sae evnet in modal.
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
    * Method Name: openModal
    * @description: open the moda.
    * Date: 14/06/2024
    * Created By: Vyom Soni
    **/
    openModal(){
        this.addModal = true;
    }
    
}