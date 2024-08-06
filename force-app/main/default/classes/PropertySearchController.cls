/**
 * @description       : This apex class is used to display property from the record page of listing and inquiry
 * @author            : MitrajSinh Gohil
 * @last modified on  : 25-07-2024
 * @last modified by  : Rachit Shah
**/
public with sharing class PropertySearchController {

    /**
     * @description       : This wrapper class is used to send data from apex method
     * @author            : MitrajSinh Gohil
     * @last modified on  : 25-07-2024
     * @last modified by  : Rachit Shah
    **/
    public class WrapperClass {
        @AuraEnabled
        public List<Listing__c> listings;  
        @AuraEnabled
        public List<Inquiry__c> inquiries;
        @AuraEnabled
        public Map<Id, String> medias; 
    }           

    /**
     * @description       : This apex class method is used for getting listing and inquiry data
     * @author            : MitrajSinh Gohil
     * @last modified on  : 25-07-2024
     * @last modified by  : Rachit Shah
    **/
    @AuraEnabled
    public static WrapperClass getRecords(String recId, String objectName) {
        try {
            WrapperClass wc = new WrapperClass();
            Set<Id> propertyIds = new Set<Id>();
            List<Listing__c> listings = new List<Listing__c>();
            List<Inquiry__c> inquiries = new List<Inquiry__c>();
            List<Listing__c> currentListing = new List<Listing__c>();
            List<Inquiry__c> currentInquiry = new List<Inquiry__c>();

            String listingFields = getAllFields('Listing__c');
            String inquiryFields = getAllFields('Inquiry__c');

            if (objectName == 'Listing__c') {
                currentListing = Database.query('SELECT ' + String.escapeSingleQuotes(listingFields) + ' FROM Listing__c WHERE id =:recId ');

                inquiries = Database.query('SELECT ' + String.escapeSingleQuotes(inquiryFields) + ' FROM Inquiry__c  ORDER BY Name ASC');

                wc.listings = currentListing;
                wc.inquiries = inquiries;

            } 
            else if (objectName == 'Inquiry__c') {
                currentInquiry = Database.query('SELECT ' + String.escapeSingleQuotes(inquiryFields) + ' FROM Inquiry__c WHERE id =:recId ');

                listings = Database.query('SELECT ' + String.escapeSingleQuotes(listingFields) + ' FROM Listing__c  ORDER BY Name ASC');

                for (Listing__c listing : listings) {
                    propertyIds.add(listing.Property__c);
                }

                wc.listings = listings;
                wc.inquiries = currentInquiry;
            }

            List<Property_File__c> medias = [SELECT Id, BaseUrl__c, Property__c FROM Property_File__c WHERE Property__c IN :propertyIds WITH SECURITY_ENFORCED];
            Map<Id, String> propertyMediaUrlsMap = new Map<Id, String>();
            for (Property_File__c media : medias) {
                propertyMediaUrlsMap.put(media.Property__c, media.BaseUrl__c);
            }

            wc.medias = propertyMediaUrlsMap;

            return wc;
        } catch (Exception e) {
            System.debug('Exception => ' + e);
            System.debug('Line number ==> ' + e.getLineNumber());
            return null;
        }
    }

    private static String getAllFields(String objectName) {
        try {
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            if (globalDescribe.containsKey(objectName)) {
                Schema.SObjectType sObjectType = globalDescribe.get(objectName);
                Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
                Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();

                List<String> fieldNames = new List<String>();
                for (String fieldName : fieldsMap.keySet()) {
                    fieldNames.add(fieldName);
                }

                return String.join(fieldNames, ',');
            }
        } catch (Exception e) {
            System.debug('Exception in getAllFields => ' + e);
            System.debug('Line number ==> ' + e.getLineNumber());
        }
        return '';
    }
}
