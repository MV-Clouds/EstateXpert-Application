import { LightningElement, track, api, wire } from "lwc";
import getS3ConfigSettings from "@salesforce/apex/ImageAndMediaController.getS3ConfigSettings";
import { loadScript } from "lightning/platformResourceLoader";
import AWS_SDK from "@salesforce/resourceUrl/AWSSDK";
import fetchListingAndImages from "@salesforce/apex/ImageAndMediaController.fetchListingAndImages";
import createmediaforlisting from "@salesforce/apex/ImageAndMediaController.createmediaforlisting";
import deletelistingmedia from "@salesforce/apex/ImageAndMediaController.deletelistingmedia";
import { publish, MessageContext } from 'lightning/messageService';
import Refresh_msg from '@salesforce/messageChannel/refreshMessageChannel__c';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import watermarkjs from "@salesforce/resourceUrl/watermarkjs";
import videoThumbnail from '@salesforce/resourceUrl/videothumbnail';
import buffer from 'c/buffer';
import { NavigationMixin } from "lightning/navigation";
// import estatexpertLogo from '@salesforce/resourceUrl/watermarkLogo';
import uploadImageresponsiveCSS from '@salesforce/resourceUrl/UploadImageCss';
import updatePropertyFileRecords from '@salesforce/apex/ImageAndMediaController.updatePropertyFileRecords';
import { loadStyle } from 'lightning/platformResourceLoader';

import designcss from '@salesforce/resourceUrl/imageAndMediaCss';

export default class ImagesAndMedia extends NavigationMixin( LightningElement ) {
    @api recordId;
    @track s3;
    @track isAwsSdkInitialized = false;
    @track selectedFilesToUpload = [];
    @track showSpinner = true;
    @track fileName = [];
    @track uploadProgress = 0;
    @track fileSize = [];
    @track isFileUploading = false;
    @track data = [];
    @track isModalOpen = false;
    @track modalImageUrl;
    @track isNull = true;
    @track isData = false;
    @track isPopup = false;
    @track isEdit = false;
    @track isDeleteAll = false;
    @track isWatermark = true;
    @track recIdToDelete;
    @track imageUrlToUpload;
    @track isdelete = false;
    @track recIdToUpdate = [];
    @track disabledCheckbox = true;
    @track currentImgName;
    @track imgOldName = [];
    @track imageTitleToUpload;
    @track selectedUrlType = 'Image';
    @track Expose = [];
    @track Website = [];
    @track Portal = [];
    @track sortOn = [];
    @track leaveTimeout;
    @track disabledUpload = true;
    @track items = [];
    @track propertyId;
    @track eventImgName;
    @track floorplanChecked = false;
    @track virtualTourChecked = false;
    @track tourChecked = false;
    @track interiorChecked = false;
    @track exteriorChecked = false;
    @track picklistValues = [];
    @track finalPicklistValues = [];
    @track saveEditbtnDisabled = true;
    @track disabledDelete = true;
    @track currentDateTimeWithSeconds = '';
    @track logo;
    @track thumbnail = videoThumbnail;
    @track dataMap = [];
    @track confData;
    @track fileURL = [];
    @track fetchedData = [];
    @track isContentVersionDataIsAvailable = false;

    // @track showMobileView = false;
    @track screenWidth=0;
    @track showExpose=true;
    @track showWebsite=false;
    @track showPortal=false;
    @track showModal = false;


    get options() {
        return [
            { label: 'Image', value: 'Image' },
            { label: 'Video', value: 'Video' }
        ];
    }

    get showMobileView() {
        return this.screenWidth > 500 ? false : true;
    }


    /**
    * Method Name: disableEnableBtn
    * @description: Enable and Disable the save and cancel buttons.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    get disableEnableBtn() {
        let recordMap = new Map();
        let combinedMediaListToSave = this.saveOrder();
        this.data.forEach(record => {
            let existingRecord = { Id: record.Id };
            for (let key in record) {
                existingRecord[key] = record[key];
            }
            recordMap.set(record.Id, existingRecord);
        });

        combinedMediaListToSave.forEach(media => {
            if (!recordMap.has(media.Id)) {
                recordMap.set(media.Id, { Id: media.Id });
            }
            let existingRecord = recordMap.get(media.Id);
            for (let key in media) {
                if (Object.prototype.hasOwnProperty.call(media, key) && key !== 'Id') {
                    existingRecord[key] = media[key];
                }
            }
        });

        let finalListToUpdate = Array.from(recordMap.values());
        const fetchedDataString = JSON.stringify(this.fetchedData);
        const dataString = JSON.stringify(finalListToUpdate);
        return fetchedDataString === dataString;
    }

    @wire(MessageContext)
    messageContext;

    /**
    * Method Name: connectedCallback
    * @description: Used to load css and fetch data.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        try {
            this.updateScreenWidth();
            // Add event listener for window resize
            window.addEventListener('resize', this.handleResize.bind(this));
            loadStyle(this, designcss);
            loadStyle(this, uploadImageresponsiveCSS)
                .then(() => {
                    console.log('CSS loaded successfully');
                })
                .catch(error => {
                    console.error('Error loading CSS:', error);
                });
            this.getS3ConfigDataAsync();
            this.timeInString();
            this.fetchingdata();
        } catch (error) {
            console.log('error in connectedcallback -> ', error);
        }
    }

    /**
    * Method Name : disconnectedCallback
    * @description : remove the resize event.
    * Date: 3/06/2024
    * Created By:Vyom Soni
    */
    disconnectedCallback() {
        // Remove event listener when component is destroyed
        window.removeEventListener('resize', this.handleResize.bind(this));
    }

