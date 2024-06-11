import { LightningElement, track, wire } from 'lwc';
import getAllObjectNames from '@salesforce/apex/TemplateBuilderController.getAllObjectNames';
import getTemplatesForObject from '@salesforce/apex/TemplateBuilderController.getTemplatesForObject';
import deleteTemplate from '@salesforce/apex/TemplateBuilderController.deleteTemplate';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class TemplateBuilder extends LightningElement {
    @track selectedObject;
    @track objectOptions = [];
    @track records;
    @track isModalOpen = false;
    @track currentRecordId;
    @track IsSelectedObject = true;

    @wire(getAllObjectNames)
    wiredSObjectNames({ error, data }) {
        if (data) {
            this.objectOptions = data.map(objName => ({ label: objName, value: objName }));
        } else if (error) {
            console.error('Error fetching SObject names:', error);
        }
    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.IsSelectedObject = false;
        this.fetchRecords();
        // refreshApex(this.records);
    }

    fetchRecords() {
        getTemplatesForObject({ objectName: this.selectedObject })
            .then(result => {
                if (result != null && result.length > 0) {
                    this.records = result;
                    console.log(result);
                } else {
                    this.records = [];
                }
            })
            .catch(error => {
                console.error('Error fetching records: ', error);
            });
    }

    handleDelete(event) {
        const templateId = event.target.dataset.id;
        deleteTemplate({ templateId: templateId })
            .then(() => {
                this.showToast('Success', 'Template deleted successfully', 'success');
                this.fetchRecords();
                // refreshApex(this.records);
            })
            .catch(error => {
                console.error('Error deleting template:', error);
                this.showToast('Error', 'Error deleting template', 'error');
            });
    }

    handleCreateScreen() {
        this.currentRecordId = null;
        this.isModalOpen = true;
        console.log('this.currentRecordId>>'+this.currentRecordId);
    }

    handleEdit(event) {
        this.currentRecordId = event.target.dataset.id;
        this.isModalOpen = true;
        console.log('this.currentRecordId 1>>'+this.currentRecordId);
    }

    handleCloseModal() {
        this.isModalOpen = false;
        // refreshApex(this.records);
    }

    handleRefresh(event) {
        if (event.detail.refresh) {
            console.log('In the refresh');
            this.fetchRecords();
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}