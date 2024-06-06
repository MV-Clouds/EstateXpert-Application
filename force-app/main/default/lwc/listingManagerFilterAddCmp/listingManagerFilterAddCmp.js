import { LightningElement, track, wire } from 'lwc';
import getObjectFields from '@salesforce/apex/ListingManagerFilterController.getObjectFields';

export default class ListingManagerFilterAddCmp extends LightningElement {
    @track fieldOptions = [];
    @track selectedFields = [];
    @track breadcrumbs = [];
    @track selectedValues = [];

    // Custom combobox properties
    @track searchTerm1 = '';
    @track selectedOptions1 = [];
    @track isFocused1 = false;
    @track options1 = [];

    
    connectedCallback() {
        // Fetch fields of Listing__c object when component loads
        this.fetchObjectFields('Listing__c');
    }

    
    fetchObjectFields(objectApiName) {
        if (!objectApiName) {
            console.error('Error: objectApiName is null or undefined');
            return;
        }
        
        getObjectFields({ objectApiName })
            .then(fields => {
                if (fields) {
                    this.fieldOptions = fields.map(field => {
                        return { 
                            label: field.label, // Only show the label
                            value: field.apiName,
                            type: field.type // Add type to identify lookup fields
                        };
                    });
                    this.options1 = this.fieldOptions;
                }
            })
            .catch(error => {
                console.error('Error fetching object fields:', error);
            });
    }

    changeFields(event){
        const selectedValue = event.currentTarget.dataset.id;
        console.log('Hi'+selectedValue);
        setTimeout(() => {
            this.fetchObjectFields('Account');
        }, 200);

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

        if (selectedValue && selectedField && !this.selectedValues.includes(selectedValue)) {
            this.selectedValues.push(selectedValue);
            this.selectedFields.push(selectedField.label); // Only store the label
            this.updateBreadcrumbs();
        }
        this.searchTerm1 = ''; // Clear the search term to reset the search
        this.isFocused1 = false; // Close the dropdown
    }

    updateBreadcrumbs() {
        this.breadcrumbs = this.selectedFields.map(label => {
            return { label };
        });
    }

    handleBreadcrumbClick(event) {
        const clickedIndex = parseInt(event.currentTarget.dataset.index, 10);
        this.selectedFields = this.selectedFields.slice(0, clickedIndex);
        this.selectedValues = this.selectedValues.slice(0, clickedIndex);
        this.updateBreadcrumbs();
    }

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
        return fieldType === 'REFERENCE' || fieldType === 'Lookup'; // Adjust this condition based on your field types
    }

    removeOption1(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptions1 = this.selectedOptions1.filter(option => option.value !== optionToRemove);
    }

    get computedDropdownClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.isFocused1 ? 'slds-is-open' : ''}`;
    }
}
