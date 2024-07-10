import { LightningElement, track, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getCheckList from '@salesforce/apex/CheckListItemController.getCheckList';
import createCheckListItem from '@salesforce/apex/CheckListItemController.createCheckListItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CheckListStatus extends LightningElement {
    @track checklistItems = []; // Initialize as an empty array
    @track showEditModal = false;
    @api objectName;
    @api recordId;
    @track isSpinner = true;

    @wire(CurrentPageReference)
    setCurrentPageReference(pageRef) {
        console.log('Page Reference:', JSON.stringify(pageRef, null, 2)); // Debugging line
        this.objectName = pageRef.attributes.objectApiName;
        this.recordId = pageRef.attributes.recordId;
    }

    /**
    * Method Name: connectedCallback
    * @description: Used to call checklistValues method.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        this.checklistValues();
        console.log('objectName', this.objectName);
        console.log('recordId', this.recordId);
    }

    /**
    * Method Name: checklistValues
    * @description: Used to get checklist values.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    checklistValues() {
        this.isSpinner = true;
        getCheckList({ objectName: this.objectName, recordId: this.recordId })
            .then(result => {
                console.log('result', result);
                this.checklistItems = result;
                this.updateChecklistItems();
            })
            .catch(error => {
                this.isSpinner = false;
                console.log('error', error);
            });
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
    * Method Name: totalCount
    * @description: Used to get total count.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    get totalCount() {
        return this.checklistItems.length;
    }

    /**
    * Method Name: completedCount
    * @description: Used to get completed count.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    get completedCount() {
        return this.checklistItems.filter(item => item.completed).length;
    }

    /**
    * Method Name: progressStyle
    * @description: Used to get progress style.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    get progressStyle() {
        const percentage = (this.completedCount / this.totalCount) * 100;
        return `width: ${percentage}%;`;
    }

    /**
    * Method Name: handleCheckboxChange
    * @description: Used to handle checkbox change.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleCheckboxChange(event) {
        const itemId = event.currentTarget.dataset.id;
        const checkboxValue = event.currentTarget.checked;
        const fieldName = event.currentTarget.dataset.fieldname;
        console.log('itemId', itemId);
        this.checklistItems = this.checklistItems.map(item => {
            if (item.id === itemId) {
                item.completed = checkboxValue;
            }
            return item;
        });
        if(fieldName == null || fieldName == '' || fieldName == undefined){
            this.createOrUpdateChecklistItem(itemId, checkboxValue);
        }
        this.updateChecklistItems();
    }

    /**
    * Method Name: handleDropdownClick
    * @description: Used to handle dropdown click.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleDropdownClick(event) {
        const itemId = event.target.dataset.id;
        this.checklistItems = this.checklistItems.map(item => {
            if (item.id === itemId) {
                item.showDropdown = !item.showDropdown;
            }
            return item;
        });
        this.updateChecklistItems();
    }

    /**
    * Method Name: updateChecklistItems
    * @description: Used to update checklist items.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    updateChecklistItems() {
        this.checklistItems = this.checklistItems.map(item => {
            item.statusClass = item.completed ? 'status1 completed' : 'status2 pending';
            item.statusText = item.completed ? 'Completed' : 'Pending';
            item.dropdownIcon = item.showDropdown ? '▲' : '▼';
            return item;
        });
        this.isSpinner = false;
    }

    /**
    * Method Name: handleHideEditPopup
    * @description: Used to handle hide edit popup.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleHideEditPopup(event) {
        this.showEditModal = event.details;
    }

    /**
    * Method Name: handleShowEditModal
    * @description: Used to handle show edit modal.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleShowEditModal() {
        this.showEditModal = true;
    }

    /**
    * Method Name: createOrUpdateChecklistItem
    * @description: Used to create or update checklist item.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    createOrUpdateChecklistItem(itemId, checkboxValue){
        console.log('itemId', itemId);
        createCheckListItem({ recordId: this.recordId, checklistId: itemId, completed: checkboxValue })
            .then(result => {
                console.log('result', result);
                if(result == 'success'){
                    this.toast('Success', 'Checklist Item Updated successfully', 'success');
                } else {
                    this.toast('Error', result, 'error');
                }
            })
            .catch(error => {
                console.log('error', error);
            });
    }

    /**
    * Method Name: handleHideEditPopupAndRefresh
    * @description: Used to handle hide edit popup and refresh.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleHideEditPopupAndRefresh(event){
        this.showEditModal = event.details;
        this.checklistItems = [];
        this.checklistValues();
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
}