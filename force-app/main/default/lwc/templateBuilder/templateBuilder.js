import { LightningElement, track, wire } from 'lwc';
import getAllObjectNames from '@salesforce/apex/TemplateBuilderController.getAllObjectNames';
import getTemplatesForObject from '@salesforce/apex/TemplateBuilderController.getTemplatesForObject';

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
        this.fetchRecords();
    }
}