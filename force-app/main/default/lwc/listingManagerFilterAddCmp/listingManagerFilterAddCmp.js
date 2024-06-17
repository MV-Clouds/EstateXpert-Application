import { LightningElement, track, wire,api } from 'lwc';
import getListingFields from '@salesforce/apex/ListingManagerFilterController.getListingFields';

export default class ListingManagerFilterAddCmp extends LightningElement {
    @track fieldOptions = [];
    @track selectedFields = [];
    @track selectedField = [];
    @track breadcrumbs = [];
    @track selectedValues = [];
    @track showCombobox = true;
     // Updated to hold the current set of combobox options

    // Custom combobox properties
    @track searchTerm1 = '';
    @track selectedOptions1 = [];
    @track isFocused1 = false;
    @track valueIsField = false;
    @track notCheckboxValue = false;
    @track comboBoxValue;
    @track operationValue;
    @track ListingFields=[];


    connectedCallback() {
        // Fetch fields of Listing__c object when component loads
        this.fetchObjectFields('Listing__c');
    }

     /**
    * Method Name: fetchObjectFields
    * @description: fetch the fields values.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    fetchObjectFields(objectApiName) {
        getListingFields({ objectApiName })
            .then(fields => {
                // console.log('fields'+JSON.stringify(fields));
                const filteredFields = fields;
                if(this.breadcrumbs.length >0){
                    filteredFields = fields.filter(field => field.fieldType != 'REFERENCE');
                }
                if (fields) {
                    this.fieldOptions = filteredFields.map(field => {
                        return {
                            label: field.fieldName, // Only show the label
                            value: field.fieldAPIName,
                            type: field.fieldType, // Add type to identify lookup fields
                            referenceObjectName: field.referenceFields || [], 
                            objectApiName : field.referenceObjectName || '',
                            picklistValues: field.picklistValues || []
                            // Include reference fields if any
                        };
                    });
                    this.options1 = this.fieldOptions;
                }
            })
            .catch(error => {
                console.error('Error fetching object fields:', error);
            });
    }

    fetchObjectFieldsWithoutReference(objectApiName) {
        getListingFields({ objectApiName })
            .then(fields => {
                // console.log('fields'+JSON.stringify(fields));
                const filteredFields = fields.filter(field => field.fieldType != 'REFERENCE');

                if (fields) {
                    this.fieldOptions = filteredFields.map(field => {
                        return {
                            label: field.fieldName, // Only show the label
                            value: field.fieldAPIName,
                            type: field.fieldType, // Add type to identify lookup fields
                            referenceObjectName: field.referenceFields || [], 
                            objectApiName : field.referenceObjectName || '',
                            picklistValues: field.picklistValues || []
                            // Include reference fields if any
                        };
                    });
                    this.options1 = this.fieldOptions;
                }
            })
            .catch(error => {
                console.error('Error fetching object fields:', error);
            });
    }

     /**
    * Method Name: currentFieldOptions
    * @description: getter for the set the current selectedfield operator options.
    * Date: 09/06/2024
    * Created By: Vyom Soni
    **/
    get currentFieldOptions() {
        if (this.selectedField.length === 0) return [];

        const fieldType = this.selectedField[0].type;
        let options = [];

        switch (fieldType) {
            case 'PICKLIST':
                options = [
                    { label: 'Includes', value: 'includes' },
                    { label: 'Equals', value: 'equals' }
                ];
                break;
            case 'BOOLEAN':
                options = [
                    { label: 'True/False', value: 'boolean' }
                ];
                break;
            case 'DOUBLE':
                options = [
                    { label: 'Range', value: 'range' },
                    { label: 'Minimum', value: 'minimum' },
                    { label: 'Maximum', value: 'maximum' }
                ];
                break;
            case 'CURRENCY':
                options = [
                    { label: 'Range', value: 'range' },
                    { label: 'Minimum', value: 'minimum' },
                    { label: 'Maximum', value: 'maximum' }
                ];
                break;
            case 'STRING':
                options = [
                    { label: 'Equals', value: 'equals' },
                    { label: 'Contains', value: 'contains' },
                    { label: 'Starts With', value: 'startswith' }
                ];
                break;
            case 'TEXTAREA':
                options = [
                    { label: 'Equals', value: 'equals' },
                    { label: 'Contains', value: 'contains' },
                    { label: 'Starts With', value: 'startswith' }
                ];
                break;
            case 'DATE':
                options = [
                    { label: 'Date Range', value: 'daterange' },
                    { label: 'Date Minimum', value: 'dateminimum' },
                    { label: 'Date Maximum', value: 'datemaximum' }
                ];
                break;
            case 'DATETIME':
                options = [
                    { label: 'Date Range', value: 'daterange' },
                    { label: 'Date Minimum', value: 'dateminimum' },
                    { label: 'Date Maximum', value: 'datemaximum' }
                ];
                break;
            case 'ID':
                options = [
                    { label: 'Equals', value: 'equals' }
                ];
                break;
            case 'EMAIL':
                options = [
                    { label: 'Equals', value: 'equals' }
                ];
                break;
            case 'PHONE':
                options = [
                    { label: 'Equals', value: 'equals' }
                ];
                break;
            case 'URL':
                options = [
                    { label: 'Equals', value: 'equals' }
                ];
                break;
            default:
                options = [];
        }
        this.selectedField[0].operation = options[0].value;
        return options;
    }

