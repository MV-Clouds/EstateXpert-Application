import { LightningElement, track } from 'lwc';
import getObjectFields from '@salesforce/apex/DynamicMappingCmp.getObjectFields';
import saveMappings from '@salesforce/apex/DynamicMappingCmp.saveMappings';
import getMetadata from '@salesforce/apex/DynamicMappingCmp.getMetadata';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MappingComponent extends LightningElement {
    @track dropDownPairs = [];
    @track listingOptions = [];
    @track inquiryOptions = [];
    @track mainListingOptions = [];
    @track mainInquiryOptions = [];
    @track checkboxValue = false;
    @track temp = false;
    @track isLoading = false;
    @track showConfirmationModal = false;
    @track conditionsOptions = [
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
        { label: 'Equal To', value: 'equalTo' }
    ];

    get delButtonClass() {
        return this.checkboxValue
            ? 'slds-var-m-left_x-small del-button disabled-del'
            : 'slds-var-m-left_x-small del-button';
    }

    get saveButtonDisabled() {
        return this.dropDownPairs.every(pair => !pair.selectedListing || !pair.selectedInquiry || !pair.selectedCondition);
    }

    connectedCallback() {
        this.isLoading = true;
        getObjectFields({ objectName: 'Listing__c' })
            .then((data) => {
                this.handleListingObjectFields(data);
                if (this.mainListingOptions.length !== 0) {
                    this.callInquiryFields();
                }
            })
            .catch((error) => {
                console.error('Error fetching Listing field data', error);
                this.showToast('Error', 'Error fetching Listing field data', 'error');
                this.isLoading = false;
            });
    }

    callInquiryFields() {
        getObjectFields({ objectName: 'Inquiry__c' })
            .then((data) => {
                this.handleInquiryObjectFields(data);
                if (this.mainInquiryOptions.length !== 0) {
                    this.getMetadataFunction();
                }
            })
            .catch((error) => {
                console.error('Error fetching Inquiry field data', error);
                this.showToast('Error', 'Error fetching Inquiry field data', 'error');
                this.isLoading = false;
            });
    }

    handleListingObjectFields(data) {
        if (data) {
            this.mainListingOptions = data.map((field) => ({
                label: field.label,
                value: field.apiName,
                dataType: field.dataType
            }));
            this.listingOptions = [...this.mainListingOptions];
        }
    }

    handleInquiryObjectFields(data) {
        if (data) {
            this.mainInquiryOptions = data.map((field) => ({
                label: field.label,
                value: field.apiName,
                dataType: field.dataType
            }));
            this.inquiryOptions = [...this.mainInquiryOptions];
        }
    }

    getMetadataFunction() {
        getMetadata()
            .then((result) => {
                console.log('result ==> ', JSON.stringify(result));
                if (result[0] != null) {
                    this.parseAndSetMappings(result[0]);
                }
                const isAutoSync = result.length > 0 ? result[1] : false;
                this.setCheckboxValue(isAutoSync);
            })
            .catch((error) => {
                console.error('Error fetching metadata:', error);
                this.showToast('Error', 'Error fetching metadata', 'error');
                this.isLoading = false;
            });
    }

    parseAndSetMappings(mappingString) {
        const mappings = mappingString.split(';');
        if (this.listingOptions != null) {
            mappings.forEach((mapping) => {
                this.isLoading = true;
                const [selectedListing, condition, selectedInquiry] = mapping.split(':');
                if (selectedListing && selectedInquiry && condition) {
                    const newPair = {
                        id: this.dropDownPairs.length,
                        selectedListing: selectedListing,
                        selectedInquiry: selectedInquiry,
                        selectedCondition: condition,
                        listingOptions: this.listingOptions,
                        inquiryOptions: this.filterInquiryOptions(selectedListing),
                        conditionsOptions: this.conditionsOptions,
                        isInquiryPicklistDisabled: false
                    };
                    this.dropDownPairs.push(newPair);
                    this.filterAndUpdateListingOptions();
                    this.filterAndUpdateInquiryOptions();
                }
                this.isLoading = false;
            });
            this.isLoading = false;
        }
    }

    setCheckboxValue(isAutoSync) {
        this.checkboxValue = isAutoSync === 'true';
        console.log(this.checkboxValue);
    }

    filterInquiryOptions(selectedListing) {
        if (!selectedListing) return this.inquiryOptions;
        const selectedListingField = this.listingOptions.find(
            (option) => option.value === selectedListing
        );
        if (selectedListingField) {
            return this.mainInquiryOptions.filter((option) => option.dataType === selectedListingField.dataType);
        }
        return this.inquiryOptions;
    }

    handleSourceFieldChange(event) {
        const index = event.target.dataset.index;
        this.dropDownPairs[index].selectedListing = event.detail.value;
        this.dropDownPairs[index].inquiryOptions = this.filterInquiryOptions(event.detail.value);
        this.filterAndUpdateListingOptions();
    }

    handleConditionChange(event) {
        const index = event.target.dataset.index;
        this.dropDownPairs[index].selectedCondition = event.detail.value;
    }

    filterAndUpdateListingOptions() {
        const selectedListings = this.dropDownPairs.map((pair) => pair.selectedListing);
        this.listingOptions = this.mainListingOptions.filter(
            (option) => !selectedListings.includes(option.value)
        );
    }

    filterAndUpdateInquiryOptions() {
        const selectedInquiries = this.dropDownPairs.map((pair) => pair.selectedInquiry);
        this.inquiryOptions = this.mainInquiryOptions.filter(
            (option) => !selectedInquiries.includes(option.value)
        );
    }

    handleDestinationFieldChange(event) {
        const index = event.target.dataset.index;
        this.dropDownPairs[index].selectedInquiry = event.detail.value;
    }

    deletePair(event) {
        const index = event.target.value;
        this.dropDownPairs.splice(index, 1);
        this.filterAndUpdateListingOptions();
        this.filterAndUpdateInquiryOptions();
    }

    addNewPair() {
        this.dropDownPairs.push({
            id: this.dropDownPairs.length,
            selectedListing: '',
            selectedInquiry: '',
            selectedCondition: '',
            listingOptions: this.listingOptions,
            inquiryOptions: this.inquiryOptions,
            conditionsOptions: this.conditionsOptions,
            isInquiryPicklistDisabled: false
        });
        this.filterAndUpdateListingOptions();
        this.filterAndUpdateInquiryOptions();
    }

    handleAddPairClick() {
        this.showConfirmationModal = true;
    }

    handleConfirmAddPair() {
        this.isLoading = true;
        const data = this.dropDownPairs.map((pair) => 
            `${pair.selectedListing}:${pair.selectedCondition}:${pair.selectedInquiry}`
        ).join(';');

        saveMappings({ mappingsData: data, checkboxValue: this.checkboxValue })
            .then(() => {
                this.showToast('Success', 'Mappings saved successfully', 'success');
                this.showConfirmationModal = false;
                this.isLoading = false;
            })
            .catch((error) => {
                this.showToast('Error', 'Error saving mappings', 'error');
                this.isLoading = false;
            });
    }

    closeConfirmationModal() {
        this.showConfirmationModal = false;
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    handleCheckboxChange(event) {
        this.checkboxValue = event.target.checked;
        console.log(this.checkboxValue);
    }
}
