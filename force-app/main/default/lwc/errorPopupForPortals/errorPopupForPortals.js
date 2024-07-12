import { LightningElement, api, track } from 'lwc';

export default class ErrorPopupForPortals extends LightningElement {

    @api jsonbody;
    @api portalname;
    @track firstHeader;
    @track secondHeader;
    @track isInitalRender = true;
    @track errors = [];

    /**
    * Method Name: connectedCallback
    * @description: Used to set the header and errors.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        console.log('Json body-->', this.jsonbody);
        console.log('portalname-->', this.portalname);
        this.errors = JSON.parse(this.jsonbody);
        if (this.portalname === 'Zoopla') {
            this.firstHeader = 'Error Message';
            this.secondHeader = 'Path';
        } else if (this.portalname === 'Rightmove') {
            this.firstHeader = 'Error Message';
            this.secondHeader = 'Value';
        }
        
    }
    
    /**
    * Method Name: handleCloseModal
    * @description: Used to close the popup.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    handleCloseModal() {
        let custEvent = new CustomEvent('hidepopup', {
            detail: false
        });
        this.dispatchEvent(custEvent);
    }
}