import { LightningElement, track, wire } from 'lwc';
import getListingFields from '@salesforce/apex/ListingManagerFilterController.getListingFields';

export default class ListingManagerFilterAddCmp extends LightningElement {
    @track fieldOptions = [];
    @track selectedFields = [];
    @track breadcrumbs = [];
    @track selectedValues = [];
    @track showCombobox = true;
    @track options1 = []; // Updated to hold the current set of combobox options

    // Custom combobox properties
    @track searchTerm1 = '';
    @track selectedOptions1 = [];
    @track isFocused1 = false;
    @track notOption = [
        { label: 'Not', value: 'not' }
    ];
    @track comboboxOptions = [
        {lable:'Is', value:'is'},
        {lable:'Is Not', value:'isnot'},
        {lable:'Includes', value:'includes'},
        {lable:'Excludes', value:'excludes'},
        {lable:'Starts With', value: 'startswith'}
    ]
    @track valueIsField = true;
    @track notCheckboxValue;
    @track comboBoxValue;


    connectedCallback() {
        // Fetch fields of Listing__c object when component loads
        this.fetchObjectFields('Listing__c');
    }

    fetchObjectFields(objectApiName) {
        getListingFields({ objectApiName })
            .then(fields => {
                if (fields) {
                    this.fieldOptions = fields.map(field => {
                        return {
                            label: field.label, // Only show the label
                            value: field.apiName,
                            type: field.type, // Add type to identify lookup fields
                            referenceFields: field.referenceFields || [], // Include reference fields if any
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
        this.showCombobox = false;
        this.handleFieldSelect(event);
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
        this.showCombobox = true;
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

    changeTheCheckboxValue(event){
        const selectedValue = event.currentTarget.dataset.id;
        const selectedField = this.fieldOptions.find(option => option.value === selectedValue);
        console.log('selectedFiedls'+JSON.stringify(selectedField));
        if (selectedField.type === 'REFERENCE' && selectedField.referenceFields.length > 0) {
            this.options1 = selectedField.referenceFields.map(refField => {
                return {
                    label: refField.label,
                    value: refField.apiName,
                    type: refField.type,
                    referenceFields: refField.referenceFields || []
                };
            });
            this.handleFieldSelect(event);
            console.log('Hi'+JSON.stringify(this.options1));
        }
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

    handleNotCheckboxChange(event){
        this.notCheckboxValue = event.target.checked;
    }

    handleComboboxChange(event){
        this.comboBoxValue =  event.target.value;
    }
}
