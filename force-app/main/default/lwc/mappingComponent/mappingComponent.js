import { LightningElement, track } from 'lwc';
import getObjectFields from '@salesforce/apex/DynamicMappingCmp.getObjectFields';
import saveMappings from '@salesforce/apex/DynamicMappingCmp.saveMappings';
import getMetadata from '@salesforce/apex/DynamicMappingCmp.getMetadata';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import externalCss from '@salesforce/resourceUrl/templateCss';
	
export default class MappingComponent extends LightningElement {
    @track dropDownPairs = [];
    @track listingOptions = [];
    @track inquiryOptions = [];
    @track mainListingOptions = [];
    @track mainInquiryOptions = [];
    @track checkboxValue = false;
    @track isLoading = false;
    @track showConfirmationModal = false;
    @track logicalCondition = '';
    @track isSaveButtonDisabled = true;
    @track isModalOpen = false;
    @track conditionsOptions = [
        { label: 'Greater Than', value: 'greaterThan', type: 'DOUBLE', type2: 'DOUBLE' },
        { label: 'Less Than', value: 'lessThan', type: 'DOUBLE', type2: 'DOUBLE' },
        { label: 'Equal To', value: 'equalTo', type: 'DOUBLE', type2: 'TEXT' },
        { label: 'Contains', value: 'contains', type: 'TEXT', type2: 'TEXT' }
    ];

    @track objectOptions = [
        { label: 'Listing', value: 'Listing__c' },
        { label: 'Inquiry', value: 'Inquiry__c' }
    ];

    get delButtonClass() {
        return this.checkboxValue
            ? 'slds-var-m-left_x-small del-button disabled-del'
            : 'slds-var-m-left_x-small del-button';
    }

    get dropDownPairsWithIndex() {
        return this.dropDownPairs.map((pair, index) => ({
            ...pair,
            displayIndex: index + 1
        }));
    }

