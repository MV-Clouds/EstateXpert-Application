import { LightningElement,track,api } from 'lwc';
//import designcss from '@salesforce/resourceUrl/listingManagerCss';

export default class ListingManagerMapviewCmp extends LightningElement {
    @api listings = [];
    @track data = [];
    @track mapMarkers = [];
    @track mapMarkers1 = [];
    @track mapMarkers2 = []; 
    @track mapCenter = {
        location: {
            Latitude: 	25.5908,
            Longitude: 	85.1348
        }
    };

    
      /**
    * Method Name : get listingsdata
    * @description : get the filtered listing data from listing manager component reactively
    * date:4/06/2024
    * Created By: Vyom Soni
    */
      @api
      get listingsdata() {
          return this.listings;
      }
  
        /**
      * Method Name : set listingsdata
      * @description : set the filtered listing data from listing manager component reactively
      * @param: value- data from the parent component
      * date:4/06/2024
      * Created By: Vyom Soni
      */
      set listingsdata(value) {
              if (value && Array.isArray(value)) {
                  this.listings = value;
                  this.loadPropertyData(this.listings);
              } else {
                  this.listings = [];
              }   
      }

     /**
    * Method Name : connectedCallback
    * @description : load selected listing data in map-markers list.
    * date:5/06/2024
    * Created By:Vyom Soni
    */
    connectedCallback() {
        if(this.listings != null){
            this.loadPropertyData(this.listings);
            // console.log('Map Data:- '+ JSON.stringify(this.listings));
        }
    }

     /**
    * Method Name : loadPropertyData
    * @description : load the marker from the selected properties.
    * @param: data- propeties data.
    * date:5/06/2024
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
                            rooms: record.MVEX__Number_of_Bedrooms__c,
                            City: record.MVEX__City__c,
                            Country: record.MVEX__Country__c,
                            PostalCode: record.MVEX__Postal_Code__c,
                            State: record.MVEX__State__c,
                            Street: record.MVEX__Street__c
                        },
                        title: record.Name,
                        description: `<b>Address:-</b> ${record.MVEX__Street__c}, ${record.MVEX__City__c}, ${record.MVEX__State__c}, ${record.MVEX__Country__c} <br><b>Sq_Ft:-</b> ${record.Sq_Ft__c}`
                    });
                });
                this.mapMarkers = [...this.mapMarkers2]; 
        }
        } catch(error){
            // console.log("Error set markers:"+error);
        }
    }
}