    /**
    * Method Name: renderedCallback
    * @description: Used to load script and fetch data.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    renderedCallback() {
        try {
            if (this.isAwsSdkInitialized) {
                return;
            }
            Promise.all([loadScript(this, AWS_SDK), loadScript(this, watermarkjs)])
                .then(() => {
                    console.log('Script loaded successfully');
                })
                .catch((error) => {
                    console.error("error -> ", error);
                });
        } catch (error) {
            console.log('error in renderedcallback -> ', error);
        }
    }

     /**
    * Method Name : handleResize
    * @description : call when component is resize.
    * * Date: 27/07/2024
    * Created By:Vyom Soni
    */
    handleResize() {
        // Update screen width when window is resized
        this.updateScreenWidth();
    }

    /**
    * Method Name : updateScreenWidth
    * @description : update the width variable.
    * * Date: 27/07/2024
    * Created By:Vyom Soni
    */
    updateScreenWidth() {
        this.screenWidth = window.innerWidth;
    }

    /**
    * Method Name : handleMenuTabClick
    * @description : handle the menu clicks in the header
    * * Date: 27/07/2024
    * Created By:Vyom Soni
    */
    handleMenuTabClick(evt){
        let target = evt.currentTarget.dataset.tabId;
        this.showExpose = false;
        this.showPortal = false;
        this.showWebsite = false;
        if(target == "1"){
            this.showExpose = true;
        }else if(target == "2"){
            this.showWebsite = true;
        }else if(target == "3"){
            this.showPortal = true;
        }
            this.template.querySelectorAll(".feed-tab").forEach(tabel => {
                    tabel.classList.remove("feed-tab-active");
            });
            this.template.querySelector('[data-tab-id="' + target + '"]').classList.add("feed-tab-active");
    }

    /**
    * Method Name: timeInString
    * @description: Used to get current date and time.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    timeInString() {
        try {
            const currentDateTime = new Date();

            const day = currentDateTime.getDate().toString().padStart(2, '0');
            const month = (currentDateTime.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed, so add 1
            const year = currentDateTime.getFullYear().toString();
            const hours = currentDateTime.getHours().toString().padStart(2, '0');
            const minutes = currentDateTime.getMinutes().toString().padStart(2, '0');
            const seconds = currentDateTime.getSeconds().toString().padStart(2, '0');

            const formattedDateTime = `${day}_${month}_${year}_${hours}:${minutes}:${seconds}`;
            this.currentDateTimeWithSeconds = formattedDateTime;
        } catch (error) {
            console.log('error in timeinstring -> ', error);
        }
    }

    /**
    * Method Name: fetchingdata
    * @description: Used to fetch data from server.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    fetchingdata() {
        try {
            console.log('recordID = >', this.recordId);
            this.data = [];
            this.showSpinner = true;
            fetchListingAndImages({ recordId: this.recordId })
                .then(result => {
                    console.log('result--> ', result);
                    if (result != null) {
                        this.data = result.listingImages;
                        this.propertyId = result.propertyId;
                        this.isContentVersionDataIsAvailable = result.contentVersionData != '' ? true : false;
                        this.logo = result.contentVersionData;

                        this.Expose = this.data.filter(media => media.MVEX__Sort_on_Expose__c !== null && media.MVEX__IsOnExpose__c !== false).sort((a, b) => a.MVEX__Sort_on_Expose__c - b.MVEX__Sort_on_Expose__c);
                        this.Website = this.data.filter(media => media.MVEX__Sort_on_Website__c !== null && media.MVEX__IsOnWebsite__c !== false).sort((a, b) => a.MVEX__Sort_on_Website__c - b.MVEX__Sort_on_Website__c);
                        this.Portal = this.data.filter(media => media.MVEX__Sort_on_Portal_Feed__c !== null && media.MVEX__IsOnPortalFeed__c !== false).sort((a, b) => a.MVEX__Sort_on_Portal_Feed__c - b.MVEX__Sort_on_Portal_Feed__c);
                        this.data.forEach(row => row.MVEX__Size__c = row.MVEX__Size__c ? row.MVEX__Size__c + ' ' + 'kb' : 'External');
                        this.data.forEach(row => row.MVEX__Tags__c = row.MVEX__Tags__c ? row.MVEX__Tags__c.split(";") : '');
                        this.isData = result.listingImages && result.listingImages.length > 0;
                        this.fetchedData = JSON.parse(JSON.stringify(this.data));
                        this.showSpinner = false;

                        const message = { refresh: true };

                        if (this.isData == true) {
                            this.disabledDelete = false;
                        } else if (this.isData == false) {
                            this.disabledDelete = true;
                        }

                        publish(this.messageContext, Refresh_msg, message);

                    } else {
                        console.log('Record not found.');
                        this.showSpinner = false;
                    }
                }).catch(error => {
                    this.showSpinner = false;
                    console.error('Error fetching data:', error.stack);
                });
        } catch (error) {
            this.showSpinner = false;
            console.error('error in fetchingdata -> ', error);
        }
    }

    /**
    * Method Name: getS3ConfigDataAsync
    * @description: Used to get s3 config data.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async getS3ConfigDataAsync() {
        try {
            this.confData = await getS3ConfigSettings();
        } catch (error) {
            console.log('error in getS3ConfigDataAsync -> ', error);
        }
    }

    /**
    * Method Name: saveChanges
    * @description: Used to save changes.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    saveChanges() {
        try {
            let recordMap = new Map();
    
            // Prepare the media list to save
            let combinedMediaListToSave = this.saveOrder();
            console.log('combinedMediaListToSave-->', JSON.stringify(combinedMediaListToSave));
    
            // Iterate over this.data to initialize the map with existing records
            this.data.forEach(record => {
                let existingRecord = { Id: record.Id };
                for (let key in record) {
                    if (key !== 'MVEX__BaseUrl__c' && key !== 'MVEX__Size__c' && key !== 'MVEX__Property__c') {
                        if (key === 'MVEX__Tags__c' && Array.isArray(record[key])) {
                            existingRecord[key] = record[key].join(';');
                        } else {
                            existingRecord[key] = record[key];
                        }
                    }
                }
                recordMap.set(record.Id, existingRecord);
            });
    
            // Iterate over combinedMediaListToSave and merge sort fields into the map
            combinedMediaListToSave.forEach(media => {
                if (!recordMap.has(media.Id)) {
                    recordMap.set(media.Id, { Id: media.Id });
                }
                let existingRecord = recordMap.get(media.Id);
                for (let key in media) {
                    if (Object.prototype.hasOwnProperty.call(media, key) && key !== 'Id') {
                        existingRecord[key] = media[key];
                    }
                }
            });
    
            let finalListToUpdate = Array.from(recordMap.values());
    
            console.log('finalListToUpdate-->', JSON.stringify(finalListToUpdate));
    
            // Make a single Apex callout with the final list
            updatePropertyFileRecords({
                itemsToUpdate: finalListToUpdate
            })
            .then(result => {
                console.log('result', result);
                if (result === 'success') {
                    this.showToast('Success', 'Records updated successfully', 'success');
                    this.fetchingdata();
                } else {
                    this.showToast('Error', result, 'error');
                }
            })
            .catch(error => {
                console.log('error', error);
            });
    
        } catch (error) {
            console.log('error in saveChanges -> ', error);
        }
    }
    
    /**
    * Method Name: saveOrder
    * @description: Used to save order.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    saveOrder() {
        let combinedMediaListToSave = [];
    
        if (this.sortOn.includes('Expose')) {
            combinedMediaListToSave = combinedMediaListToSave.concat(this.prepareMediaListToSave('Expose', this.Expose));
        }
        if (this.sortOn.includes('Website')) {
            combinedMediaListToSave = combinedMediaListToSave.concat(this.prepareMediaListToSave('Website', this.Website));
        }
        if (this.sortOn.includes('Portal')) {
            combinedMediaListToSave = combinedMediaListToSave.concat(this.prepareMediaListToSave('Portal', this.Portal));
        }
    
        // console.log('combinedMediaListToSave-->', JSON.stringify(combinedMediaListToSave));
        return combinedMediaListToSave;
    }
    
    /**
    * Method Name: prepareMediaListToSave
    * @description: Used to prepare media list to save.
    * Date: 09/07/2024
    * Created By: Karan Singh
    **/
    prepareMediaListToSave(type, mediaList) {
        return mediaList.map((media, index) => {
            let mediaObject = {
                Id: media.Id,
            };
    
            switch (type) {
                case 'Expose':
                    mediaObject.MVEX__Sort_on_Expose__c = index;
                    break;
                case 'Website':
                    mediaObject.MVEX__Sort_on_Website__c = index;
                    break;
                case 'Portal':
                    mediaObject.MVEX__Sort_on_Portal_Feed__c = index;
                    break;
                default:
                    break;
            }
    
            return mediaObject;
        });
    }

