import { LightningElement,track } from 'lwc';

export default class ListingManagerFilterCmp extends LightningElement {
    @track searchTerm = '';
    @track selectedOptions = [];
    @track options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
        { label: 'Option 4', value: 'option4' },
    ];

    get filteredOptions() {
        if (this.searchTerm === '') {
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

    selectOption(event) {
        const value = event.target.dataset.id;
        const selectedOption = this.options.find(option => option.value === value);
        if (selectedOption && !this.selectedOptions.some(option => option.value === selectedOption.value)) {
            this.selectedOptions = [...this.selectedOptions, selectedOption];
        }
        this.searchTerm = ''; // Clear the search term to reset the search
    }

    removeOption(event) {
        const optionToRemove = event.currentTarget.dataset.id;
        this.selectedOptions = this.selectedOptions.filter(option => option.value !== optionToRemove);
    }
}