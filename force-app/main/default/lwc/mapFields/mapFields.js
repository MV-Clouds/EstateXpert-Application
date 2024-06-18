import { LightningElement, api, track, wire } from 'lwc';
import getObjectFields from '@salesforce/apex/MapFieldCmp.getObjectFields';
import saveMappings from '@salesforce/apex/MapFieldCmp.saveMappings';
import getMetadata from '@salesforce/apex/MapFieldCmp.getMetadata';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import doubleSideArrow from '@salesforce/resourceUrl/doubleSideArrow';

export default class MapFields extends LightningElement {
    @api recordId;
    @track selectedValues = [];
    @track comboboxes = [];
    @track dropDownPairs = [];
    ListingOptions = [];
    MainListingOptions = [];
    updateListing = [];
    updateProperty = [];
    PropertyOptions = [];
    MainPropertyOptions = [];
    checkboxValue = false;
    isLoading=false;
    isDropdownOpen = false;
    savebutton=true;
    options = [{ label: 'Sync', value: 'option1' }];
    selectedListingFieldApiName;
    @track showConfirmationModal = false;

    doubleSideArrowUrl = doubleSideArrow;
    
    

    connectedCallback(){
        this.isLoading = true;
        getObjectFields({ objectName: 'Listing__c' })
            .then(data => {
                this.handleListingObjectFields(data);
                if(this.MainListingOptions.length != 0){
                    this.callPropertyFields();
                }
            })
            .catch(error => {
                console.error('Error fetching Listing field data', error);
            });
    
   
            this.filterAndUpdateListingOptions();
    }

    callPropertyFields(){
        getObjectFields({ objectName: 'Property__c' })
        .then(data => {
            this.handlePropertyObjectFields(data);
            if(this.MainPropertyOptions.length != 0){
                this.getMetadataFunction();  
                this.isDropdownOpen = true;
            }
        })
        .catch(error => {
            console.error('Error fetching Property field data', error);
        }); 
    }

    handleListingObjectFields(data) {
        // Handle the retrieved fields for Listing__c object
        const excludedFields = ['Id', 'OwnerId', 'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate', 'SystemModstamp', 'Year_Built__c', 'LastViewedDate', 'LastReferencedDate', 'RecordTypeId', 'Listing_RecordType__c', 'IsDeleted','Agent_ID__c'];
        const filteredFields = data.filter(field => !excludedFields.includes(field.apiName));
        if (data) {
            this.MainListingOptions = filteredFields.map((field) => ({
                label: field.label,
                value: field.apiName,
                dataType: field.dataType // Remember the data type
            }));
            this.ListingOptions = this.MainListingOptions;
        }
    }

    handlePropertyObjectFields(data) {
        // Handle the retrieved fields for Property__c object
        const excludedFields = ['Property_ID__c', 'OwnerId', 'Year_Built__c', 'Property_RecordType__c', 'RecordTypeId', 'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate', 'SystemModstamp', 'IsDeleted'];
        const filteredFields = data.filter(field => !excludedFields.includes(field.apiName));
        if (data) {
            this.MainPropertyOptions = filteredFields.map((field) => ({
                label: field.label,
                value: field.apiName,
                dataType: field.dataType // Remember the data type
            }));
        }
        
    }


    //Get metadata from the record and set in picklists pair 
    getMetadataFunction(){
        
        getMetadata().then(result => {
            this.parseAndSetMappings(result[0]);
            this.setCheckboxValue(result[1]);
            
        }).catch(error => {
            console.error('Error fetching metadata:', error);
            
        });
        this.filterAndUpdateListingOptions();
        this.filterAndUpdatePropertyOptions();
    }

