import { LightningElement, track } from "lwc";
import getObjectFields from "@salesforce/apex/MapFieldCmp.getObjectFields";
import saveMappings from "@salesforce/apex/MapFieldCmp.saveMappings";
import getMetadata from "@salesforce/apex/MapFieldCmp.getMetadata";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import doubleSideArrow from "@salesforce/resourceUrl/doubleSideArrow";

export default class MapFields extends LightningElement {
  @track dropDownPairs = [];
  @track ListingOptions = [];
  @track MainListingOptions = [];
  @track updateListing = [];
  @track updateProperty = [];
  @track PropertyOptions = [];
  @track MainPropertyOptions = [];
  @track checkboxValue = false;
  @track isLoading = false;
  @track savebutton = true;
  @track options = [{ label: "Sync", value: "option1" }];
  @track showConfirmationModal = false;

  doubleSideArrowUrl = doubleSideArrow;

  /**
   * Method Name: delButtonClass
   * @description: handle the delete button enable/disable.
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  get delButtonClass() {
    return this.isAutoSyncEnabled
      ? "slds-var-m-left_x-small del-button disabled-del"
      : " slds-var-m-left_x-small del-button";
  }

  /**
   * Method Name: isAutoSyncEnabled
   * @description: handle the autosync checkbox enable/disable..
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  get isAutoSyncEnabled() {
    return this.checkboxValue;
  }

  /**
   * Method Name: connectedCallback
   * @description: fetch the listing object fields.
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  connectedCallback() {
    this.isLoading = true;
    getObjectFields({ objectName: "MVEX__Listing__c" })
      .then((data) => {
        this.handleListingObjectFields(data);
        if (this.MainListingOptions.length !== 0) {
          this.callPropertyFields();
        }
      })
      .catch((error) => {
        console.error("Error fetching Listing field data", error);
      });

    this.filterAndUpdateListingOptions();
  }

  /**
   * Method Name: callPropertyFields
   * @description: fetch the property object fieds.
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  callPropertyFields() {
    getObjectFields({ objectName: "MVEX__Property__c" })
      .then((data) => {
        this.handlePropertyObjectFields(data);
        if (this.MainPropertyOptions.length !== 0) {
          this.getMetadataFunction();
        }
      })
      .catch((error) => {
        console.error("Error fetching Property field data", error);
      });
  }

  /**
   * Method Name: handleListingObjectFields
   * @description: set listing object fields.
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handleListingObjectFields(data) {
    // Handle the retrieved fields for Listing__c object
    const filteredFields = data;
    if (data) {
      this.MainListingOptions = filteredFields.map((field) => ({
        label: field.label,
        value: field.apiName,
        dataType: field.dataType // Remember the data type
      }));
      this.ListingOptions = this.MainListingOptions;
    }
  }

  /**
   * Method Name: handlePropertyObjectFields
   * @description: set property object fields.
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handlePropertyObjectFields(data) {
    // Handle the retrieved fields for Property__c object
    const filteredFields = data;
    if (data) {
      this.MainPropertyOptions = filteredFields.map((field) => ({
        label: field.label,
        value: field.apiName,
        dataType: field.dataType // Remember the data type
      }));
    }
  }

  /**
   * Method Name: getMetadataFunction
   * @description: Get metadata from the record and set in picklists pair
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  getMetadataFunction() {
    getMetadata()
      .then((result) => {
        if (result[0] != null) {
          this.parseAndSetMappings(result[0]);
        }
        if (result[1] == null) {
          this.setCheckboxValue(result[0]);
        } else {
          this.setCheckboxValue(result[1]);
        }
      })
      .catch((error) => {
        console.error("Error fetching metadata:", error);
      });
    this.filterAndUpdateListingOptions();
    this.filterAndUpdatePropertyOptions();
  }

  /**
   * Method Name: parseAndSetMappings
   * @description: set the dropdown pairs using the metadata string
   * @param mappingString string value
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  parseAndSetMappings(mappingString) {
    const mappings = mappingString.split(";");
    if (this.ListingOptions != null) {
      mappings.forEach((mapping) => {
        this.isLoading = true;
        const [selectedListing, selectedProperty] = mapping.split(":");
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

  /**
   * Method Name: setCheckboxValue
   * @description: set the checkbox value
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  setCheckboxValue(checkboxValue) {
    if (checkboxValue === true) {
      this.checkboxValue = true;
    } else {
      this.checkboxValue = false;
    }
  }

  /**
   * Method Name: filterPropertyOptions
   * @description: set property option according listing data-type
   * @param: selectedListing string vlaue
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  filterPropertyOptions(selectedListing) {
    if (!selectedListing) return null; // No listing field selected yet
    this.filterAndUpdatePropertyOptions();
    const selectedListingField = this.ListingOptions.find(
      (option) => option.value === selectedListing
    );
    if (!selectedListingField || !selectedListingField.dataType) {
      return null;
    }
    this.PropertyOptions = [...this.PropertyOptions];
    this.PropertyOptions = this.PropertyOptions.filter((option) => {
      return option.dataType === selectedListingField.dataType;
    });
    // this.filterAndUpdatePropertyOptions();
    return this.PropertyOptions;
  }

  /**
   * Method Name: handleSourceFieldChange
   * @description: Handle picklists selection of listing fileds
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handleSourceFieldChange(event) {
    const index = event.target.dataset.index;
    this.dropDownPairs[index].selectedListing = event.detail.value;
    this.dropDownPairs[index].propertyOptions = this.filterPropertyOptions(
      event.detail.value
    );
    this.dropDownPairs[index].isPropertyPicklistDisabled = false;
    //this.filterPropertyOptions();
    this.updateListingOptionsAfterIndex(index);
    this.filterAndUpdateListingOptions();
  }

  /**
   * Method Name: updateListingOptionsAfterIndex
   * @description: remove the selected item from other dropdown pairs
   * @param startIndex integer value
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  updateListingOptionsAfterIndex(startIndex) {
    for (let i = startIndex; i < this.dropDownPairs.length; i++) {
      const pair = this.dropDownPairs[i];
      pair.listingOptions = this.MainListingOptions.slice(); // Reset listing options for the pair
      for (let j = 0; j < i; j++) {
        const otherPair = this.dropDownPairs[j];
        if (otherPair.selectedListing) {
          pair.listingOptions = pair.listingOptions.filter(
            (option) => option.value !== otherPair.selectedListing
          );
        }
      }
    }
  }

  /**
   * Method Name: handleDestinationFieldChange
   * @description: Handle picklists selection of property fileds
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handleDestinationFieldChange(event) {
    // Implement if needed
    const index = event.target.dataset.index;
    this.dropDownPairs[index].selectedProperty = event.detail.value;
    this.filterAndUpdatePropertyOptions();
    const isPropertyValid = this.dropDownPairs.every(
      (pair) => pair.selectedProperty
    );
    const isListingValid = this.dropDownPairs.every(
      (pair) => pair.selectedListing
    );
    if (isListingValid && isPropertyValid) {
      this.savebutton = false;
    }
  }

  /**
   * Method Name: filterAndUpdateListingOptions
   * @description: Exculde the selected picklists values from lisitng fields
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  filterAndUpdateListingOptions() {
    this.updateListing = this.MainListingOptions;
    const selectedListingValues = this.dropDownPairs.map(
      (pair) => pair.selectedListing
    );
    this.dropDownPairs.forEach((pair) => {
      pair.listingOptions = this.MainListingOptions.filter((option) => {
        return (
          !selectedListingValues.includes(option.value) ||
          option.value === pair.selectedListing
        );
      });
    });

    selectedListingValues.forEach((selectedValue) => {
      this.excludeSelectedOptionFromListing(selectedValue);
    });
    this.ListingOptions = this.updateListing;
    this.updateListing = [];
  }

  /**
   * Method Name: filterAndUpdateListingOptions
   * @description: Exculde the selected picklists values from property fields
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  filterAndUpdatePropertyOptions() {
    this.updateProperty = this.MainPropertyOptions;
    const selectedListingValues = this.dropDownPairs.map(
      (pair) => pair.selectedProperty
    );

    selectedListingValues.forEach((selectedValue) => {
      this.excludeSelectedOptionFromProperty(selectedValue);
    });
    this.PropertyOptions = this.updateProperty;
    this.updateProperty = [];
  }

  /**
   * Method Name: excludeSelectedOptionFromListing
   * @description: update the removed listing fields list
   * @param: selectedValue object value
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  excludeSelectedOptionFromListing(selectedValue) {
    this.updateListing = this.updateListing.filter(
      (option) => option.value !== selectedValue
    );
  }

  /**
   * Method Name: excludeSelectedOptionFromProperty
   * @description: update the removed property fields list
   * @param: selectedValue object value
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  excludeSelectedOptionFromProperty(selectedValue) {
    this.updateProperty = this.updateProperty.filter(
      (option) => option.value !== selectedValue
    );
  }

  /**
   * Method Name: addNewPair
   * @description: Add dropdown pair of picklists
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  addNewPair() {
    this.filterAndUpdateListingOptions();
    this.filterAndUpdatePropertyOptions();
    const newPair = {
      id: this.dropDownPairs.length,
      selectedListing: "",
      selectedProperty: "",
      listingOptions: this.ListingOptions,
      propertyOptions: [],
      isPropertyPicklistDisabled: true
    };

    this.dropDownPairs.push(newPair);
    this.savebutton = true;
    const isPropertyValid = this.dropDownPairs.every(
      (pair) => pair.selectedProperty
    );
    const isListingValid = this.dropDownPairs.every(
      (pair) => pair.selectedListing
    );
    if (isListingValid && isPropertyValid) {
      this.savebutton = false;
    }
  }

  /**
   * Method Name: deletePair
   * @description: delete dropdown pair of picklists
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  deletePair(event) {
    const index = event.target.value;
    this.dropDownPairs = this.dropDownPairs.filter((pair, i) => i !== index);
    this.filterAndUpdateListingOptions();
    this.filterAndUpdatePropertyOptions();
    const isPropertyValid = this.dropDownPairs.every(
      (pair) => pair.selectedProperty
    );
    const isListingValid = this.dropDownPairs.every(
      (pair) => pair.selectedListing
    );
    if (isListingValid && isPropertyValid) {
      this.savebutton = false;
    }
  }

  /**
   * Method Name: handleCheckboxChange
   * @description: handle checkbox
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handleCheckboxChange() {
    if (this.checkboxValue === false) {
      this.checkboxValue = true;
    } else {
      this.checkboxValue = false;
    }
    this.savebutton = false;
  }

  //Handle the mapping to store in metadata type
  /**
   * Method Name: handleCheckboxChange
   * @description: handle checkbox
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  createMappingString() {
    let mappingString = "";
    for (let i = 0; i < this.dropDownPairs.length; i++) {
      const pair = this.dropDownPairs[i];
      if (pair.selectedListing && pair.selectedProperty) {
        mappingString +=
          pair.selectedListing + ":" + pair.selectedProperty + ";";
      }
    }
    mappingString = mappingString.slice(0, -1);
    return mappingString;
  }

  /**
   * Method Name: saveMappingsToMetadata
   * @description: save the updated mapping in the metadata
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  saveMappingsToMetadata() {
    const mappingsData = this.createMappingString();
    const checkboxValue = this.checkboxValue;
    saveMappings({ mappingsData, checkboxValue })
      .then(() => {
        this.showToast("Success", "Mappings saved successfully", "success");
        const event = new CustomEvent("modalclose", {
          detail: { message: false }
        });
        this.dispatchEvent(event);
        // Optionally handle success
      })
      .catch((error) => {
        console.error("Error saving mappings:", error);
        this.showToast("Error", "Error saving mappings", "error");
        // Optionally handle error
      });
  }

  //Conformation modal and the alert
  /**
   * Method Name: handleAddPairClick
   * @description: Conformation modal and the alert
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handleAddPairClick() {
    const isValid = this.dropDownPairs.every((pair) => pair.selectedProperty);
    if (!isValid) {
      this.showToast("Error", "Please fill the all pairs or remove!", "error");
      return;
    }
    // Show the confirmation modal when "Add Pair" is clicked
    this.showConfirmationModal = true;
  }

  /**
   * Method Name: handleConfirmAddPair
   * @description: handle the confirm button in modal
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  handleConfirmAddPair() {
    // Handle adding a new pair here
    this.saveMappingsToMetadata();

    // Close the confirmation modal
    this.showConfirmationModal = false;
  }

  /**
   * Method Name: closeConfirmationModal
   * @description: handle the close button in modal
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  closeConfirmationModal() {
    // Close the confirmation modal if canceled
    this.showConfirmationModal = false;
  }

  /**
   * Method Name: handleConfirmAddPair
   * @description: show the toast messsage
   * @param: title string value
   * @param: message string value
   * @param: variant string value
   * Date: 28/06/2024
   * Created By: Vyom Soni
   **/
  showToast(title, message, variant) {
    const toastEvent = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(toastEvent);
  }
}