    connectedCallback() {
        this.isLoading = true;

        loadStyle(this, externalCss);

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
                console.log('result ==> ' , JSON.stringify(result));
                if (result[0] != null) { 
                    this.parseAndSetMappings(result[0]);
                }
                const isAutoSync = result.length > 0 ? result[1] : false;
                const logicalExpression = result.length > 1 ? result[2] : '';
                if(logicalExpression){
                    this.logicalCondition = logicalExpression;
                }
                console.log(this.logicalCondition);
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
                const [selectedObject ,selectedListing, condition, selectedInquiry] = mapping.split(':');
                if (selectedListing && selectedInquiry && condition) {
                    const isInquiry = selectedObject === 'Inquiry__c';
                    const newPair = {
                        selectedObject : selectedObject ,
                        id: this.dropDownPairs.length,
                        selectedFirst: selectedListing,
                        selectedSecond: selectedInquiry,
                        selectedCondition: condition,
                        conditionsOptions : this.filterConditionOptions(selectedListing),
                        firstlabel: isInquiry ? 'Inquiry Field' : 'Listing Field',
                        secondlabel: isInquiry ? 'Listing Field' : 'Inquiry Field',
                        firstOptions: isInquiry ? this.inquiryOptions : this.listingOptions,
                        secondOptions: isInquiry ? this.listingOptions : this.inquiryOptions
                    };
                    this.dropDownPairs.push(newPair);
                }
                this.filterAndUpdateOptions();
                this.isLoading = false;
            });
            this.isLoading = false;
        }
    }
    
    filterAndUpdateOptions() {
        const selectedFirstOptions = new Set();
        const selectedSecondOptions = new Set();
    
        this.dropDownPairs.forEach(pair => {
            if (pair.selectedFirst) {
                selectedFirstOptions.add(pair.selectedFirst);
            }
            if (pair.selectedSecond) {
                selectedSecondOptions.add(pair.selectedSecond);
            }
        });
    
        // Update the options for each pair
        this.dropDownPairs = this.dropDownPairs.map(pair => {
            let filteredFirstOptions = this.listingOptions;
            let filteredSecondOptions = this.inquiryOptions;
    
            if (pair.selectedObject === 'Listing__c') {
                filteredFirstOptions = this.listingOptions.filter(option => !selectedFirstOptions.has(option.value) || option.value === pair.selectedFirst);
                filteredSecondOptions = this.inquiryOptions.filter(option => !selectedSecondOptions.has(option.value) || option.value === pair.selectedSecond);
            } else if (pair.selectedObject === 'Inquiry__c') {
                filteredFirstOptions = this.inquiryOptions.filter(option => !selectedFirstOptions.has(option.value) || option.value === pair.selectedFirst);
                filteredSecondOptions = this.listingOptions.filter(option => !selectedSecondOptions.has(option.value) || option.value === pair.selectedSecond);
            }
    
            return {
                ...pair,
                firstOptions: filteredFirstOptions,
                secondOptions: filteredSecondOptions
            };
        });
    
        // Ensure previously selected values in other rows remain valid
        this.dropDownPairs.forEach((pair, index) => {
            if (pair.selectedFirst && !this.dropDownPairs[index].firstOptions.find(option => option.value === pair.selectedFirst)) {
                this.dropDownPairs[index].selectedFirst = '';
            }
            if (pair.selectedSecond && !this.dropDownPairs[index].secondOptions.find(option => option.value === pair.selectedSecond)) {
                this.dropDownPairs[index].selectedSecond = '';
            }
        });
    
        // Refresh the dropDownPairs to update the view
        this.dropDownPairs = [...this.dropDownPairs];
    }
    
    
    handleModalOpen(){
        this.isModalOpen = true;
    }

    hideModalBox(){
        this.isModalOpen = false;
    }

    setCheckboxValue(isAutoSync) {
        this.checkboxValue = isAutoSync === 'true';
    }

    handleFirstFieldChange(event) {
        const index = event.target.dataset.index;
        const selectedFirst = event.detail.value;
        const selectedObject = event.target.dataset.object;
    
        let filteredSecondOptions = [];
    
        if (selectedObject === 'Listing__c') {
            const selectedFirstField = this.listingOptions.find(option => option.value === selectedFirst);
            const selectedFirstDataType = selectedFirstField ? selectedFirstField.dataType : null;
            
            filteredSecondOptions = this.mainInquiryOptions.filter(option => option.dataType === selectedFirstDataType);
        } else if (selectedObject === 'Inquiry__c') {
            const selectedFirstField = this.inquiryOptions.find(option => option.value === selectedFirst);
            const selectedFirstDataType = selectedFirstField ? selectedFirstField.dataType : null;
            filteredSecondOptions = this.mainListingOptions.filter(option => option.dataType === selectedFirstDataType);
        }
    
        this.dropDownPairs = this.dropDownPairs.map((pair, i) => {
            if (i === parseInt(index, 10)) {
                return { ...pair, selectedFirst, secondOptions: filteredSecondOptions ,conditionsOptions: this.filterConditionOptions(selectedFirst),selectedSecond : '',selectedCondition : ''};
            }
            return pair;
        });

        this.updateSaveButtonState();

    }

    handleConditionChange(event) {
        const index = event.target.dataset.index;
        const selectedCondition = event.detail.value;

        this.dropDownPairs = this.dropDownPairs.map((pair, i) => {
            if (i === parseInt(index, 10)) {
                return { ...pair, selectedCondition };
            }
            return pair;
        });

        this.updateSaveButtonState();

    }

    handleSecondFieldChange(event) {
        const index = event.target.dataset.index;
        const selectedSecond = event.detail.value;

        this.dropDownPairs = this.dropDownPairs.map((pair, i) => {
            if (i === parseInt(index, 10)) {
                return { ...pair, selectedSecond };
            }
            return pair;
        });

        this.updateSaveButtonState();

    }

    filterConditionOptions(selectedFirst) {
        if (!selectedFirst) return this.conditionsOptions;
    
        const selectedFirstField = this.listingOptions.find(option => option.value === selectedFirst) || 
                                   this.inquiryOptions.find(option => option.value === selectedFirst);
    
        if (selectedFirstField) {
            if (selectedFirstField.dataType === 'DOUBLE' || selectedFirstField.dataType === 'CURRENCY' || selectedFirstField.dataType === 'DATETIME') {
                return this.conditionsOptions.filter(option => option.type === 'DOUBLE');
            } else {
                return this.conditionsOptions.filter(option => option.type === 'TEXT' || option.type2 === 'TEXT');
            }
        }
        return this.conditionsOptions;
    }

    handleObjectChange(event) {
        const index = event.target.dataset.index;
        const selectedObject = event.target.value;

        const isInquiry = selectedObject === 'Inquiry__c';
        this.dropDownPairs[index] = {
            ...this.dropDownPairs[index],
            selectedObject : selectedObject,
            selectedFirst : '',
            selectedSecond : '',
            selectedCondition: '',
            conditionsOptions : this.conditionsOptions,
            firstlabel: isInquiry ? 'Inquiry Field' : 'Listing Field',
            secondlabel: isInquiry ? 'Listing Field' : 'Inquiry Field',
            firstOptions: isInquiry ? this.inquiryOptions : this.listingOptions,
            secondOptions: isInquiry ? this.listingOptions : this.inquiryOptions
    
        };
        this.dropDownPairs = [...this.dropDownPairs];
        this.filterAndUpdateOptions();
    }


    updateSaveButtonState() {
        const allNotEmpty = this.dropDownPairs.every(pair => pair.selectedFirst !== '' && pair.selectedSecond !== '' && pair.selectedCondition !== '');
        console.log('allNotEmpty ==> ' ,allNotEmpty);
        this.isSaveButtonDisabled = !allNotEmpty;
    }

    deletePair(event) {
        const index = event.target.value;
        this.dropDownPairs.splice(index, 1);
        this.filterAndUpdateOptions();
        this.updateSaveButtonState();
    }

    addNewPair() {
        const selectedObject = 'Listing__c';
        const isInquiry = selectedObject === 'Inquiry__c';

        this.dropDownPairs.push({
            id: this.dropDownPairs.length,
            selectedObject : selectedObject,
            firstOptions: isInquiry ? this.inquiryOptions : this.listingOptions,
            secondOptions: isInquiry ? this.listingOptions : this.inquiryOptions,
            selectedFirst: '',
            selectedSecond: '',
            selectedCondition: '',
            conditionsOptions : this.conditionsOptions,
            firstlabel: isInquiry ? 'Inquiry Field' : 'Listing Field',
            secondlabel: isInquiry ? 'Listing Field' : 'Inquiry Field',
        });
        this.filterAndUpdateOptions();
    }

    handleAddPairClick() {
        const isLogicalExpression = this.checkConditionSyntax(false);
        console.log('isLogicalExpression ==> ' , isLogicalExpression);

        if(isLogicalExpression === true){
            this.showConfirmationModal = true;
        }
    }

    handleConfirmAddPair() {
        this.isLoading = true;
        const data = this.dropDownPairs.map((pair) =>
            `${pair.selectedObject}:${pair.selectedFirst}:${pair.selectedCondition}:${pair.selectedSecond}`
        ).join(';');

        saveMappings({ mappingsData: data, checkboxValue: this.checkboxValue ,logicalCondition : this.logicalCondition})
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
        this.isSaveButtonDisabled = false;
    }

    handleConditionInputChange(event) {
        this.logicalCondition = event.target.value;
    }

    checkConditionSyntax(isShowToast) {
        console.log('logicalCondition ==> ', this.logicalCondition);
    
        const listingLength = this.dropDownPairs.length;
        console.log('listingLength ==> ', listingLength);
    
        const regex = /\d+\s*(?:&&|\|\|)\s*\d+/;
    
        const inputElement = this.template.querySelector('lightning-input[data-id="condition-input"]');
    
        if (!regex.test(this.logicalCondition)) {
            inputElement.setCustomValidity('Invalid condition syntax');
            inputElement.reportValidity();
            this.isSaveButtonDisabled = true;
            return false;
        }
    
        const numbers = this.logicalCondition.match(/\d+/g);
        if (numbers) {
            const numberSet = new Set(numbers.map(Number));
            console.log(numberSet);
            const invalidIndex = Array.from(numberSet).some(num => num >= listingLength + 1);
            console.log(invalidIndex);
    
            if (invalidIndex) {
                inputElement.setCustomValidity('Condition uses invalid index');
                inputElement.reportValidity();
                this.isSaveButtonDisabled = true;
                return false;
            } else {
                inputElement.setCustomValidity('');
                inputElement.reportValidity();
                this.isSaveButtonDisabled = false; 
                if(isShowToast){
                    this.showToast('Success', 'Condition syntax is correct', 'success');
                }
                return true;
            }
        } else {
            inputElement.setCustomValidity('Condition syntax is correct but contains no indices');
            inputElement.reportValidity();
            return false;
        }
        
    }
    
}
