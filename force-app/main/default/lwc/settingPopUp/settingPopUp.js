import { LightningElement,api } from 'lwc';

export default class SettingPopUp extends LightningElement {

    handleDialogueClose(){
        let custEvent = new CustomEvent('hidepopup',{
            details: false
        });
        this.dispatchEvent(custEvent);
       }
}