     /**
    * Method Name: changeFields,isAuditField,isStandardField,handleFieldSelect
    * @description: handle the fields select of non-reference field.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    changeFields(event){
        this.handleFieldSelect(event);
        this.showCombobox = false;
        this.valueIsField = true;
        this.selectedField= [this.selectedFields.length > 0 ? this.selectedFields[this.selectedFields.length - 1] : null];
        
        
        console.log('log'+JSON.stringify(this.selectedField));
        console.log('if'+JSON.stringify(this.selectedFields.length > 0 ? this.selectedFields[this.selectedFields.length - 1] : null));
    }

    isAuditField(fieldName) {
        return fieldName.toLowerCase().startsWith('created') || fieldName.toLowerCase().startsWith('lastmodified');
    }

    isStandardField(fieldName) {
        return fieldName.toLowerCase() === 'id' || fieldName.toLowerCase() === 'systemmodstamp' || fieldName.toLowerCase() === 'ownerid';
    }

    handleFieldSelect(event) {
        const selectedValue = event.currentTarget.dataset.id;
        const selectedField = this.fieldOptions.find(option => option.value === selectedValue);
        // const selectedField = this.findFieldRecursively(this.fieldOptions, selectedValue);
    
        if (selectedValue && selectedField && !this.selectedValues.includes(selectedValue)) {
            
            this.selectedFields.push({ label: selectedField.label, objectApiName: selectedField.objectApiName,value:selectedField.value,type:selectedField.type,picklistValues:selectedField.picklistValues,prevApiName:this.selectedValues.length > 0 ? this.selectedValues[this.selectedValues.length - 1]:''}); // Only store the label
            console.log('selected'+JSON.stringify(this.selectedFields));
            this.selectedValues.push(selectedValue);
            this.updateBreadcrumbs();
        }
        this.searchTerm1 = ''; // Clear the search term to reset the search
        this.isFocused1 = false; // Close the dropdown
    }
    

      /**
    * Method Name: changeTheCheckboxValue
    * @description: handle the fields select of reference field.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    changeTheCheckboxValue(event){
        this.selectedField = [];
        this.valueIsField = false;
        const selectedValue = event.currentTarget.dataset.id;
        // console.log('Id'+selectedValue);
        const selectedField = this.fieldOptions.find(option => option.value === selectedValue);
        //this.options1.forEach(elem => console.log('hi'+elem.value +'1'+ elem.referenceFields.length));
        // console.log('selectedFiedls'+JSON.stringify(selectedField));
        // console.log('1'+selectedField.objectApiName);
        if(selectedField != null){
            this.handleFieldSelect(event);
            this.fetchObjectFieldsWithoutReference(selectedField.objectApiName);
        }
    }

     /**
    * Method Name: findFieldRecursively
    * @description: this method check the from fiedls hierarchy.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    findFieldRecursively(fields, selectedValue) {
        for (let field of fields) {
            if (field.apiName === selectedValue || field.value === selectedValue) {
                // console.log("Field found:", field);
                return field; // Return the field if found
            }
            // If the current field is a reference field and has referenceFields, recursively search them
            if (field.type === 'REFERENCE' && field.referenceFields && field.referenceFields.length > 0) {
                // console.log("Recursing into referenceFields:", field.referenceFields);
                const foundField = this.findFieldRecursively(field.referenceFields, selectedValue);
                if (foundField) {
                    // console.log("Found field in referenceFields:", foundField);
                    return foundField; // Return the found field if it exists
                }
            }
        }
        return null; // Return null if the field is not found
    }

     /**
    * Method Name: updateBreadcrumbs,handleBreadcrumbClick
    * @description: handle the combobox values when the bread crumbs is clicked.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    updateBreadcrumbs() {
        this.valueIsField = false;
        this.breadcrumbs = this.selectedFields.map(selectedValue => {
            return { label: selectedValue.label };
        });
        
        console.log('this.breadcrumbs'+JSON.stringify(this.breadcrumbs));
        console.log('this.breadcrumbs'+JSON.stringify(this.selectedValues));
    }
        handleBreadcrumbClick(event) {
            const clickedIndex = parseInt(event.currentTarget.dataset.index, 10);
            this.selectedFields = this.selectedFields.slice(0, clickedIndex);
            this.selectedValues = this.selectedValues.slice(0, clickedIndex);
           this.selectedField = [];
           this.handleAddButtonDisable();

            if (this.selectedValues.length > 0) {
                const lastSelectedValue = this.selectedValues[this.selectedValues.length - 1];
                const lastSelectedField = this.selectedFields[this.selectedFields.length - 1].objectApiName;
                console.log('lastSelectedValue'+lastSelectedValue);
                console.log('lastSelectedValue2'+typeof lastSelectedField);
                if(lastSelectedField == null){
                    lastSelectedField='Listing__c'
                }
                if(clickedIndex == 0){
                    this.fieldOptions = this.options1;
                }else if(clickedIndex == this.breadcrumbs.length-1){
                    console.log('byr');
                    
                }else{
                    console.log('lastSelec'+lastSelectedField);
                    console.log('lastSelec2'+lastSelectedValue);
                    this.fetchObjectFields(lastSelectedField);
                }
                
            } else {
                this.fetchObjectFields('Listing__c');
            }
    
            this.showCombobox = true;
            this.updateBreadcrumbs();
    
        }

     /**
    * Method Name: handleSearchChange1,handleFocus1,handleBlur1,filteredOptions1,isLookupField
    * @description: handle combobox option show and handle search function.
    * Date: 07/06/2024
    * Created By: Vyom Soni
    **/
    handleSearchChange1(event) {
        this.searchTerm1 = event.target.value;
    }

