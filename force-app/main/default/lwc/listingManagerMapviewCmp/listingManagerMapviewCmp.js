import { LightningElement,track,api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import designcss from '@salesforce/resourceUrl/listingManagerCss';
export default class ListingManagerMapviewCmp extends LightningElement {
    @track data = [];
    @track mapMarkers = [];
    @track mapMarkers1 = [];
    @track mapMarkers2 = []; 
    @api listings = [];
    @track mapCenter = {
        location: {
            Latitude: 	25.5908,
            Longitude: 	85.1348
        }
    };

    connectedCallback() {
        loadStyle(this, designcss);
        if(this.listings != null){
            this.loadPropertyData(this.listings);
        }
    }

     /**
    * Method Name : loadPropertyData
    * @description : load the marker from the selected properties.
    * Created By:Vyom Soni
    */
    loadPropertyData(data) {
        try{
            if (data) {
                this.data = data;
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
                            rooms: record.Number_of_Bedrooms__c,
                            City: record.City__c,
                            Country: record.Country__c,
                            PostalCode: record.Postal_Code__c,
                            State: record.State__c,
                            Street: record.Street__c
                        },
                        title: record.Name,
                        description: `<b>Address:-</b> ${record.Street__c}, ${record.City__c}, ${record.State__c}, ${record.Country__c} <br><b>Sq_Ft:-</b> ${record.Sq_Ft__c}`
                    });
                });
                this.mapMarkers = [...this.mapMarkers2]; 
        }
        } catch(error){
            console.log("Error set markers:"+error);
        }
    }
}