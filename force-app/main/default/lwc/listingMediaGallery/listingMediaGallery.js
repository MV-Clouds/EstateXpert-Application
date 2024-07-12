import { LightningElement, track, api, wire } from 'lwc';
import fetchListingAndImages from "@salesforce/apex/ImageAndMediaController.fetchListingAndImages";
import { MessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import Refresh_cmp from '@salesforce/messageChannel/refreshMessageChannel__c';
import { refreshApex } from '@salesforce/apex';




export default class DisplayListingImages extends LightningElement {
    @api recordId;
    @track data = [];
    @track taglist = [];
    @track showSpinner = false;
    @track isdata = false;
    @track currentIndex = 0;
    subscription = null;
    @wire(MessageContext)
    messageContext;
    @track isModalOpen = false;

    connectedCallback() {
        this.subscription = subscribe(this.messageContext, Refresh_cmp, (message) => {
            if (message.refresh === true) {
                this.fetchingdata();
                message.refresh = false;
            }
        });
        this.data = this.fetchingdata();
        refreshApex(this.data);
    }

    unsubscribe() {
        unsubscribe(this.subscription);
        this.subscription = null;

    }
    disconnectedCallback() {
        this.unsubscribe();
    }

    fetchingdata() {
        this.showSpinner = true;
        fetchListingAndImages({ recordId: this.recordId })
        .then(result => {
            this.data = result.listingImages;
            this.isdata = result.listingImages && result.listingImages.length > 0;
            this.showSpinner = false;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }

    get currentImageUrl() {
        return this.data && this.data.length > 0 ? this.data[this.currentIndex].MVEX__BaseUrl__c : '';
    }

    get currentImageName() {
        return this.data && this.data.length > 0 ? this.data[this.currentIndex].Name : '';
    }

    get currentVideoUrl() {
        return this.data && this.data.length > 0 ? this.data[this.currentIndex].MVEX__ExternalLink__c : '';
    }

    get currentImageTag() {
        var tags = this.data && this.data.length > 0 ? this.data[this.currentIndex].MVEX__Tags__c : '';
        if (tags !== '' && tags != undefined) {
            tags = tags.split(';').map(tag => tag.trim());
        } else {
            tags = [];
        }
        return tags;
    }

    showPreviousImage() {
        this.showSpinner = true;
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showSpinner = false;
        }
        else {
            this.currentIndex = this.data.length - 1;
            this.showSpinner = false;
        }
    }

    showNextImage() {
        this.showSpinner = true;
        if (this.currentIndex < this.data.length - 1) {
            this.currentIndex++;
            this.showSpinner = false;
        }
        else {
            this.currentIndex = 0;
            this.showSpinner = false;
        }
    }

    reloadComponent() {
        this.showSpinner = true;
        this.fetchingdata();
        this.currentIndex = 0;
        this.showSpinner = false;
    }

    openImagePreview() {
        if (!this.currentImageUrl) {
            console.error('No image URL available.');
            return;
        }
        console.log('imageUrl', this.currentImageUrl);
        console.log('videoUrl', this.currentVideoUrl);
        const url = this.currentVideoUrl || this.currentImageUrl;
        console.log('url: ', url);
        window.open(url, '_blank');
        this.showSpinner = false;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    openImageModel() {
        this.modalImageUrl = this.currentImageUrl;
        this.isModalOpen = true;
    }

}