    handleFocus1() {
        this.isFocused1 = true;
    }

    handleBlur1() {
        // Delay the blur action to allow click event to be registered
        setTimeout(() => {
            this.isFocused1 = false;
        }, 700);
    }

    
    get showOptions1() {
        return this.isFocused1 || this.searchTerm1 !== '';
    }

    get filteredOptions1() {
        if (this.searchTerm1 === '' && !this.isFocused1) {
            return [];
        }
        return this.options1.filter(option =>
            option.label.toLowerCase().includes(this.searchTerm1.toLowerCase()) &&
            !this.selectedOptions1.some(selectedOption => selectedOption.value === option.value)
        ).map(option => ({
            ...option,
            showRightIcon: this.isLookupField(option.type) // Check if it's a lookup field
        }));
    }

    isLookupField(fieldType) {
        return fieldType === 'REFERENCE' || fieldType === 'Lookup' ; // Adjust this condition based on your field types
    }

    removeOption1(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptions1 = this.selectedOptions1.filter(option => option.value !== optionToRemove);
    }


    get computedDropdownClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.isFocused1 ? 'slds-is-open' : ''}`;
    }

    handleNotCheckboxChange(event){
        this.notCheckboxValue = event.target.checked;
    }

    handleComboboxChange(event){
        this.comboBoxValue =  event.target.value;
    }

    // operation checkbox change login

     /**
    * Method Name: handleNotCheckboxChange
    * @description: handle the not checkbox change.
    * Date: 09/06/2024
    * Created By: Vyom Soni
    **/
    handleNotCheckboxChange(event) {
        this.notCheckboxValue = event.target.checked;
        this.selectedField[0].isNot = event.target.checked;
        console.log('1'+JSON.stringify(this.selectedField));
    }

    /**
    * Method Name: operationSelect
    * @description: handle the operation combobox change.
    * Date: 09/06/2024
    * Created By: Vyom Soni
    **/
    operationSelect(event){
        this.selectedField[0].operation = event.target.value;
        console.log('2'+JSON.stringify(this.selectedField));
        this.handleAddButtonDisable();
    }

    handleAddButtonDisable(){
        this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.selectedField }));
    }

    /**
    * Method Name: handleButtonClick
    * @description: It is call from the parent component and it send teh selected field to parent component.
    * Date: 09/06/2024
    * Created By: Vyom Soni
    **/
    @api
    handleButtonClick() {
        // Create a custom event with the value you want to pass to the parent
        const customEvent = new CustomEvent('valueselected', {
            detail: this.selectedField
        });
        
        // Dispatch the custom event
        this.dispatchEvent(customEvent);
    }


}
