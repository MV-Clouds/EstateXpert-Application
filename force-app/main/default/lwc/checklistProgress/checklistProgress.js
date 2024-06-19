import { LightningElement,track,api,wire } from 'lwc';
import checklist_pending from '@salesforce/resourceUrl/checklist_pending';
import checklist_checked from '@salesforce/resourceUrl/checklist_checked';

export default class ChecklistProgress extends LightningElement {


    @track totalpage = 5;
    @track pages = [];

    checklist_pending = checklist_pending;
    checklist_checked = checklist_checked;

    connectedCallback(){
        for (let i = 1; i <= this.totalpage; i++) {
            this.pages.push({
                label: 'Page' + i,
                value: i
            });
        }
    }
}