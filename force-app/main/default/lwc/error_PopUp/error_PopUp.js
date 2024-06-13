import { LightningElement, api, track } from 'lwc';
import errorImage from '@salesforce/resourceUrl/ErrorIcons'

export default class Error_PopUp extends LightningElement {
    @track isError = false;
    @track isSuccess = false;
    @track isWarning = true;
    @track iconUrl = errorImage + '/ErrorIcons/ErrorIcon.png';
    backGroundUrl = errorImage + '/ErrorIcons/ErrorPopUpBg.png';

    connectedCallback(){
        if(this.isSuccess){
            this.iconUrl = errorImage + '/ErrorIcons/SuccessIcon.png';
            this.isSuccess = true;
        }else if(this.isError){
            this.isError = true;
        }else if(this.isWarning){
            this.isWarning = true;
            this.iconUrl = errorImage + '/ErrorIcons/WarningIcon.png';
        }
    };

    @api
    showToast(type, message, title){
        try {
            if(type != undefined && message != undefined && title != undefined){
                this.message = message;
                this.title = title;
                if(type == 'success'){
                    this.iconUrl = errorImage + '/ErrorIcons/SuccessIcon.png';
                    this.isSuccess = true;
                }else if(type == 'error'){
                    this.isError = true;
                }else if(type == 'warning'){
                    this.isWarning = true;
                    this.iconUrl = errorImage + '/ErrorIcons/WarningIcon.png';
                }
            }
        } catch (error) {
            console.log('EX error_PopUp:- showToast Error');
        }
    }
    

    copyCode() {
        // Copy code to clipboard
        var range = document.createRange();
        range.selectNode(this.template.querySelector(".copy"));
        window.getSelection().removeAllRanges(); // clear current selection
        window.getSelection().addRange(range); // to select text
        document.execCommand("copy");
        window.getSelection().removeAllRanges();// to deselect
    }

    cancel(){
        //Handle Cancel action
        console.log('Cancel button clicked');
        const event1 = CustomEvent('cancel');
        this.dispatchEvent(event1);
    }

    support() {
        // Handle support action
        console.log('Support button clicked');
    }

    knowledge() {
        // Handle knowledge action
        console.log('Knowledge button clicked');
    }
    
    resume() {
        // Handle knowledge action
        console.log('Knowledge button clicked');
        const event1 = CustomEvent('continue');
        this.dispatchEvent(event1);
    }
    
}