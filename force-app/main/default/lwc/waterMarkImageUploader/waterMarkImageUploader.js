import { LightningElement, track } from 'lwc';
import saveFile from '@salesforce/apex/ImageAndMediaController.saveFile';
import deleteFiles from '@salesforce/apex/ImageAndMediaController.deleteFiles';
import getContentVersionData from '@salesforce/apex/ImageAndMediaController.getContentVersionData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class WaterMarkImageUploader extends LightningElement {
    @track isImageData = false;
    @track data = [];
    @track fileName = '';
    @track isSpinner = true;
    @track filesUploaded = [];
    @track file;
    @track fileContents;
    @track fileReader;
    @track content;
    @track fromData = true;
    @track fromUploader = false;
    @track imageSrc;
    @track imageName;
    @track imageSize;

    /**
    * Method Name: connectedCallback
    * @description: Used to fetch data.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        this.getData();
    }

    /**
    * Method Name: getData
    * @description: Used to fetch data from apex.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    getData() {
        this.isSpinner = true;
        getContentVersionData()
        .then(data => {
            console.log(data);
            if (data != null) {
                this.data.push(data[0]);
                this.fromData = true;
                this.fromUploader = false;
                this.isImageData = true;
            } else {
                this.isImageData = false;
            }
            this.isSpinner = false;
        }).catch(error => {
            this.toast('Error', error.message, 'error');
            this.isSpinner = false;
        });
    }

    /**
    * Method Name: handleDrop
    * @description: Used to handle drop files.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    handleDrop(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        console.log('files-->',files);

        if (this.filesUploaded.length == 1 || this.data.length > 0) {
            this.toast('Error', 'You already have an image uploaded. To upload a new image, please delete the existing one first.', 'error');
            return;
        }

        if (event.dataTransfer.files.length > 0 && files[0].type == 'image/png') {
            if (files[0].size > 4500000) {
                this.toast('Error', 'File Size is to long', 'error');
                return;
            }

            this.filesUploaded.push(files[0]);
            this.fileName = files[0].name;
            this.showImagePreview(files[0]);
            this.isImageData = true;
            this.fromData = false;
            this.fromUploader = true;
        }
        else {
            this.toast('Error', 'File type Incorrect', 'error');
        }
    }

    /**
    * Method Name: allowDrop
    * @description: Used to handle drop files.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    allowDrop(event) {
        event.preventDefault();
    }

    /**
    * Method Name: handleSelectedFiles
    * @description: Used to collect data from the selected files.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    handleSelectedFiles(event) {
        try {
            if (this.filesUploaded.length == 1 || this.data.length > 0) {
                this.toast('Error', 'You already have an image uploaded. To upload a new image, please delete the existing one first.', 'error');
                return;
            }

            if (event.target.files.length > 0) {
                if (event.target.files[0].size > 4500000) {
                    this.toast('Error', 'File Size is to long', 'error');
                    return;
                }

                this.filesUploaded.push(event.target.files[0]);
                this.fileName = event.target.files[0].name;
                this.showImagePreview(event.target.files[0]);
                this.isImageData = true;
                this.fromData = false;
                this.fromUploader = true;
            }
        } catch (error) {
            console.log('error file upload ', error);
        }
    }

    /**
    * Method Name: handleDialogueClose
    * @description: Used to Close watermark modal.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    handleDialogueClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    /**
    * Method Name: toast
    * @description: Generic toast message.
    * @param {string} title - Title of toast message.
    * @param {string} message - Description of toast message.
    * @param {string} variant - Variant of toast message.
    * Date: 08/08/2024
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

    /**
    * Method Name: handleSave
    * @description: Used to create contentversion record.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    handleSave() {
        this.isSpinner = true;
        console.log('fileuploaded-->',this.filesUploaded);
        console.log('length-->',this.filesUploaded.length);
        try {
            if (this.filesUploaded.length > 0) {
                this.uploadHelper();
            }
            else {
                this.toast('Error', 'Please select file to upload!!', 'error');
                this.isSpinner = false;
            }
        } catch (error) {
            console.log('error in handleSave',error.stack);
            this.isSpinner = false;
        }
    }

    /**
    * Method Name: uploadHelper
    * @description: Used to create contentversion record.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    uploadHelper() {
        try {
            this.file = this.filesUploaded[0];
            this.fileReader = new FileReader();
            // set onload function of FileReader object  
            this.fileReader.onloadend = (() => {
                this.fileContents = this.fileReader.result;
                let base64 = 'base64,';
                this.content = this.fileContents.indexOf(base64) + base64.length;
                this.fileContents = this.fileContents.substring(this.content);
                this.saveToFile();
            });
            this.fileReader.readAsDataURL(this.file);
        } catch (error) {
            console.log('error in uploadHelper',error);
            this.isSpinner = false;
        }
    }

    /**
    * Method Name: saveToFile
    * @description: Used to create contentversion record.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    saveToFile() {
        saveFile({ strFileName: this.file.name, base64Data: encodeURIComponent(this.fileContents) })
        .then(result => {
            console.log('result ' + result);
            this.fileName = this.fileName;
            this.filesUploaded = [];
            this.toast('Success', this.file.name + ' - Uploaded Successfully!!!', 'success');
            this.getData();
        })
        .catch(error => {
            this.toast('Error while uploading File', error.message, 'error');
            this.isSpinner = false;
        });
    }

    /**
    * Method Name: removeReceiptImage
    * @description: Used to delete contentversion record.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    removeReceiptImage(event) {
        let dataname = event.currentTarget.dataset.name;
        console.log('dataname-->',dataname);
        if (dataname == 'uploaderdata') {
            this.toast('Success', 'Image has been removed successfully.', 'success');
            this.isImageData = false;
            this.isSpinner = false;
            this.data = [];
            this.filesUploaded = [];
        } else {
            this.isSpinner = true;
            let cvId = event.currentTarget.dataset.id;
            console.log('content version Id--> ',cvId);
            deleteFiles({ contentVersionRecId: cvId })
            .then(() => {
                this.toast('Success', 'Image has been deleted successfully.', 'success');
                this.isImageData = false;
                this.isSpinner = false;
                this.data = [];
                this.filesUploaded = [];
            })
            .catch(error => {
                this.toast('Error while deleting File', error.message, 'error');
                this.isSpinner = false;
            });
        }
    }

    /**
    * Method Name: removeReceiptImage
    * @description: Used to show image preview.
    * Date: 08/08/2024
    * Created By: Karan Singh
    **/
    showImagePreview(file) {
        console.log('showImagePreview<><><>>>>>');
        this.imageSrc = URL.createObjectURL(file);
        this.imageName = file.name;
        this.imageSize = file.size + ' kb';
    }

}