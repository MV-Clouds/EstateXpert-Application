/**
 * @description       : This apex class is used to display property from the record page of listing and inquiry
 * @author            : MitrajSinh Gohil
 * @last modified on  : 25-07-2024
 * @last modified by  : Rachit Shah
**/
public with sharing class PropertySearchController{

    /**
     * @description       : This wrapper class is used to send data from apex method
     * @author            : MitrajSinh Gohil
     * @last modified on  : 25-07-2024
     * @last modified by  : Rachit Shah
    **/
    public class WrapperClass{
        @AuraEnabled
        public List<Listing__c> listings;  
        @AuraEnabled
        public Map<Id, String> medias; 
        @AuraEnabled
        public Listing__c listingRec;
        @AuraEnabled
        public Inquiry__c inquiryRec;
        }           

    /**
     * @description       : This apex class is method is used for getting listing data
     * @author            : MitrajSinh Gohil
     * @last modified on  : 25-07-2024
     * @last modified by  : Rachit Shah
    **/
    @AuraEnabled
    public static WrapperClass getListings(String recordId, String objectName){
        try{
            WrapperClass wc = new WrapperClass();

            if(objectName == 'Listing__c'){
                List<Listing__c> listing = [SELECT Id, Name, Description__c, City__c, Bedrooms__c, State__c, Zip_Postal_Code__c, Bathrooms__c, Sq_Ft__c, Property__c,
                Listing_Price__c,CurrencyIsoCode, Listing_Type__c, Availability_Date__c FROM Listing__c  WITH SECURITY_ENFORCED ORDER BY Name ASC LIMIT 50000] ;

                Listing__c currentlisting = [SELECT Id, Name, Description__c, City__c, Bedrooms__c, State__c, Zip_Postal_Code__c, Bathrooms__c, Sq_Ft__c, Property__c,
                Listing_Price__c,CurrencyIsoCode, Listing_Type__c, Availability_Date__c FROM Listing__c WHERE Id = :recordId WITH SECURITY_ENFORCED];

                Set<Id> propertyIds = new Set<Id>();     

                for(Listing__c lsrec : listing) {
                propertyIds.add(lsrec.Property__c);
                }      

                List<Property_File__c> medias = [SELECT Id,BaseUrl__c,Property__c FROM Property_File__c WHERE Property__c IN:propertyIds WITH SECURITY_ENFORCED];

                Map<Id, String> propertyMediaUrlsMap = new Map<Id, String>();
                for (Property_File__c media : medias) {
                propertyMediaUrlsMap.put(media.Property__c,media.BaseUrl__c);
                }

                wc.listings = listing;
                wc.medias = propertyMediaUrlsMap;  
                wc.listingRec = currentlisting;

                return wc;
            }

            else if(objectName == 'Inquiry__c'){
                List<Listing__c> listing = [SELECT Id, Name, Description__c, City__c, Bedrooms__c, State__c, Zip_Postal_Code__c, Bathrooms__c, Sq_Ft__c, Property__c,
                Listing_Price__c,CurrencyIsoCode, Listing_Type__c, Availability_Date__c FROM Listing__c  WITH SECURITY_ENFORCED ORDER BY Name ASC LIMIT 50000] ;

                Inquiry__c inquiry = [SELECT Id, Bathrooms_min__c , Bedrooms_min__c	FROM Inquiry__c WHERE Id =: recordId WITH SECURITY_ENFORCED];
                

                Set<Id> propertyIds = new Set<Id>();     

                for(Listing__c lsrec : listing) {
                propertyIds.add(lsrec.Property__c);
                }      

                List<Property_File__c> medias = [SELECT Id,BaseUrl__c,Property__c FROM Property_File__c WHERE Property__c IN:propertyIds WITH SECURITY_ENFORCED];

                Map<Id, String> propertyMediaUrlsMap = new Map<Id, String>();
                for (Property_File__c media : medias) {
                propertyMediaUrlsMap.put(media.Property__c,media.BaseUrl__c);
                }

                wc.listings = listing;
                wc.medias = propertyMediaUrlsMap;  
                wc.inquiryRec = inquiry;        

                return wc;
            }

            return null;

        } catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }
}