    /**
    * Method Name: cancelChanges
    * @description: Used to cancel changes.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    cancelChanges() {
        this.imgOldName = [];
        this.recIdToUpdate = [];
        this.picklistValues = [];
        this.finalPicklistValues = [];
        this.data = [];
        this.fetchingdata();
    }

    /**
    * Method Name: modalpopup
    * @description: Used to show modal popup.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    modalpopup() {
        this.disabledUpload = true;
        this.isPopup = true;
        this.updateShowModal();
    }

    /**
    * Method Name: storeUrl
    * @description: Used to store url.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    storeUrl(event) {
        if (event.target.label === 'Title') {
            this.imageTitleToUpload = event.target.value;
        }
        if (event.target.label === 'External Link (URL)') {
            this.imageUrlToUpload = event.target.value;
        }
        if (this.imageUrlToUpload && this.imageTitleToUpload) {
            this.disabledUpload = false;
        } else {
            this.disabledUpload = true;
        }
    }

    /**
    * Method Name: handleLinkType
    * @description: Used to handle link type.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleLinkType(event) {
        this.selectedUrlType = event.target.value;
    }

    /**
    * Method Name: createThumb
    * @description: Used to create thumbnail.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    createThumb(videoUrl) {
        const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = videoUrl.match(regex);
        return match ? match[1] : null;
    }

    /**
    * Method Name: uploadImage
    * @description: Used to upload image.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    uploadImage() {
        console.log('selectedUrlType', this.selectedUrlType);
        this.isPopup = false;
        if (this.imageTitleToUpload && this.imageUrlToUpload) {
            this.isPopup = false;
            if (this.selectedUrlType === 'Image') {
                if (!this.imageUrlToUpload.match(/\.(png|jpg|jpeg|gif|png|svg)(\?.*)?$/)) {
                    this.showToast('Error', 'Invalid Url kindly check url and type', 'error');
                    this.isPopup = true;
                }
                else {
                    if (this.imageUrlToUpload.match(/\.(png|jpg|jpeg|gif|png|svg)(\?.*)?$/)) {
                        let fileContent = [];
                        fileContent.push({
                            externalUrl: this.imageUrlToUpload,
                            name: this.imageTitleToUpload + this.currentDateTimeWithSeconds,
                            isOnExpose: true,
                            isOnPortalFeed: true,
                            isOnWebsite: true
                        })
                        createmediaforlisting({
                            recordId: this.recordId,
                            mediaList: fileContent
                        }).then(result => {
                            if (result) {
                                this.fetchingdata();
                                this.isEdit = false;
                                this.imageTitleToUpload = null;
                                this.isNull = true;
                                this.showToast('Success', 'Image uploaded successfully.', 'success');
                            } else {
                                this.showToast('Error', 'Image url invalid.', 'error');
                            }

                        }).catch(error => {
                            this.showToast('Error', JSON.stringify(error), 'error');
                            console.error('Error:', error);
                        });
                    }
                    this.updateShowModal();
                }
            } else if (this.selectedUrlType === 'Video') {
                if (!this.imageUrlToUpload.match(/\.(png|jpg|jpeg|gif|png|svg)(\?.*)?$/)) {
                    const videoId = this.createThumb(this.imageUrlToUpload);
                    this.isPopup = false;
                    let fileContent = [];
                    fileContent.push({
                        recordId: this.recordId,
                        externalUrl: videoId != null ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : this.thumbnail,
                        name: this.imageTitleToUpload + this.currentDateTimeWithSeconds,
                        isOnExpose: true,
                        isOnPortalFeed: true,
                        isOnWebsite: true,
                        externalVideoUrl: this.imageUrlToUpload
                    })
                    createmediaforlisting({
                        recordId: this.recordId,
                        mediaList: fileContent
                    })
                        .then(result => {
                            if (result) {
                                this.isPopup = false;
                                this.fetchingdata();
                                this.isEdit = false;
                                this.imageTitleToUpload = null;
                                this.isNull = true;
                                this.showToast('Success', 'Video uploaded successfully.', 'success');
                            } else {
                                this.showToast('Error', 'Video url invalid.', 'error');
                            }
                        })
                        .catch(error => {
                            this.showToast('Error', JSON.stringify(error), 'error');
                            console.error('Error:', error);
                        });
                } else {
                    this.showToast('Error', 'Invalid Url kindly check url and type', 'error');
                    this.isPopup = true;
                }
                this.updateShowModal();
            } else {
                this.showToast('Error', 'Image URL and file name are required.', 'error');
            }
        }
    }

    /**
    * Method Name: toDeleteAllMedia
    * @description: Used to delete all media.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    toDeleteAllMedia() {
        this.isDeleteAll = true;
        this.updateShowModal();
    }

    /**
    * Method Name: deleteAllMedia
    * @description: Used to delete all media.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    deleteAllMedia() {
        try {
            this.showSpinner = true;
            this.isDeleteAll = false;
            this.updateShowModal();
            deletelistingmedia({ propertyId: this.recordId }).then(() => {
                this.fetchingdata();
            })
        } catch (error) {
            console.error('Error deleting media:', error);
        } finally {
            this.showSpinner = false;
        }
    }

    /**
    * Method Name: storeImgName
    * @description: Used to store image name.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    storeImgName(event) {
        this.saveEditbtnDisabled = false;
        this.eventImgName = event.target.value;
    }

    /**
    * Method Name: editImageNameToStore
    * @description: Used to edit image name to store.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    editImageNameToStore(event) {
        try {
            this.isEdit = true;
            this.recIdToUpdate.push(event.currentTarget.dataset.key);
            this.currentImgName = event.currentTarget.dataset.name;
            this.eventImgName = this.currentImgName;
            this.imgOldName.push(event.currentTarget.dataset.name);
            this.floorplanChecked = false;
            this.virtualTourChecked = false;
            this.tourChecked = false;
            this.interiorChecked = false;
            this.exteriorChecked = false;
            let list_check = event.currentTarget.dataset.tags.split(",");
            if (list_check.length > 0) {
                for (let tags_name = 0; tags_name < list_check.length; tags_name++) {
                    if (list_check[tags_name] === 'Floorplan') {
                        this.floorplanChecked = true;
                        this.picklistValues.push(list_check[tags_name]);
                    }
                    if (list_check[tags_name] === 'Virtual Tour') {
                        this.virtualTourChecked = true;
                        this.picklistValues.push(list_check[tags_name]);
                    }
                    if (list_check[tags_name] === '360tour') {
                        this.tourChecked = true;
                        this.picklistValues.push(list_check[tags_name]);
                    }
                    if (list_check[tags_name] === 'Interior') {
                        this.interiorChecked = true;
                        this.picklistValues.push(list_check[tags_name]);
                    }
                    if (list_check[tags_name] === 'Exterior') {
                        this.exteriorChecked = true;
                        this.picklistValues.push(list_check[tags_name]);
                    }
                }
                this.picklistValues = this.removeDuplicates(this.picklistValues);
            }
            this.updateShowModal();
        } catch (error) {
            console.log('error in editImageNameToStore -> ', error);
        }

    }

    /**
    * Method Name: confirmEdit
    * @description: Used to confirm edit.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    confirmEdit() {
        try {
            if (this.eventImgName != '' && this.eventImgName != undefined) {
                this.removeDuplicates(this.picklistValues);
                if (this.picklistValues !== this.finalPicklistValues) {
                    this.finalPicklistValues.push(this.picklistValues);
                }
                let rec_id = this.recIdToUpdate[this.recIdToUpdate.length - 1];
                let index_of_record = this.data.findIndex(item => item.Id === rec_id);
                this.data[index_of_record].MVEX__Tags__c = this.picklistValues;
                if (this.eventImgName != undefined) {
                    this.data[index_of_record].Name = this.eventImgName;
                }
                this.eventImgName = undefined;
                this.picklistValues = [];
                this.isEdit = false;
                this.saveEditbtnDisabled = true;
                this.updateShowModal();
            } else {
                this.showToast('Error', 'Name field should not be empty.', 'error');
            }

        } catch (error) {
            console.log('error in confirmEdit -> ', error);
        }
    }

    /**
    * Method Name: removeDuplicates
    * @description: Used to remove duplicates.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    removeDuplicates(arr) {
        return [...new Set(arr)];
    }

    /**
    * Method Name: closePopupEdit
    * @description: Used to close popup edit.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    closePopupEdit() {
        this.picklistValues = [];
        this.isEdit = false;
        this.imgOldName.pop();
        this.recIdToUpdate.pop();
        this.updateShowModal();
    }

    /**
    * Method Name: closepopup
    * @description: Used to close popup.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    closepopup() {
        this.isPopup = false;
        this.isdelete = false;
        this.isEdit = false;
        this.isDeleteAll = false;
        if (this.isData != true) {
            this.disabledDelete = true;
        }
        this.updateShowModal();
    }

    /**
    * Method Name: showImageInModal
    * @description: Used to show image in modal.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    showImageInModal(imageUrl) {
        this.modalImageUrl = imageUrl;
        this.isModalOpen = true;
        this.updateShowModal();
    }

    /**
    * Method Name: handleDelete
    * @description: Used to handle delete.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDelete() {
        try {
            this.isdelete = false;
            deletelistingmedia({ id: this.recIdToDelete }).then(() => {
                this.fetchingdata();
            });
            this.updateShowModal();
        } catch (error) {
            console.error('Error deleting media:', error);
            this.showToast('Error', 'Something went wrong while deleting media.', 'error');
        }
    }

    /**
    * Method Name: removefile
    * @description: Used to remove file.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    removefile() {
        this.selectedFilesToUpload = [];
        this.fileName = [];
        this.fileSize = [];
        this.isNull = true;
    }

    /**
    * Method Name: closeModal
    * @description: Used to close modal.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    closeModal() {
        this.isModalOpen = false;
        this.updateShowModal();
    }

    /**
    * Method Name: formattedData
    * @description: Used to get formatted data.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    get formattedData() {
        return this.data.map(item => ({
            ...item,
            MVEX__Size__c: `${item.MVEX__Size__c}kb`
        }));
    }

    /**
    * Method Name: handleCheckboxChange
    * @description: Used to handle checkbox change.
    * Date: 08/07/2024
    * Created By: Karan Singh
    **/
    handleCheckboxChange(event) {
        const key = event.currentTarget.dataset.key;
        const field = event.currentTarget.dataset.field;
        const value = event.currentTarget.checked;
    
        const updatedData = this.data.map(item => {
            if (item.Id === key) {
                return { ...item, [field]: value };
            }
            return item;
        });
    
        this.data = updatedData;

        console.log('updatedData-->', JSON.stringify(this.data));
    }

