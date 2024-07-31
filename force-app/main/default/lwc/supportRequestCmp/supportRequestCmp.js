import { LightningElement , track} from 'lwc';
import sendemail from '@salesforce/apex/SupportRequestController.sendemail';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class SupportRequestCmp extends NavigationMixin(LightningElement) {

    @track supportname = '';
    @track email ='';
    @track subject = '';
    @track message = '';
    @track name_msg = true;
    @track email_msg = true;
    @track message_msg = true;
    @track subject_msg = true;
    @track email_validation = false;
    @track filesData = [];
    @track FName = [];     
    @track FBase64 = [];
    @track totalsize = parseInt(0);
    @track filename;
    @track filedata;

    /**
    * Method Name : Support_name
    * @description : set the support name value
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    Support_name(event) {
        this.supportname = event.target.value;
        this.supportname = this.supportname.trim();
        this.name_msg = true;
    }


    /**
    * Method Name : Support_email
    * @description : set the support email value
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    Support_email(event) {
      this.email = event.target.value;
      this.email_msg = true;
      var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.validation1 = pattern.test(this.email);
      if(this.validation1 == false){
        this.email_msg = false;
      }
    }

    /**
    * Method Name : Support_message
    * @description : set the support message value
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    Support_message(event) {
      this.message = event.target.value;
      this.message = this.message.trim();
      this.message_msg = true;
    }

    /**
    * Method Name : Support_subject
    * @description : set the support subject value
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    Support_subject(event) {
      this.subject = event.target.value;
      this.subject = this.subject.trim();
      this.subject_msg = true;
    }
      
    /**
    * Method Name : onSubmit
    * @description : handle the from submit button
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    onSubmit() {
        
        if (this.supportname == undefined || this.supportname == '') {
          this.name_msg = false;
        }
        if (this.validation1 == false) {
          this.email_msg = false;
        } 
        if (this.subject == undefined || this.subject == '') {
          this.subject_msg = false;
        } 
        if (this.message == undefined || this.message == '') {
          this.message_msg = false;
        } 
        if(this.supportname != '' && this.validation1 != false && this.subject != '' && this.message != ''){
          this.email_msg = true;
          this.sendEmailCallMethod();
          this.onClose();
        }
    }

    /**
    * Method Name : onSubmit
    * @description : handle the from submit button
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    onClose(){
    let componentDef = {
        componentDef: "MVEX:estateXpertControlCenter",
    };
    
    let encodedComponentDef = btoa(JSON.stringify(componentDef));
    this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
        attributes: {
            url: '/one/one.app#' + encodedComponentDef
        }
    });
    }

    /**
    * Method Name : sendEmailCallMethod
    * @description : call the apex method for the send email.
    * date:22/07/2024
    * Created By: Vyom Soni
    */
    sendEmailCallMethod(){
      try{
        sendemail({
            name: this.supportname,
            email: this.email,
            subject: this.subject,
            body: this.message,
            fname: this.FName,
            fbase64: this.FBase64
          })
            .then(result => {
              if (result == 'success') {
                this.spinnerdatatable = false;
                this.supportname = '';
                this.email = '';
                this.message = '';
                this.subject = '';
                this.filesData = [];
                const event = new ShowToastEvent({
                  title: 'Success',
                  message: 'Email Sent Successfully.',
                  variant: 'success',
                });
                this.dispatchEvent(event);
                window.location.reload(); 
              } else {
                this.spinnerdatatable = false;
                const event = new ShowToastEvent({
                  title: 'Error',
                  message: 'An error occurred while sending Email.',
                  variant: 'error',
                });
                this.dispatchEvent(event);
              }
           })
      }catch(e){
        console.log('error->'+e);
      }
    }

      /**
      * Method Name : handleUploadFinished
      * @description : handle the file uploader onchange event check file size for the upload
      * date:22/07/2024
      * Created By: Vyom Soni
      */
      handleUploadFinished(event) {
        if (event.target.files.length > 0) {
          for (let i = 0; i < event.target.files.length; i++) {
            var filesize = event.target.files[i].size;
            this.totalsize += parseInt(event.target.files[i].size);
            if (this.totalsize > 4500000) {
              this.totalsize = this.totalsize - filesize;
              const event = new ShowToastEvent({
                title: 'Error',
                message: 'Image was not uploaded, Total file size exceeded the Limit.',
                variant: 'error',
              });
              this.dispatchEvent(event);
            }
            else {
              let file = event.target.files[i];
              let reader = new FileReader();
              reader.onload = () => {
                var base64 = reader.result.split(',')[1];
                this.filename = file.name;
                this.filedata = base64;
                this.filesData.push({
                  'fileName': file.name,
                  'filedata': base64
                });
                this.FName.push(file.name);
                this.FBase64.push(base64);
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }

      /**
      * Method Name : removeReceiptImage
      * @description : handle the remove the images from the image list
      * date:22/07/2024
      * Created By: Vyom Soni
      */
      removeReceiptImage(event) {
        var index = event.currentTarget.dataset.id;
        var binaryString = atob(this.FBase64[index]);
        var byteArray = Uint8Array.from(binaryString, c => c.charCodeAt(0));
        var sizeInBytes = byteArray.length;
    
        binaryString = parseInt(0);
        byteArray = parseInt(0);
        this.totalsize = parseInt(this.totalsize) - parseInt(sizeInBytes);
        this.filesData.splice(index, 1);
        this.FBase64.splice(index, 1);
        this.FName.splice(index, 1);
      }
}