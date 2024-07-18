import { LightningElement , track} from 'lwc';
import sendemail from '@salesforce/apex/SupportRequestController.sendemail';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SupportRequestCmp extends LightningElement {

    error_toast = true;
    pdfUrl;
    img;
    // Cross = Cross;
    descriptionValue;
    supportname;
    email;
    subject;
    message;
    name_msg = true;
    email_msg = true;
    Message_msg = true;
    subject_msg = true;
    @track filesData = [];
    @track FName = [];
    @track FBase64 = [];
    @track totalsize = parseInt(0);
    @track filename;
    @track filedata;

    Support_name(event) {
        this.supportname = event.target.value;
        this.supportname = this.supportname.trim();
        this.name_msg = true;
      }

      Support_email(event) {
        this.email = event.target.value;
        this.email_msg = true;
      }
      Support_message(event) {
        this.message = event.target.value;
        this.message = this.message.trim();
        this.Message_msg = true;
    
      }
      Support_subject(event) {
        this.subject = event.target.value;
        this.subject = this.subject.trim();
        this.subject_msg = true;
    
      }
      onSubmit() {
        this.spinnerdatatable = true;
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var validation1 = pattern.test(this.email);
        if (this.supportname == undefined || this.supportname == '') {
          this.name_msg = false;
          this.spinnerdatatable = false;
        } else if (validation1 == false) {
          this.email_msg = false;
          this.spinnerdatatable = false;
        } else if (this.subject == undefined || this.subject == '') {
          this.subject_msg = false;
          this.spinnerdatatable = false;
        } else if (this.message == undefined || this.message == '') {
          this.Message_msg = false;
          this.spinnerdatatable = false;
        } else {
          this.email_msg = true;
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
    
    
        }
    
      }
      onClear() {
        this.supportname = '';
        this.email = '';
        this.message = '';
        this.subject = '';
        this.name_msg = true;
        this.email_msg = true;
        this.subject_msg = true;
        this.Message_msg = true;
        this.filesData = [];
      }
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