import { LightningElement,track,api,wire } from 'lwc';

export default class ChecklistProgress extends LightningElement {


    @track totalpage = 5;
    @track pages = [];

    connectedCallback(){
        for (let i = 1; i <= this.totalpage; i++) {
            this.pages.push({
                label: 'Page' + i,
                value: i
            });
        }
    }
}