    parseAndSetMappings(mappingString) {
        const mappings = mappingString.split(';');
        if(this.ListingOptions != null){
            mappings.forEach(mapping => {
                this.isLoading=true;
                const [selectedListing, selectedProperty] = mapping.split(':');
                if (selectedListing && selectedProperty) {
                    const newPair = {
                        id: this.dropDownPairs.length,
                        selectedListing: selectedListing,
                        selectedProperty: selectedProperty,
                        listingOptions: this.ListingOptions,
                        propertyOptions: this.filterPropertyOptions(selectedListing),
                        isPropertyPicklistDisabled: false
                    };
                    this.dropDownPairs.push(newPair);
                    this.filterAndUpdateListingOptions();
                    this.filterAndUpdatePropertyOptions();
    
                }
                this.isLoading = false;
            });
            this.isLoading = false;
        }
        
    }

    setCheckboxValue(checkboxValue){
        if(checkboxValue == 'true'){
            this.checkboxValue = true;
        }else{
            this.checkboxValue = false;
        }
    }


    //Filter the property base on the selected listing
    filterPropertyOptions(selectedListing) {
        if (!selectedListing) return; // No listing field selected yet
        this.filterAndUpdatePropertyOptions();
        // console.log(selectedListing);
        const selectedListingField = this.ListingOptions.find(
            (option) => option.value === selectedListing
        );
        // console.log('Selected Listing Field:', selectedListingField);
        if (!selectedListingField || !selectedListingField.dataType) {
            return;
        }
        this.PropertyOptions = [...this.PropertyOptions];
        this.PropertyOptions = this.PropertyOptions.filter((option) => {
            return option.dataType === selectedListingField.dataType;
        });
        // this.filterAndUpdatePropertyOptions();
        return this.PropertyOptions;
    }


    //Handle picklists selection
    handleSourceFieldChange(event) {
        const index = event.target.dataset.index;
        // console.log(index);
        this.selectedListingFieldApiName = event.detail.value;
       
       this.dropDownPairs[index].selectedListing = event.detail.value;
       this.dropDownPairs[index].propertyOptions = this.filterPropertyOptions(event.detail.value);
       this.dropDownPairs[index].isPropertyPicklistDisabled = false;
       //this.filterPropertyOptions();
       this.updateListingOptionsAfterIndex(index);
       this.filterAndUpdateListingOptions();
       
    }

    updateListingOptionsAfterIndex(startIndex) {
        for (let i = startIndex; i < this.dropDownPairs.length; i++) {
            const pair = this.dropDownPairs[i];
            pair.listingOptions = this.MainListingOptions.slice(); // Reset listing options for the pair
            for (let j = 0; j < i; j++) {
                const otherPair = this.dropDownPairs[j];
                if (otherPair.selectedListing) {
                    pair.listingOptions = pair.listingOptions.filter(option => option.value !== otherPair.selectedListing);
                }
            }
        }
    }
    

    handleDestinationFieldChange(event) {
        // Implement if needed
        const index = event.target.dataset.index;
        this.dropDownPairs[index].selectedProperty = event.detail.value;
        this.filterAndUpdatePropertyOptions();
        const isPropertyValid = this.dropDownPairs.every(pair => pair.selectedProperty);
        const isListingValid = this.dropDownPairs.every(pair => pair.selectedListing);
        if (isListingValid && isPropertyValid) {
        this.savebutton = false;
        }
        
    }


    //Exculde the selected picklists values from both lisitng and property
    filterAndUpdateListingOptions() {

        this.updateListing = this.MainListingOptions;
        const selectedListingValues = this.dropDownPairs.map(pair => pair.selectedListing);
        this.dropDownPairs.forEach(pair => {
            pair.listingOptions = this.MainListingOptions.filter(option => {
                return !selectedListingValues.includes(option.value) || option.value === pair.selectedListing;
            });
        });
    
        selectedListingValues.forEach(selectedValue => {
            this.excludeSelectedOptionFromListing(selectedValue);
        });
        this.ListingOptions = this.updateListing;
        this.updateListing = [];
    }


    filterAndUpdatePropertyOptions() {
        this.updateProperty = this.MainPropertyOptions;
        const selectedListingValues = this.dropDownPairs.map(pair => pair.selectedProperty);
    
        selectedListingValues.forEach(selectedValue => {
            this.excludeSelectedOptionFromProperty(selectedValue);
        });
        this.PropertyOptions = this.updateProperty;
        this.updateProperty = [];
    }