    /**
    * Method Name: handlePreview
    * @description: Used to handle preview.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handlePreview(event) {
        console.log('-->', event.currentTarget.dataset.exturl);
        if (event.currentTarget.dataset.exturl) {
            const config = {
                type: 'standard__webPage',
                attributes: {
                    url: event.currentTarget.dataset.exturl
                }
            };
            this[NavigationMixin.Navigate](config);
        } else {
            this.showImageInModal(event.currentTarget.dataset.url);
        }
    }

    /**
    * Method Name: deleteRow
    * @description: Used to delete row.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    deleteRow(event) {
        this.recIdToDelete = event.currentTarget.dataset.key;
        this.isdelete = true;
        this.updateShowModal();
    }

    /**
    * Method Name: downloadRowImage
    * @description: Used to download row image.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    downloadRowImage(event) {
        this.handleDownload(event.currentTarget.dataset.url, event.currentTarget.dataset.name);
    }

    /**
    * Method Name: handleDownload
    * @description: Used to handle download.
    * @param {string} url - The URL of the image to download.
    * @param {string} Name - The name of the image to download.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDownload(url, Name) {

        const downloadContainer = this.template.querySelector('.download-container');
        const a = document.createElement("a");

        a.href = url;
        a.download = Name;
        a.target = '_blank';
        if (downloadContainer) {
            downloadContainer.appendChild(a);
        }
        a.click();
        downloadContainer.removeChild(a);
    }

    /**
    * Method Name: initializeAwsSdk
    * @description: Used to initialize aws sdk.
    * @param {object} confData - The configuration data to initialize the AWS SDK.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    initializeAwsSdk(confData) {
        try {
            let AWS = window.AWS;

            AWS.config.update({
                accessKeyId: confData.MVEX__AWS_Access_Key__c,
                secretAccessKey: confData.MVEX__AWS_Secret_Access_Key__c
            });

            AWS.config.region = confData.MVEX__S3_Region_Name__c;

            this.s3 = new AWS.S3({
                apiVersion: "2006-03-01",
                params: {
                    Bucket: confData.MVEX__S3_Bucket_Name__c
                }
            });

            this.isAwsSdkInitialized = true;
        } catch (error) {
            console.log("error initializeAwsSdk ", error);
        }
    }

    /**
    * Method Name: handleRemove
    * @description: Used to handle remove.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleRemove(event) {
        let index_of_fileName = this.fileName.indexOf(event.target.name);
        this.fileName.splice(index_of_fileName, 1);
        this.selectedFilesToUpload.splice(index_of_fileName, 1);
        this.isNull = false;
        this.fileSize.splice(index_of_fileName, 1);

        if (this.fileName.length === 0) {
            this.isNull = true;
        }

        this.template.querySelector('.slds-file-selector__input').value = null;
    }

    /**
    * Method Name: handleSelectedFiles
    * @description: Used to handle selected files.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async handleSelectedFiles(event) {
        try {
            if (event.target.files.length > 0) {
                this.largeImagefiles = [];
                for (let file = 0; file < event.target.files.length; file++) {
                    if (Math.floor((event.target.files[file].size) / 1024) <= 3000) {
                        this.selectedFilesToUpload.push(event.target.files[file]);
                        this.isNull = false;
                        this.disabledCheckbox = false;
                        this.fileName.push(event.target.files[file].name);
                        this.fileSize.push(Math.floor((event.target.files[file].size) / 1024));
                        console.log('filesizeLog==>', this.fileSize[file]);
                    } else {
                        this.largeImagefiles.push(event.target.files[file].name);
                    }
                }
                if (this.largeImagefiles.length > 0) {
                    this.showToast('Error', this.largeImagefiles + ' has size more than 3 mb', 'error');
                }
            }
            this.template.querySelector('.slds-file-selector__input').value = null;

        } catch (error) {
            console.log('error file upload ', error);
        }
    }

    /**
    * Method Name: handleclick
    * @description: Used to handle click.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async handleclick() {
        try {
            if (this.isContentVersionDataIsAvailable === false && this.isWatermark === true) {
                this.showToast('Error', 'Please uncheck the "Upload Image With Watermark" checkbox or upload a watermark image from the Control Center.', 'error');
                return;
            }

            var startTime = new Date().getTime();
            if (this.propertyId) {
                this.isNull = true;
                await this.uploadToAWS(this.selectedFilesToUpload);
                console.log('AwsUploadMethod Time', new Date().getTime() - startTime);
                let contents = [];
                for (let file = 0; file < this.selectedFilesToUpload.length; file++) {
                    contents.push({
                        recordId: this.recordId,
                        externalUrl: this.fileURL[file],
                        name: this.renameFileName(this.fileName[file]),
                        size: this.fileSize[file],
                        isOnExpose: true,
                        isOnPortalFeed: true,
                        isOnWebsite: true
                    });
                }
                await createmediaforlisting({ recordId: this.recordId, mediaList: contents })
                    .then(result => {
                        if (result) {
                            this.fetchingdata();
                            this.selectedFilesToUpload = [];
                            this.fileName = [];
                            this.fileSize = [];
                            this.fileURL = [];
                            this.isNull = true;
                            this.isData = true;
                            this.disabledCheckbox = true;
                        } else {
                            this.showToast('Error', 'Property not added.', 'error');
                        }
                    }).catch(error => {
                        this.showToast('Error', JSON.stringify(error), 'error');
                        console.error('Error:', error);
                    });
            } else {
                this.showToast('Error', 'Property not added.', 'error');
            }
        } catch (error) {
            this.showToast('Error', JSON.stringify(error), 'error');
            console.log('error in handleclick -> ', error);
        }
    }

    /**
    * Method Name: uploadToAWS
    * @description: Used to upload to aws.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async uploadToAWS() {
        try {
            this.initializeAwsSdk(this.confData);
            const uploadPromises = this.selectedFilesToUpload.map(async (file, index) => {
                this.showSpinner = true;
                const startTime = new Date().getTime();
                let objKey = this.renameFileName(this.fileName[index]);
                let params = {
                    Key: objKey,
                    ContentType: this.isWatermark ? 'image/jpeg' : file.type,
                    Body: this.isWatermark ? await this.compressAndWatermarkImage(file) : file,
                    ACL: "public-read"
                };

                console.log('params: ' + params);
                console.log('objKey: ' + objKey);
                let upload = this.s3.upload(params);
                this.showSpinner = false;
                this.isFileUploading = true;
                upload.on('httpUploadProgress', (progress) => {
                    this.uploadProgress = Math.round((progress.loaded / progress.total) * 100);
                });

                console.log('Upload time:', new Date().getTime() - startTime);
                return await upload.promise();

            });

            // Wait for all uploads to complete
            const results = await Promise.all(uploadPromises);
            this.isFileUploading = false;
            this.uploadProgress = 0;
            results.forEach((result) => {
                if (result) {
                    let bucketName = this.confData.MVEX__S3_Bucket_Name__c;
                    let objKey = result.Key;
                    this.fileURL.push(`https://${bucketName}.s3.amazonaws.com/${objKey}`);
                }
            });
            console.log('promiseResult:', results);
            this.listS3Objects();
        } catch (error) {
            console.error("Error in uploadToAWS: ", error);
        }
    }

    /**
    * Method Name: compressAndWatermarkImage
    * @description: Used to compress and watermark image.
    * @param {object} file - The file to compress and watermark.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async compressAndWatermarkImage(file) {
        let outImage = await this.imageWithWatermark(file);
        const base64String = outImage.replace(/^data:image\/\w+;base64,/, '');
        const Buffer = buffer.Buffer;
        const buff = new Buffer(base64String, 'base64');
        console.log('Size of buffer before compression:', (buff.length / 1024).toFixed(2), 'KB');
        const compressedImageBuffer = await this.compressJPEG(buff, 80); // Adjust quality as needed
        console.log('Size of buffer after compression:', (compressedImageBuffer.length / 1024).toFixed(2), 'KB');
        return compressedImageBuffer;
    }

    /**
    * Method Name: compressJPEG
    * @description: Used to compress jpeg.
    * @param {object} imageBuffer - The image buffer to compress.
    * @param {number} quality - The quality of the compression.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async compressJPEG(imageBuffer, quality) {
        return new Promise((resolve, reject) => {
            const dataURL = 'data:image/jpeg;base64,' + imageBuffer.toString('base64');

            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const compressedDataURL = canvas.toDataURL('image/jpeg', quality / 100);
                const Buffer = buffer.Buffer;
                const compressedImageBuffer = new Buffer(compressedDataURL.split(',')[1], 'base64');
                resolve(compressedImageBuffer);
            };
            img.src = dataURL;
            img.onerror = (error) => {
                reject(error);
            };
        });
    }

    /**
    * Method Name: listS3Objects
    * @description: Used to list s3 objects.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    listS3Objects() {
        try {
            this.s3.listObjects((err, data) => {
                if (err) {
                    console.log('error in listS3Objects -->', err);
                } else {
                    console.log('data-->', data);
                }
            });
        } catch (error) {
            console.log('error in listS3Objects -> ', error);
        }
    }

    /**
    * Method Name: allowDrop
    * @description: Used to allow drop.
    * @param {object} event - The event to allow drop.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    allowDrop(event) {
        event.preventDefault();
    }

    /**
    * Method Name: handleDrop
    * @description: Used to handle drop.
    * @param {object} event - The event to handle drop.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDrop(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files[0].type == 'image/png' || files[0].type == 'image/jpg' || files[0].type == 'image/jpeg') {
            this.fileSize = Math.floor((files[0].size) / 1024);
            this.selectedFilesToUpload = files[0];
            this.isNull = false;
            this.fileName = files[0].name;
        }
        else {
            this.showToast('Error', 'File type Incorrect', 'error');
        }
    }

    /**
    * Method Name: handleDragOver
    * @description: Used to handle drag over.
    * @param {object} event - The event to handle drag over.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDragOver(event) {
        event.preventDefault();
    }

    /**
    * Method Name: handleDragStart
    * @description: Used to handle drag start.
    * @param {object} event - The event to handle drag start.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDragStart(event) {
        const index = event.target.dataset.index;
        event.dataTransfer.setData('index', index);
    }

    /**
    * Method Name: findParentWithDataIndex
    * @description: Used to find parent with data index.
    * @param {object} element - The element to find parent with data index.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    findParentWithDataIndex(element) {
        let parent = element.parentElement;
        while (parent) {
            const index = parent.getAttribute('data-index');
            if (index !== null) {
                return index;
            }
            parent = parent.parentElement;
        }
        return null;
    }

    /**
    * Method Name: handleDragEnter
    * @description: Used to handle drag enter.
    * @param {object} event - The event to handle drag enter.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDragEnter(event) {
        event.preventDefault();
        event.target.closest(".dropableimage").classList.add("highlight");
    }

    /**
    * Method Name: handleDragLeave
    * @description: Used to handle drag leave.
    * @param {object} event - The event to handle drag leave.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handleDragLeave(event) {
        event.preventDefault();
        const dropableImage = event.currentTarget.closest(".dropableimage");
        if (!dropableImage.contains(event.relatedTarget)) {
            dropableImage.classList.remove("highlight");
        }
    }

    /**
    * Method Name: handledDrop
    * @description: Used to handle drop.
    * @param {object} event - The event to handle drop.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    handledDrop(event) {
        try {
            event.preventDefault();
            event.target.closest(".dropableimage").classList.remove("highlight");
            var tempdata = [];
            const draggedIndex = event.dataTransfer.getData('index');
            const droppedIndex = this.findParentWithDataIndex(event.target);
            const dataType = event.currentTarget.dataset.type;
            if (!this.sortOn.includes(dataType)) {
                this.sortOn.push(dataType);
            }
            switch (dataType) {
                case 'Expose':
                    tempdata = this.Expose;
                    break;
                case 'Website':
                    tempdata = this.Website;
                    break;
                case 'Portal':
                    tempdata = this.Portal;
                    break;
                default:
                    break;
            }

            if (draggedIndex === droppedIndex) {
                return;
            }

            const draggedMediaId = tempdata[draggedIndex].Id;
            const droppedMediaId = tempdata[droppedIndex].Id;

            // Rearrange the media IDs based on the new order
            var reorderedMediaIds = this.reorderMediaIds(draggedMediaId, droppedMediaId, draggedIndex, droppedIndex, tempdata);

            tempdata = reorderedMediaIds.map(mediaId => {
                return tempdata.find(item => item.Id === mediaId);
            });

            switch (dataType) {
                case 'Expose':
                    this.Expose = reorderedMediaIds.map(mediaId => {
                        return this.Expose.find(item => item.Id === mediaId);
                    });
                    break;
                case 'Website':
                    this.Website = reorderedMediaIds.map(mediaId => {
                        return this.Website.find(item => item.Id === mediaId);
                    });
                    break;
                case 'Portal':
                    this.Portal = reorderedMediaIds.map(mediaId => {
                        return this.Portal.find(item => item.Id === mediaId);
                    });
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log('error in handledDrop -> ', error);
        }
    }

    /**
    * Method Name: reorderMediaIds
    * @description: Used to reorder media ids.
    * @param {string} draggedMediaId - The media id to drag.
    * @param {string} droppedMediaId - The media id to drop.
    * @param {string} draggedIndex - The index of the media id to drag.
    * @param {string} droppedIndex - The index of the media id to drop.
    * @param {object} tempdata - The data to reorder.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    reorderMediaIds(draggedMediaId, droppedMediaId, draggedIndex, droppedIndex, tempdata) {
        var reorderedMediaIds = [...tempdata.map(media => media.Id)];

        if (draggedIndex < droppedIndex) {
            for (let i = parseInt(draggedIndex); i < parseInt(droppedIndex); i++) {
                reorderedMediaIds[i] = tempdata[i + 1].Id;
            }
        } else {
            for (let i = parseInt(draggedIndex); i > parseInt(droppedIndex); i--) {
                reorderedMediaIds[i] = tempdata[i - 1].Id;
            }
        }

        reorderedMediaIds[parseInt(droppedIndex)] = draggedMediaId;

        return reorderedMediaIds;
    }

    /**
    * Method Name: getwebsite
    * @description: Used to get website.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    getwebsite() {
        this.Website = this.data;
        this.data.forEach(item => {
            item.MVEX__IsOnWebsite__c = true;
        });
    }

    /**
    * Method Name: clearwebsite
    * @description: Used to clear website.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    clearwebsite() {
        this.Website = null;
        this.data.forEach(item => {
            item.MVEX__IsOnWebsite__c = false;
        });
    }

    /**
    * Method Name: getexpose
    * @description: Used to get expose.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    getexpose() {
        this.Expose = this.data;
        this.data.forEach(item => {
            item.MVEX__IsOnExpose__c = true;
        });
        this.getportal();
        this.getwebsite();
    }

    /**
    * Method Name: clearexpose
    * @description: Used to clear expose.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    clearexpose() {
        this.Expose = null;
        this.data.forEach(item => {
            item.MVEX__IsOnExpose__c = false;
        });
        this.clearportal();
        this.clearwebsite();
    }

    /**
    * Method Name: getportal
    * @description: Used to get portal.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    getportal() {
        this.Portal = this.data;
        this.data.forEach(item => {
            item.MVEX__IsOnPortalFeed__c = true;
        });
    }

    /**
    * Method Name: clearportal
    * @description: Used to clear portal.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    clearportal() {
        this.Portal = null;
        this.data.forEach(item => {
            item.MVEX__IsOnPortalFeed__c = false;
        });
    }

    /**
    * Method Name: watermarkValue
    * @description: Used to get watermark value.
    * @param {object} event - The event to get watermark value.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    watermarkValue(event) {
        this.isWatermark = event.target.checked;
    }

    /**
    * Method Name: tagsChecked
    * @description: Used to get tags checked.
    * @param {object} event - The event to get tags checked.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    tagsChecked(event) {
        try {
            this.saveEditbtnDisabled = false;
            if (event.target.name === 'Floorplan') {
                this.floorplanChecked = event.target.checked;

                if (this.floorplanChecked) {
                    this.picklistValues.push(event.target.name);

                } else {
                    let index_of_item = this.picklistValues.indexOf(event.target.name);
                    this.picklistValues.splice(index_of_item, 1);
                }
            }
            if (event.target.name === 'Virtual Tour') {
                this.virtualTourChecked = event.target.checked;
                if (this.virtualTourChecked) {
                    this.picklistValues.push(event.target.name);

                } else {
                    let index_of_item = this.picklistValues.indexOf(event.target.name);
                    this.picklistValues.splice(index_of_item, 1);
                }
            }
            if (event.target.name === '360tour') {
                this.tourChecked = event.target.checked;
                if (this.tourChecked) {
                    this.picklistValues.push(event.target.name);

                } else {
                    let index_of_item = this.picklistValues.indexOf(event.target.name);
                    this.picklistValues.splice(index_of_item, 1);
                }
            }
            if (event.target.name === 'Interior') {
                this.interiorChecked = event.target.checked;
                if (this.interiorChecked) {
                    this.picklistValues.push(event.target.name);

                } else {
                    let index_of_item = this.picklistValues.indexOf(event.target.name);
                    this.picklistValues.splice(index_of_item, 1);
                }
            }
            if (event.target.name === 'Exterior') {
                this.exteriorChecked = event.target.checked;
                if (this.exteriorChecked) {
                    this.picklistValues.push(event.target.name);

                } else {
                    let index_of_item = this.picklistValues.indexOf(event.target.name);
                    this.picklistValues.splice(index_of_item, 1);
                }
            }
        } catch (error) {
            console.log('error in tagsChecked -> ', error);
        }

    }

    /**
    * Method Name: imageWithWatermark
    * @description: Used to get image with watermark.
    * @param {object} image - The image to get image with watermark.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    async imageWithWatermark(image) {
        try {
            let file = image;
            let logoImg = 'data:image/png;base64,'+this.logo;

            const fileUrl = URL.createObjectURL(file);

            console.log('file:=>', fileUrl);
            // Load the file image
            const fileImage = await new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = fileUrl;
            });

            // Load the watermark image
            const watermarkImage = await new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = logoImg;
            });

            const watermarkScale = 0.5; // 50% of the file image's size

            // Calculate the dimensions of the watermark
            const newWidth = fileImage.width * watermarkScale;
            const newHeight = fileImage.height * watermarkScale;
            console.log('newwidth', newWidth);
            console.log('newHeight', newHeight);
            // Resize the watermark image
            const resizedWatermarkImage = this.resizeImage(watermarkImage, newWidth, newHeight);

            // Add the resized watermark image to the main image
            const watermarkedImage = await watermark([file, resizedWatermarkImage])
                .image(watermark.image.center(0.5));

            URL.revokeObjectURL(fileUrl);
            return watermarkedImage.src;
        } catch (error) {
            this.showToast('Error', 'Something went wrong while adding watermark.', 'error');
            throw error;
        }
    }

    /**
    * Method Name: resizeImage
    * @description: Used to resize image.
    * @param {object} image - The image to resize.
    * @param {number} newWidth - The new width of the image.
    * @param {number} newHeight - The new height of the image.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    resizeImage(image, newWidth, newHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, newWidth, newHeight);
        return canvas.toDataURL(); // Returns the resized image as a data URL
    }

    /**
    * Method Name: resetCheckboxes
    * @description: Used to reset checkboxes.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    resetCheckboxes() {
        // Select all checkboxes and set their checked property to false
        const exposeCheckbox = this.template.querySelectorAll('.checkbox-expose');
        if (exposeCheckbox) {
            exposeCheckbox.forEach(checkbox => {
                checkbox.checked = false;
            });
        }

        const websiteCheckboxes = this.template.querySelectorAll('.checkbox-website');
        if (websiteCheckboxes) {
            websiteCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }

        const portalCheckboxes = this.template.querySelectorAll('.checkbox-portal');
        if (portalCheckboxes) {
            portalCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }

    }

    /**
    * Method Name: renameFileName
    * @description: Used to rename file name.
    * @param {string} filename - The filename to rename.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    renameFileName(filename) {
        let originalFileName = filename;
        let extensionIndex = originalFileName.lastIndexOf('.');
        let baseFileName = originalFileName.substring(0, extensionIndex);
        let extension = originalFileName.substring(extensionIndex + 1);

        const time = this.currentDateTimeWithSeconds;
        let watermarkPart = this.isWatermark ? '_watermark' : '';
        let objKey = `${baseFileName}_${time}${watermarkPart}.${extension}`
            .replace(/\s+/g, "_")
            .toLowerCase();
        return objKey;
    }

    /**
    * Method Name: showToast
    * @description: Used to show toast message.
    * @param: title - title of toast message.
    * @param: mesaage - message to show in toast message.
    * @param: variant- type of toast message.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }


}