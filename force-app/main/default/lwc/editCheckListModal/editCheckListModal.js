import { LightningElement, track, api} from 'lwc';
import getObjectFields from '@salesforce/apex/CheckListItemController.getObjectFields';
import manageChecklistRecords from '@salesforce/apex/CheckListItemController.manageChecklistRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class EditCheckListModal extends LightningElement {

    @track myVariable;
    @track objectoptions = [];
    @track fieldoptions = [];
    @api objectName;
    @api recordId;
    @track selectedObjectName;
    @track checklistItems;
    @track checklistRecords;
    @track isSpinner = true;
    @track setScroll = false;
    // @track isOrderChanged = false;

    operatorOptions = [
        { label: 'Equals', value: 'Equals' },
        { label: 'Not Equals', value: 'Not Equals' },
    ];

    /**
    * Method Name: connectedCallback
    * @description: Used to call getObjectFieldsAndName method.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    connectedCallback(){
        console.log('objectName', this.objectName);
        console.log('recordId', this.recordId);
        this.getObjectFieldsAndName();
	}

    renderedCallback(){
        if(this.setScroll){
            const container = this.template.querySelector('.tableContainer');
            container.scrollTop = container.scrollHeight;
            this.setScroll = false;
        }
}

    /**
    * Method Name: getObjectFieldsAndName
    * @description: Used to get object fields and name.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    getObjectFieldsAndName(){
        try {
            getObjectFields({objectName: this.objectName})
            .then(result => {
                console.log('result', result);
                // Create deep copies of the checklist array
                this.checklistItems = JSON.parse(JSON.stringify(result.checklist));
                this.checklistRecords = JSON.parse(JSON.stringify(result.checklist));
                this.selectedObjectName = result.label;
                this.fieldoptions = result.fields.map(field => {
                    return { label: field.label, value: field.value };
                }).sort((a, b) => a.label.localeCompare(b.label));
                this.isSpinner = false;
            })
            .catch(error => {
                this.isSpinner = false;
                console.log('error', error);
            })
        } catch (error) {
            this.isSpinner = false;
            console.log('error', error);
        }
    }

    /**
    * Method Name: isDataAvailable
    * @description: Used to check if data is available.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    get isDataAvailable() {
        return this.checklistItems && this.checklistItems.length > 0;
    }

    /**
    * Method Name: handleOrderChange
    * @description: Used to handle order change.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleOrderChange(event) {
        try {
            // this.isOrderChanged = true;
            const action = event.currentTarget.dataset.action;
            const index = parseInt(event.currentTarget.dataset.index, 10); // Get the index of the item to move
            console.log('action-->', action, 'index-->', index);
            if (action === 'up') {
                this.moveItemUp(index);
            } else if (action === 'down') {
                this.moveItemDown(index);
            }
        } catch (error) {
            console.log('error', error);
        }
    }

    /**
    * Method Name: moveItemUp
    * @description: Used to move item up.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    moveItemUp(index) {
        if (index > 0) {
            const updatedItems = [...this.checklistItems];
            [updatedItems[index - 1], updatedItems[index]] = [updatedItems[index], updatedItems[index - 1]]; // Swap items
            this.checklistItems = updatedItems;
        }
    }

    /**
    * Method Name: moveItemDown
    * @description: Used to move item down.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    moveItemDown(index) {
        if (index < this.checklistItems.length - 1) {
            const updatedItems = [...this.checklistItems];
            [updatedItems[index], updatedItems[index + 1]] = [updatedItems[index + 1], updatedItems[index]]; // Swap items
            this.checklistItems = updatedItems;
        }
    }

    /**
    * Method Name: handleDelete
    * @description: Used to handle delete.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleDelete(event) {
        try {
            const index = parseInt(event.target.dataset.index, 10); // Ensure index is an integer
            console.log('Deleting item at index:', index);
            const updatedItems = [...this.checklistItems];
            updatedItems.splice(index, 1); // Remove the item at the specified index
            this.checklistItems = updatedItems;
        } catch (error) {
            console.log('error', error);
        }
    }

    /**
    * Method Name: handleDialogueClose
    * @description: Used to handle dialogue close.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleDialogueClose() {
        let custEvent = new CustomEvent('hidepopup', {
            details: false
        });
        this.dispatchEvent(custEvent);
    }

    /**
    * Method Name: addNewRow
    * @description: Used to add new row.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    addNewRow() {
        try {
            const newItem = {
                Id: '',
                Name: '',
                MVEX__Field_Name__c: '',
                MVEX__Operator__c: '',
                MVEX__Value__c: '',
                MVEX__Description__c: ''
            };
            this.checklistItems = [...this.checklistItems, newItem];
            this.setScroll = true;
        } catch (error) {
            console.log('error', error);
        }
    }

    /**
    * Method Name: handleFieldNameChange
    * @description: Used to handle field name change.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleFieldNameChange(event) {
        this.removeError();
        const index = event.target.dataset.index;
        const value = event.target.value;
        this.checklistItems[index].MVEX__Field_Name__c = value;
    }

    /**
    * Method Name: handleOperatorChange
    * @description: Used to handle operator change.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleOperatorChange(event) {
        this.removeError();
        const index = event.target.dataset.index;
        const value = event.target.value;
        this.checklistItems[index].MVEX__Operator__c = value;
    }

    /**
    * Method Name: handleInputChange
    * @description: Used to handle input change.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleInputChange(event) {
        this.removeError();
        const index = event.target.dataset.index;
        const field = event.target.dataset.field;
        const value = event.target.value;
        this.checklistItems[index][field] = value;
    }

    /**
    * Method Name: saveChecklistRecords
    * @description: Used to save checklist records.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    saveChecklistRecords(){
        try {
            this.isSpinner = true;
            console.log('checklistItems', JSON.stringify(this.checklistItems));
            console.log('checklistRecords', JSON.stringify(this.checklistRecords));
            // Check if there are any changes
            if (JSON.stringify(this.checklistItems) === JSON.stringify(this.checklistRecords)) {
                this.toast('Success', 'Checklist updated successfully', 'success');
                this.isSpinner = false;
                this.handleDialogueClose();
                return;
            }

            // Validate each checklist item
            for (let [index, item] of this.checklistItems.entries()) {
                if (!item.Name || !item.Name.trim()) {
                    this.toast('Error', `Checklist Name field is required.`, 'error');
                    var fieldName = 'Name';
                    const inputElement = this.template.querySelector(`lightning-input[data-field="${fieldName}"][data-index="${index}"]`);
                    if (inputElement) {
                        inputElement.classList.add('error_css');
                    }
                    this.isSpinner = false;
                    return;
                } else if (item.Name.length > 80) {
                    this.toast('Error', `Checklist Name field exceeds 80 characters.`, 'error');
                    var fieldName = 'Name';
                    const inputElement = this.template.querySelector(`lightning-input[data-field="${fieldName}"][data-index="${index}"]`);
                    if (inputElement) {
                        inputElement.classList.add('error_css');
                    }
                    this.isSpinner = false;
                    return;
                }

                if (item.MVEX__Field_Name__c || item.MVEX__Operator__c || item.MVEX__Value__c) {
                    if (!item.MVEX__Field_Name__c) {
                        this.toast('Error', `Field Name should not be empty.`, 'error');
                        var fieldName = 'MVEX__Field_Name__c';
                        const inputElement = this.template.querySelector(`lightning-combobox[data-field="${fieldName}"][data-index="${index}"]`);
                        if (inputElement) {
                            inputElement.classList.add('error_css');
                        }
                        this.isSpinner = false;
                        return;
                    }
                    if (!item.MVEX__Operator__c) {
                        this.toast('Error', `Operator should not be empty.`, 'error');
                        var fieldName = 'MVEX__Operator__c';
                        const inputElement = this.template.querySelector(`lightning-combobox[data-field="${fieldName}"][data-index="${index}"]`);
                        if (inputElement) {
                            inputElement.classList.add('error_css');
                        }
                        this.isSpinner = false;
                        return;
                    }
                    if (!item.MVEX__Value__c || !item.MVEX__Value__c.trim()) {
                        this.toast('Error', `Value should not be empty.`, 'error');
                        var fieldName = 'MVEX__Value__c';
                        const inputElement = this.template.querySelector(`lightning-input[data-field="${fieldName}"][data-index="${index}"]`);
                        if (inputElement) {
                            inputElement.classList.add('error_css');
                        }
                        this.isSpinner = false;
                        return;
                    }
                }
            }

            // Categorize items
            const itemsToCreate = [];
            const itemsToUpdate = [];
            const itemsToDelete = this.checklistRecords
                .filter(record => record.Id && !this.checklistItems.some(item => item.Id === record.Id))
                .map(record => record.Id);

            this.checklistItems.forEach((item, index) => {
                // if (this.isOrderChanged) {
                    item.MVEX__Sequence__c = index + 1; // Add sequence number only if order changed
                // }
                if (!item.Id) {
                    const newItem = { ...item, MVEX__Object_Name__c: this.objectName };
                    delete newItem.Id; // Remove Id field
                    itemsToCreate.push(newItem);
                } else {
                    const originalItem = this.checklistRecords.find(record => record.Id === item.Id);
                    console.log('originalItem', originalItem);
                    if (originalItem && (
                        item.Name !== originalItem.Name ||
                        item.MVEX__Field_Name__c !== originalItem.MVEX__Field_Name__c ||
                        item.MVEX__Operator__c !== originalItem.MVEX__Operator__c ||
                        item.MVEX__Value__c !== originalItem.MVEX__Value__c ||
                        item.MVEX__Description__c !== originalItem.MVEX__Description__c ||
                        // (this.isOrderChanged && item.MVEX__Sequence__c !== originalItem.MVEX__Sequence__c)
                        item.MVEX__Sequence__c !== originalItem.MVEX__Sequence__c
                    )) {
                        itemsToUpdate.push(item);
                    }
                }
            });

            console.log('Items to create:', JSON.stringify(itemsToCreate));
            console.log('Items to update:', JSON.stringify(itemsToUpdate));
            console.log('Items to delete:', JSON.stringify(itemsToDelete));

            manageChecklistRecords({
                itemsToCreate: itemsToCreate,
                itemsToUpdate: itemsToUpdate,
                itemsToDelete: itemsToDelete
            })
            .then(result => {
                this.isSpinner = false;
                console.log('result', result);
                if (result === 'success') {
                    this.toast('Success', 'Checklist updated successfully', 'success');
                    this.handleRefresh();
                } else {
                    this.toast('Error', result, 'error');
                }
            })
            .catch(error => {
                this.isSpinner = false;
                this.toast('Error', 'Error while updating checklist', 'error');
                console.log('error', error);
            })
        } catch (error) {
            console.log('error', error);
            this.isSpinner = false;
        }
    }

    /**
    * Method Name: handleRefresh
    * @description: Used to handle refresh.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleRefresh(){
        let custEvent = new CustomEvent('hidepopupandrefresh', {
            details: false
        });
        this.dispatchEvent(custEvent);
    }

    /**
    * Method Name: toast
    * @description: Used to show toast.
    * @param {string} title - The title of the toast.
    * @param {string} message - The message of the toast.
    * @param {string} variant - The variant of the toast.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    toast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title,
            message,
            variant
        })
        this.dispatchEvent(toastEvent)
    }

    /**
    * Method Name: removeError
    * @description: Used to remove error.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    removeError(){
        const inputElements = this.template.querySelectorAll('lightning-input');
        inputElements.forEach(input => {
            input.classList.remove('error_css');
        });

        const comboboxElements = this.template.querySelectorAll('lightning-combobox');
        comboboxElements.forEach(combobox => {
            combobox.classList.remove('error_css');
        });
    }
}