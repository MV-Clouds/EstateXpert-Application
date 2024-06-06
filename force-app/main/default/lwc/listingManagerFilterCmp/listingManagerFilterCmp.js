
import { LightningElement,track,api } from 'lwc';

export default class ListingManagerFilterCmp extends LightningElement {
    @track searchTerm = '';
    @track selectedOptions = [];
    @track isFocused = false;
    @track searchTerm1 = '';
    @track selectedOptions1 = [];
    @track isFocused1 = false;
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

    radioOptions = [
        { label: 'All listings', value: 'allListings' },
        { label: 'My lisitngs', value: 'myListings' }
    ];

    handleChange(event) {
        this.selectedFruit = event.target.value;
    }
    @track options = [
        { label: 'Sale', value: 'sale' },
        { label: 'Rent', value: 'rent' }
    ];
    @track options1 = [
        { label: 'Withdraw', value: 'withdraw' },
        { label: 'Sold OA', value: 'sold' }
    ];
    @track checkboxOptions = [
        { label: 'Exact matching', value: 'option1' },
        { label: 'Advanced', value: 'option2' }
    ];

    get showOptions() {
        return this.isFocused || this.searchTerm !== '';
    }

    get filteredOptions() {
        if (this.searchTerm === '' && !this.isFocused) {
            return [];
        }
        return this.options.filter(option =>
            option.label.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
            !this.selectedOptions.some(selectedOption => selectedOption.value === option.value)
        );
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleFocus() {
        this.isFocused = true;
    }

    handleBlur() {
        // Delay the blur action to allow click event to be registered
        setTimeout(() => {
            this.isFocused = false;
        }, 700);
    }

    selectOption(event) {
        const value = event.currentTarget.dataset.id;
        const selectedOption = this.options.find(option => option.value === value);
        if (selectedOption && !this.selectedOptions.some(option => option.value === selectedOption.value)) {
            this.selectedOptions = [...this.selectedOptions, selectedOption];
        }
        this.searchTerm = ''; // Clear the search term to reset the search
        this.isFocused = false; // Close the dropdown
    }

    removeOption(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptions = this.selectedOptions.filter(option => option.value !== optionToRemove);
    }
    get showOptions1() {
        return this.isFocused || this.searchTerm1 !== '';
    }

    get filteredOptions1() {
        if (this.searchTerm1 === '' && !this.isFocused1) {
            return [];
        }
        return this.options1.filter(option =>
            option.label.toLowerCase().includes(this.searchTerm1.toLowerCase()) &&
            !this.selectedOptions1.some(selectedOption => selectedOption.value === option.value)
        );
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

    selectOption1(event) {
        const value = event.currentTarget.dataset.id;
        const selectedOption = this.options1.find(option => option.value === value);
        if (selectedOption && !this.selectedOptions1.some(option => option.value === selectedOption.value)) {
            this.selectedOptions1 = [...this.selectedOptions1, selectedOption];
        }
        this.searchTerm1 = ''; // Clear the search term to reset the search
        this.isFocused1 = false; // Close the dropdown
    }

    removeOption1(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptions1 = this.selectedOptions1.filter(option => option.value !== optionToRemove);
    }


    // city fields logic


    handleSearchChangeCity(event) {
        this.searchCityTerm = event.target.value;
    }

    // Handles the focus event on the input field
    handleCityFocus() {
        // Show options or handle focus related logic if needed
    }

    // Handles the blur event on the input field
    handleCityBlur() {
        // Handle blur related logic if needed
    }

    // Adds the city to the selected options list
    addTheCity() {
        if (this.searchCityTerm) {
            const newCity = { label: this.searchCityTerm, value: this.searchCityTerm };
            // Ensure no duplicate entry
            if (!this.selectedOptionsCity.some(option => option.value === newCity.value)) {
                this.selectedOptionsCity = [...this.selectedOptionsCity, newCity];
            }
            this.searchCityTerm = ''; // Clear the input field
        }
    }

    // Removes a selected city from the list
    removeOption(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptionsCity = this.selectedOptionsCity.filter(option => option.value !== optionToRemove);
    }

    // Clears the search input field
    clearSearch() {
        this.searchCityTerm = '';
    }




    // Min Max fileds logic


    handleMinValueChange(event) {
        this.minValue = event.target.value;
    }

    // Handle change in the max input field
    handleMaxValueChange(event) {
        this.maxValue = event.target.value;
    }

    // Increment the min input value
    incrementMinValue() {
        const currentValue = parseInt(this.minValue, 10);
        if (!isNaN(currentValue)) {
            this.minValue = currentValue + 1;
        } else {
            this.minValue = 1;
        }
    }

    // Decrement the min input value
    decrementMinValue() {
        const currentValue = parseInt(this.minValue, 10);
        if (!isNaN(currentValue) && currentValue > 0) {
            this.minValue = currentValue - 1;
        } else {
            this.minValue = 0;
        }
    }

    // Increment the max input value
    incrementMaxValue() {
        const currentValue = parseInt(this.maxValue, 10);
        if (!isNaN(currentValue)) {
            this.maxValue = currentValue + 1;
        } else {
            this.maxValue = 1;
        }
    }

    // Decrement the max input value
    decrementMaxValue() {
        const currentValue = parseInt(this.maxValue, 10);
        if (!isNaN(currentValue) && currentValue > 0) {
            this.maxValue = currentValue - 1;
        } else {
            this.maxValue = 0;
        }
    }

    // Clear both min and max input fields
    clearFields() {
        this.minValue = '';
        this.maxValue = '';
    }



     // checkbox logic

     handleCheckboxChange(event) {
        this.isChecked = event.target.checked;
    }

    toggleAboutInfo() {
        this.showAboutInfo = !this.showAboutInfo;
    }


    // Modal cmp 


    handleClose() {
        this.addModal = false;
    }

    handleSave() {
        this.addModal = false;
    }

    openModal(){
        this.addModal = true;
    }
               
    
}