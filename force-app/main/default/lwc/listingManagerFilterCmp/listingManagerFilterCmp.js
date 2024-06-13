
import { LightningElement,track,api,wire } from 'lwc';
import getPicklistValues from '@salesforce/apex/ListingManagerFilterController.getPicklistValues';

export default class ListingManagerFilterCmp extends LightningElement {

    @track searchCityTerm = '';
    @track selectedOptionsCity = [];
    @track minValue = '';
    @track maxValue = '';
    @track isChecked = false;
    @track showAboutInfo = false;
    @track selectedValues = [];
    @track showAboutInfo = false;
    @track selectedRadio = 'allListings';
    @track addModal = false;

    // dyanamic fields selctor variables
    @track objectApiName = '';
    @track fields;
    @track error;
    @track selectedField;
    @track valueFromChild;
    @track radioOptions = [
        { label: 'All listings', value: 'allListings' },
        { label: 'My lisitngs', value: 'myListings' }
    ];
    @track filterFields =[];
    @track ListingsWrapper = [{"Id":"a00Bi000009UatiIAC","imageUrl__c":"https://www.gstatic.com/webp/gallery3/1.sm.png","Name":"Vyom","Name__c":"Vyom","Listing_Price__c":2000,"Number_Of_Bathrooms__c":5,"Number_Of_Bedrooms__c":6,"Size__c":6,"Status__c":"Low Key","Year_Built__c":"2024-06-21","isChecked":false,"Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"Soni","LastName":"Vyom","OtherCity":"Surat","Other_Streets__c":"t34t3","Email__c":"Vyom57ppsv2020@gmail.com"}},
    {"Id":"a00Bi000009UcXJIA0","Name":"test","Name__c":"test","Listing_Price__c":5000,"Number_Of_Bathrooms__c":6,"Number_Of_Bedrooms__c":8,"Size__c":9555,"Status__c":"Moved In","Year_Built__c":"2024-06-29","isChecked":false,"imageUrl__c":"/resource/1717320680000/blankImage","Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"Soni","Last_Name__c":"Ayushi","OtherCity":"Surat","Other_Streets__c":"wererew","Email__c":"Vyom57ppsv2020@gmail.com"}},
    {"Id":"a00Bi000009UcYvIAK","imageUrl__c":"https://www.gstatic.com/webp/gallery3/1.sm.png","Name":"Shivalik","Name__c":"shivalik","Listing_Price__c":88965,"Number_Of_Bathrooms__c":9,"Number_Of_Bedrooms__c":5,"Size__c":98,"Status__c":"Exchanged","Year_Built__c":"2024-07-05","isChecked":false,"Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"Soni","Last_Name__c":"Gujjar","OtherCity":"wrwerwe","Other_Streets__c":"Dindoli","Email__c":"Vyom57ppsv2020@gmail.com"}},
    {"Id":"a00Bi000009UvDOIA0","Name":"TESTPROPERTY","Name__c":"TESTPROPERTY","Listing_Price__c":5000,"Number_Of_Bathrooms__c":6,"Number_Of_Bedrooms__c":5,"Size__c":5000,"Status__c":"Moved In","Year_Built__c":"2024-06-29","isChecked":false,"imageUrl__c":"/resource/1717320680000/blankImage","Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"Soni","Last_Name__c":"erger","OtherCity":"werwr","Other_Streets__c":"Dindoli","Email__c":"Vyom57ppsv2020@gmail.com"}},
    {"Id":"a00Bi000009UwcTIAS","Name":"TESTPROPERTY2","Name__c":"TESTPROPERTY2","Listing_Price__c":963852,"Number_Of_Bathrooms__c":9,"Number_Of_Bedrooms__c":5,"Size__c":963852,"Status__c":"Low Key","Year_Built__c":"2024-06-29","isChecked":false,"imageUrl__c":"/resource/1717320680000/blankImage","Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"34t3t4rgef","LastName":"Gohil","OtherCity":"fergr","Other_Streets__c":"Dindoli","Email__c":"Vyom57ppsv2020@gmail.com","LeadSource":"Web"}},
    {"Id":"a00Bi000009VaYLIA0","Name":"TESTPROPERTY5","Name__c":"TESTPROPERTY5","Listing_Price__c":900000,"Number_Of_Bathrooms__c":6,"Number_Of_Bedrooms__c":5,"Size__c":5000,"Status__c":"Low Key","Year_Built__c":"2024-06-11","City__c":"Surat","Country__c":"India","Postal_Code__c":394210,"State__c":"Gujrat","Street__c":"Dindoli","Sq_Ft__c":5000,"isChecked":false,"imageUrl__c":"/resource/1717320680000/blankImage","Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"34r34t","Last_Name__c":"fwifwj","OtherCity":"3r4t34t","Other_Streets__c":"ewrwtwr","Email__c":"Vyom57ppsv2020@gmail.com"}},
    {"Id":"a00Bi000009VbHUIA0","Name":"TESTPROPERTY6","Name__c":"TESTPROPERTY6","Listing_Price__c":200000,"Number_Of_Bathrooms__c":5,"Number_Of_Bedrooms__c":6,"Size__c":1100,"Status__c":"Moved In","Year_Built__c":"2024-06-14","City__c":"Ahemdabad","Country__c":"India","State__c":"Gujrat","Street__c":"ITC narmada","Sq_Ft__c":5000,"isChecked":false,"imageUrl__c":"/resource/1717320680000/blankImage","Contact__c":{"Id":"a00Bi000009UatiIAC","First_Name__c":"r3434","Last_Name__c":"r23","OtherCity":"gggr4","Other_Streets__c":"43r34r","Email__c":"Vyom57ppsv2020@gmail.com"}}]
    @track filteredListings;
    @track staticFields=[{
        label : 'Listing Type',
        type: 'PICKLIST',
        apiName: 'Listing_Type__c',
        objectApiName :'Listing__c',
        operatorName: 'includes',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        isFocused:false,
        isNot: false,
        picklist:true,
    },
    {
        label : 'Status',
        type: 'PICKLIST',
        apiName: 'Status__c',
        objectApiName :'Listing__c',
        operatorName: 'includes',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        isFocused:false,
        isNot: false,
        picklist:true,     
    },
    {
        label : 'Property Type',
        type: 'PICKLIST',
        apiName: 'Property_Type__c',
        objectApiName :'Listing__c',
        searchTerm:'',
        minValue:0,
        maxValue:0,
        operatorName: 'includes',
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
        searchTerm:'',isRange:true,
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
    }

    setPicklistValue(){
        this.staticFields.forEach(field => {
            if (field.picklist) {
                this.loadPicklistValues(field);
                }
        });
        console.log('static fields'+JSON.stringify(this.staticFields));
    }


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
                // phone:field.type === 'PHONE',
                // email:field.type === 'EMAIL',
                // url:field.type === 'URL',
                // id:field.type === 'ID',
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
        this.filteredListings = [...this.ListingsWrapper];
        console.log('Initial Listings:', JSON.stringify(this.filteredListings));

        this.filterFields.forEach(field => {
            if (field.selectedOptions && field.selectedOptions.length > 0) {
                const values = field.selectedOptions.map(option => option.value);
                console.log(`Applying filter on field: ${field.apiName} with values:`, values);

                if (field.objectApiName !== 'Listing__c') {
                    // Filter for related record in another object (Contact)
                    console.log('Filtering related object:', field.objectApiName);
                    this.filteredListings = this.filteredListings.filter(listing => {
                        const relatedRecord = listing[field.prevApiName];
                        return relatedRecord && values.includes(relatedRecord[field.apiName]);
                    });
                } else {
                    // Filter for fields in Listing__c object
                    if (field.picklist) {
                        console.log('Applying picklist filter');
                        this.filteredListings = this.filteredListings.filter(listing =>
                            values.includes(listing[field.apiName])
                        );
                    }

                    if (field.string) {
                        console.log('Applying string filter');
                        this.filteredListings = this.filteredListings.filter(listing =>
                            values.some(value => listing[field.apiName]?.toLowerCase().includes(value.toLowerCase()))
                        );
                    }

                    if (field.currency || field.double) {
                        console.log('Applying currency/double filter');
                        const min = parseFloat(this.minValue) || -Infinity;
                        const max = parseFloat(this.maxValue) || Infinity;
                        this.filteredListings = this.filteredListings.filter(listing =>
                            listing[field.apiName] >= min && listing[field.apiName] <= max
                        );
                    }

                    if (field.date || field.datetime) {
                        console.log('Applying date/datetime filter');
                        if (field.isDateRange) {
                            const min = new Date(field.dateTimeValue[0]).getTime() || -Infinity;
                            const max = new Date(field.dateTimeValue[1]).getTime() || Infinity;
                            this.filteredListings = this.filteredListings.filter(listing => {
                                const dateValue = new Date(listing[field.apiName]).getTime();
                                return dateValue >= min && dateValue <= max;
                            });
                        } else if (field.isDateMax) {
                            const max = new Date(field.dateTimeValue).getTime() || Infinity;
                            this.filteredListings = this.filteredListings.filter(listing => {
                                const dateValue = new Date(listing[field.apiName]).getTime();
                                return dateValue <= max;
                            });
                        } else if (field.isDateMin) {
                            const min = new Date(field.dateTimeValue).getTime() || -Infinity;
                            this.filteredListings = this.filteredListings.filter(listing => {
                                const dateValue = new Date(listing[field.apiName]).getTime();
                                return dateValue >= min;
                            });
                        }
                    }
                }

                console.log('Listings after applying filter:', JSON.stringify(this.filteredListings));
            }
        });

        console.log('Final Filtered Listings:', JSON.stringify(this.filteredListings));
    }
   
    // Picklist field methods

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

    handleFocus1(event) {
        const index = event.currentTarget.dataset.id;
        this.filterFields[index].isFocused = true;
        console.log('index'+index);
        this.filterFields[index].picklistValue = this.filterFields[index].unchangePicklistValue;
        
    }

    handleBlur1(event) {
        // Delay the blur action to allow click event to be registered

        const index = event.currentTarget.dataset.id;
        console.log('index'+index);
        this.filterFields[index].picklistValue = this.filterFields[index].unchangePicklistValue;
        setTimeout(()=>{
            this.filterFields[index].isFocused = false;
        },700);
    }

    selectOption1(event) {
        const value = event.currentTarget.dataset.id;
        const index = event.currentTarget.dataset.index;
        console.log('value'+value);
        console.log('index'+index);

        const field = this.filterFields[index];
        console.log('field'+field);

        if (field != null) {
            console.log('HI');  
            if(field.selectedOptions == null){
                field.selectedOptions = [];
            }             
            field.selectedOptions = [...field.selectedOptions, {"label":value,"value":value}];
            console.log('selectedOptions'+JSON.stringify(field.selectedOptions));
            
        }

        this.searchTerm1 = ''; // Clear the search term to reset the search
        this.isFocused1 = false; // Close the dropdown
    }

    removeOption1(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        const index =  event.currentTarget.dataset.index;
        console.log('index'+index);
        this.filterFields[index].selectedOptions = this.filterFields[index].selectedOptions.filter(option => option.value !== optionToRemove);
    }

    // Stiring fields logic

    handleSearchChangeString(event) {
        const index = event.currentTarget.dataset.id;
        console.log('index'+index);
        this.filterFields[index].searchTerm = event.target.value;
        console.log('filere'+this.filterFields[index].searchTerm);
    }

    // Adds the city to the selected options list
    addTheCity(event) {
        const index = event.currentTarget.dataset.id;
        const value = this.filterFields[index].searchTerm;
        console.log('value'+value);
        if (this.filterFields[index].searchTerm != '') {
            const field = this.filterFields[index];
            if(field.selectedOptions == null){
                field.selectedOptions = [];
            }             
            field.selectedOptions = [...field.selectedOptions, {"label":value,"value":value}];
            console.log('selectedOptions'+JSON.stringify(field.selectedOptions));
        }
    }

    // Removes a selected city from the list
    removeOption(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptionsCity = this.selectedOptionsCity.filter(option => option.value !== optionToRemove);
    }

    // Clears the search input field
    clearSearch(event) {
        const index = event.currentTarget.dataset.id;
        if (index > -1 && index < this.filterFields.length) {
            this.filterFields.splice(index, 1);
        }
    }

    // Min Max fileds logic
    handleMinValueChange(event) {
        const index = event.currentTarget.dataset.index;
        console.log('index'+index);
        const value = event.target.value;
        this.filterFields[index].minValue = value;
        console.log('filterFields'+this.filterFields[index].minValue);
    }

    // Handle change in the max input field
    handleMaxValueChange(event) {
        const index = event.currentTarget.dataset.index;
        console.log('index'+index);
        const value = event.target.value;
        this.filterFields[index].maxValue = value;
        console.log('filterFields'+this.filterFields[index].maxValue);
    }

    // Increment the min input value
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
    }

    // Decrement the min input value
    decrementMinValue(event) {
        const index = event.currentTarget.dataset.index;
        const currentValue = parseInt(this.filterFields[index].minValue, 10);
        if (!isNaN(currentValue) && currentValue > 0) {
            this.filterFields[index].minValue = currentValue - 1;
        } else {
            this.filterFields[index].minValue = 0;
        }
    }

    // Increment the max input value
    incrementMaxValue(event) {
        const index = event.currentTarget.dataset.index;
        const currentValue = parseInt(this.filterFields[index].maxValue, 10);
        if (!isNaN(currentValue)) {
            this.filterFields[index].maxValue = currentValue + 1;
        } else {
            this.filterFields[index].maxValue = 0;
        }
    }

    // Decrement the max input value
    decrementMaxValue(event) {
        const index = event.currentTarget.dataset.index;
        const currentValue = parseInt(this.filterFields[index].maxValue, 10);
        if (!isNaN(currentValue) && currentValue > 0) {
            this.filterFields[index].maxValue = currentValue - 1;
        } else {
            this.filterFields[index].maxValue = 0;
        }
    }

    //checkbox fields handle
     //handel reset
    checkboxFieldChange(event){
        const index = event.currentTarget.dataset.index;
        this.filterFields[index].fieldChecked = !this.filterFields[index].fieldChecked;
    }

    //hadle the date fields
    handleMinDate(event) {
        const index = event.currentTarget.dataset.id;
        const newValue = event.target.value;
        this.filterFields[index].minDate = newValue;
        console.log(`Updated minDate for field ${this.filterFields[index].apiName}:`, this.filterFields[index].minDate);
    }

    handleMaxDate(event) {
        const index = event.currentTarget.dataset.id;
        const newValue = event.target.value;
        this.filterFields[index].maxDate = newValue;
        console.log(`Updated maxDate for field ${this.filterFields[index].apiName}:`, this.filterFields[index].maxDate);
    }

    // Clear both min and max input fields
    clearFields() {
        this.minValue = '';
        this.maxValue = '';
    }

    // handle radio button
    handleChange(event) {
        this.selectedFruit = event.target.value;
    }
     //handel reset
    handleReset(){
        this.filterFields = [...this.staticFields];
    }

    // Modal cmp 

    handleClose() {
        this.addModal = false;
    }

    handleSave() {
        this.addModal = false;
        const childComponent = this.template.querySelector('c-listing-manager-filter-add-cmp');

        if (childComponent) {
            // Call the method on the child component
            childComponent.handleButtonClick();
        }
    }

    openModal(){
        this.addModal = true;
    }
    
}