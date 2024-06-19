/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 06-19-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class PropertySearchController{

    public class WrapperClass{
        @AuraEnabled
        public List<Listing__c> Listings;  
        @AuraEnabled
        public Map<Id, String> Medias;            
    }

    @AuraEnabled
    public static WrapperClass GetProperties(String RecordId, String object_name){
        try{
            WrapperClass wc = new WrapperClass();
            if(object_name=='Property__c'){
            }else{
                List<Listing__c> listing = [SELECT Id, Name, Description__c, City__c, Bedrooms__c, State__c, Zip_Postal_Code__c, Bathrooms__c, Sq_Ft__c, Property__c,
                                               Listing_Price__c, Listing_Type__c, Availability_Date__c FROM Listing__c ORDER BY Name ASC LIMIT 50000];

                Set<Id> propertyIds = new Set<Id>();     

                for(Listing__c listing_rec :listing) {
                    propertyIds.add(listing_rec.Property__c);
                }      

                List<Property_File__c> medias = [SELECT Id,BaseUrl__c,Property__c FROM Property_File__c WHERE Property__c IN:propertyIds];

                Map<Id, String> propertyMediaUrlsMap = new Map<Id, String>();
                for (Property_File__c media : medias) {
                        propertyMediaUrlsMap.put(media.Property__c,media.BaseUrl__c);
                }

                wc.Listings = listing;
                wc.Medias = propertyMediaUrlsMap;          
            }
            
            return wc;

        } catch (Exception e){
            System.debug('Exception type: ' + e.getTypeName());
            System.debug('Message: ' + e.getMessage());
            System.debug('Cause: ' + e.getCause()); 
            System.debug('Line number: ' + e.getLineNumber());
            System.debug('Stack trace: ' + e.getStackTraceString()); 
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static List<String> GetListingTypes(){
        try {
            Schema.DescribeFieldResult fieldResult = Listing__c.Listing_Type__c.getDescribe();

            List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
            System.debug(picklistEntries);
            List<String> picklistValues = new List<String>();

            for(Schema.PicklistEntry entry : picklistEntries) {
                picklistValues.add(entry.getLabel());
            }
            System.debug(picklistValues);
            return picklistValues;

        } catch (Exception e) {
            System.debug('An error occurred: ' + e.getMessage());
            return null;
        }
    }
}