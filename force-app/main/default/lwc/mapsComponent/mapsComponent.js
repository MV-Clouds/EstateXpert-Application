import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle } from 'lightning/platformResourceLoader';
import { refreshApex } from '@salesforce/apex';
import mapCss_V1 from '@salesforce/resourceUrl/mapCss_V1';
import getListingRecords from '@salesforce/apex/Mapcontroller.getListingRecords';
import getRooms from '@salesforce/apex/Mapcontroller.getRooms'; // Import the new method

const PAGE_SIZE = 5;

export default class mapsComponent extends NavigationMixin(LightningElement) {
    @track data = [];
    @track mapMarkers = [];
    @track mapMarkers1 = [];
    @track mapMarkers2 = []; 
    @track pageNumber = 1;
    @track totalRecords = 0;
    @track bDisableFirst = true;
    @track bDisableLast = false;
    searchKey = '';
    @track showDiv = false;
    buttonLabel = 'Filter';

    connectedCallback() {
        loadStyle(this, mapCss_V1)
            .then(() => {
                console.log('CSS loaded');
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
            });
    }

    @wire(getRooms, { no_of_rooms: '$searchKey' }) // Wire the new method
    wiredRoomData({ error, data }) {
        if (data) {
            console.log('Room data:', data);
            // Process the room data as needed
        } else if (error) {
            console.error('Error fetching room data:', error);
        }
    }

    @wire(getListingRecords, { searchKey: '$searchKey', pageNumber: '$pageNumber', pageSize: PAGE_SIZE })
    wiredRecords({ error, data }) {
        if (data) {
            this.data = data.listings;
            this.totalRecords = data.totalRecords;
            this.mapMarkers = [];
            this.mapMarkers1 = [];
            this.mapMarkers2 = []; 
            this.data.forEach(record => {
                this.mapMarkers1.push({
                    id: record.Id
                });
                this.mapMarkers2.push({
                    location: {
                        id: record.Id,
                        rooms: record.Bedrooms__c,
                        City: record.City__c,
                        Country: record.Country__c,
                        PostalCode: record.Zip_Postal_Code__c,
                        State: record.State__c,
                        Street: record.Street__c
                    },
                    title: record.Name,
                    description: `<b>Address:-</b> ${record.Street__c}, ${record.City__c}, ${record.State__c}, ${record.Country__c} <br><b>Sq_Ft:-</b> ${record.Sq_Ft__c}`
                });
            });
            this.mapMarkers = [...this.mapMarkers2]; 
            this.bDisableFirst = this.pageNumber === 1;
            this.bDisableLast = this.pageNumber * PAGE_SIZE >= this.totalRecords;
        } else if (error) {
            console.error('Error fetching data:', error);
        }
    }

    handleSearchChange(event) {
        this.searchKey = event.target.value;
        this.pageNumber = 1;
    }

    nextPage() {
        this.pageNumber++;
    }

    previousPage() {
        this.pageNumber--;
    }

    navigateToRecord(event) {
        const recordId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                actionName: 'view'
            }
        });
    }

    handleFilterChange(event) {
        const selectedOption = event.target.value;
        if (selectedOption === 'all') {
            this.mapMarkers = [...this.mapMarkers2]; 
            console.log('Reset to Original State:', JSON.stringify(this.mapMarkers));
        } else {
            console.log('Previous Filtered State:', JSON.stringify(this.mapMarkers));
            this.mapMarkers = this.mapMarkers2.filter(marker => marker.location.rooms === selectedOption);
            console.log('After Filtering:', JSON.stringify(this.mapMarkers));
        }
    }
    
    

    sortByRooms() {
        this.mapMarkers.sort((a, b) => a.location.rooms - b.location.rooms);
        this.mapMarkers = [...this.mapMarkers];
        refreshApex(this.mapMarkers);
    }

    handleClick() {
        this.showDiv = !this.showDiv;
        this.buttonLabel = this.showDiv ? 'Close' : 'Filter';
    }
}