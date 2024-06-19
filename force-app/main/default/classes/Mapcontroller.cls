/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 06-19-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class Mapcontroller {

    public class PaginationResult {
        @AuraEnabled
        public List<Listing__c> listings;
        @AuraEnabled
        public Integer totalRecords;

        public PaginationResult(List<Listing__c> listings, Integer totalRecords) {
            this.listings = listings;
            this.totalRecords = totalRecords;
        }
    }

    @AuraEnabled(cacheable=true)
    public static PaginationResult getListingRecords(String searchKey, Integer pageNumber, Integer pageSize) {
        String searchQuery = '%' + searchKey + '%';
        Integer offset = (pageNumber - 1) * pageSize;

        List<Listing__c> listings = [SELECT Id, Name, Street__c, City__c, State__c, Country__c, Zip_Postal_Code__c, Sq_Ft__c ,Bathrooms__c,Bedrooms__c,Floor__c 
                                      FROM Listing__c 
                                      WHERE (Name LIKE :searchQuery OR 
                                             Street__c LIKE :searchQuery OR 
                                             City__c LIKE :searchQuery OR
                                             Country__c LIKE :searchQuery)
                                      LIMIT :pageSize OFFSET :offset];
                                      System.debug(listings);
        
        Integer totalRecords = [SELECT COUNT() 
                                FROM Listing__c 
                                WHERE (Name LIKE :searchQuery OR 
                                       Street__c LIKE :searchQuery OR 
                                       City__c LIKE :searchQuery)];
                                       System.debug(totalRecords);

        return new PaginationResult(listings, totalRecords);
    }

    @AuraEnabled(cacheable=true)
    public static void getRooms(String no_of_rooms) {
        List<Listing__c> room = [SELECT Id, Bedrooms__c FROM Listing__c WHERE Bedrooms__c != null];
        System.debug(room);
    }    
}