    excludeSelectedOptionFromListing(selectedValue) {
        this.updateListing = this.updateListing.filter(option => option.value !== selectedValue);

        // console.log('Update Listing'+this.ListingOptions.length);
    }

    excludeSelectedOptionFromProperty(selectedValue) {
        this.updateProperty = this.updateProperty.filter(option => option.value !== selectedValue);

        // console.log('Update Proprty'+this.ListingOptions.length);
    }



    //Add and delete pair of picklists
    addNewPair() {
        // console.log('Before adding new pair - Listing Options:', this.ListingOptions);
        
        this.filterAndUpdateListingOptions();
        this.filterAndUpdatePropertyOptions();
        const newPair = {
            id: this.dropDownPairs.length,
            selectedListing: '',
            selectedProperty: '', 
            listingOptions: this.ListingOptions, 
            propertyOptions: [] ,
            isPropertyPicklistDisabled: true 
        };
        // console.log('After adding new pair - Listing Options:', this.ListingOptions);
        
        this.dropDownPairs.push(newPair);
        this,this.savebutton = true;
        const isPropertyValid = this.dropDownPairs.every(pair => pair.selectedProperty);
        const isListingValid = this.dropDownPairs.every(pair => pair.selectedListing);
        if (isListingValid && isPropertyValid) {
        this.savebutton = false;
        }
        
    }

    deletePair(event) {
        const index = event.target.value;
        const selectedListingFieldApiName = this.dropDownPairs[index].selectedListing;
        
        this.dropDownPairs = this.dropDownPairs.filter((pair, i) => i !== index);
        this.filterAndUpdateListingOptions();
        this.filterAndUpdatePropertyOptions();
        const isPropertyValid = this.dropDownPairs.every(pair => pair.selectedProperty);
        const isListingValid = this.dropDownPairs.every(pair => pair.selectedListing);
        if (isListingValid && isPropertyValid) {
        this.savebutton = false;
        }
    }

    handleCheckboxChange() {
       if(this.checkboxValue==false){
        this.checkboxValue = true;
       }else{
        this.checkboxValue = false;
       }
       this.savebutton = false;
    //    console.log(this.checkboxValue);
    }


    //Handle the mapping to store in metadata type
    createMappingString() {
        let mappingString = '';
        for (let i = 0; i < this.dropDownPairs.length; i++) {
            const pair = this.dropDownPairs[i];
            if (pair.selectedListing && pair.selectedProperty) {
                mappingString += pair.selectedListing + ':' + pair.selectedProperty + ';';
            }
        }
        mappingString = mappingString.slice(0, -1);
        return mappingString;
    }

    saveMappingsToMetadata() {
        const mappingsData = this.createMappingString();
        const checkboxValue = this.checkboxValue;
        // console.log(mappingsData);
        saveMappings({ mappingsData , checkboxValue})
            .then(result => {
                // console.log('Mappings saved successfully:', result);
                this.showToast('Success', 'Mappings saved successfully', 'success');
                const event = new CustomEvent('modalclose', {
                    detail: { message: false }
                });
                this.dispatchEvent(event);
                // Optionally handle success
            })
            .catch(error => {
                console.error('Error saving mappings:', error);
                this.showToast('Error', 'Error saving mappings', 'error');
                // Optionally handle error
            });
    }

  
    //Conformation modal and the alert
    handleAddPairClick() {
        const isValid = this.dropDownPairs.every(pair => pair.selectedProperty);
        if (!isValid) {
        this.showToast('Error', 'Please fill the all pairs or remove!', 'error');
        return;
        }
        // Show the confirmation modal when "Add Pair" is clicked
        this.showConfirmationModal = true;
    }

    handleConfirmAddPair() {
        // Handle adding a new pair here
        this.saveMappingsToMetadata();

        // Close the confirmation modal
        this.showConfirmationModal = false;
    }

    closeConfirmationModal() {
        // Close the confirmation modal if canceled
        this.showConfirmationModal = false;
    }

    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }

}