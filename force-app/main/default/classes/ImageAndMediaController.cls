/**
* Class Name : ImageAndMediaController
* Test Class : ImageAndMediaControllerTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Used to get, create and sort the images related to property.
*/
public with sharing class ImageAndMediaController {

    /**
    Class Name : ListingWrapper
    @description : Used to store the property id and images data.
    */
    public class ListingWrapper {
        @AuraEnabled
        public String propertyId { get; set; }
        @AuraEnabled
        public List<Property_File__c> listingImages { get; set; }
    }

    /**
    Method Name : fetchListingAndImages
    @param recordId to stored the Listing record Id
    @return ListingWrapper that contains property id and images data.
    @description : 
    */
    @AuraEnabled
    public static ListingWrapper fetchListingAndImages(String recordId){
        try {
            ListingWrapper newWrap = new ListingWrapper();
            List<Listing__c> listingRecord = [SELECT Id, Property__c FROM Listing__c WHERE Id =: recordId WITH SECURITY_ENFORCED LIMIT 1];
            if (!listingRecord.isEmpty()) {
                List<Property_File__c> listingImages = [SELECT Id, BaseUrl__c, Tags__c, Name, ExternalLink__c, Size__c, Property__c, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c, Sort_on_Expose__c, Sort_on_Portal_Feed__c, Sort_on_Website__c FROM Property_File__c WHERE Property__c =: listingRecord[0].Property__c WITH SECURITY_ENFORCED ORDER BY Name];
                listingImages.sort();

                newWrap.propertyId = listingRecord[0].Property__c;
                newWrap.listingImages = listingImages;

                return newWrap;
            } else {
                return null;
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'fetchListingAndImages', 'Error while getting listing record.');
            return null;
        }
    }

    /**
    Method Name : createmediaforlisting
    @param recordId to stored the Listing record Id
    @param mediaList to stored the images data
    @return Boolean value
    @description : Used to create new Property_File__c records.
    */
    @AuraEnabled
    public static Boolean createmediaforlisting(Id recordId, List<MediaData> mediaList){
        try {
            List<Property_File__c> mediaToInsert = new List<Property_File__c>();
            Listing__c listing;
            if (recordId != null) {
                listing = [SELECT Id, Property__c FROM Listing__c WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];
            }

            for (MediaData media : mediaList) {
                Property_File__c mediaRecord = new Property_File__c();
                mediaRecord.BaseUrl__c = media.externalUrl;
                if(media.name != '' && media.name != null){
                    if (media.name.length() > 80) { 
                        String truncatedName = media.name.substring(0, 80);
                        mediaRecord.Name = truncatedName; 
                        mediaRecord.Filename__c = media.name;
                    } else {
                        mediaRecord.Name = media.name;
                    }
                }
                mediaRecord.Size__c = media.size;
                mediaRecord.Property__c = listing.Property__c;
                mediaRecord.ExternalLink__c = media.externalVideoUrl;
                mediaRecord.IsOnExpose__c = media.IsOnExpose;
                mediaRecord.IsOnPortalFeed__c = media.IsOnPortalFeed;
                mediaRecord.IsOnWebsite__c = media.IsOnWebsite;
                mediaToInsert.add(mediaRecord);
            }
            
            if (!mediaToInsert.isEmpty() && 
                Property_File__c.SObjectType.getDescribe().isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.BaseUrl__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.Tags__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.Name.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.Filename__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.ExternalLink__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.Size__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.Property__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.IsOnExpose__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.IsOnPortalFeed__c.isCreateable() &&
                Schema.sObjectType.Property_File__c.fields.IsOnWebsite__c.isCreateable()
                ) {
                insert mediaToInsert;
                return true;
            } else {
                return false;
            }
            
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'createmediaforlisting', 'Error while creating Property_File__c record.');
            return false;
        }
    }
    
    /**
    Class Name : MediaData
    @description : Used to store the media data.
    */
    public class MediaData {
        @AuraEnabled
        public String name { get; set; }
        @AuraEnabled
        public Decimal size { get; set; }
        @AuraEnabled
        public String externalUrl { get; set; }
        @AuraEnabled
        public String externalVideoUrl { get; set; }
        @AuraEnabled
        public Boolean isOnExpose { get; set; }
        @AuraEnabled
        public Boolean isOnPortalFeed { get; set; }
        @AuraEnabled
        public Boolean isOnWebsite { get; set; }
    }

    /**
    Method Name : deletelistingmedia
    @param id to stored the Property_File__c record Id
    @param propertyId to stored the property Id
    @return Boolean value
    @description : Used to delete Property_File__c records.
    */
    @AuraEnabled
    public static Boolean deletelistingmedia(String id,String propertyId){
        try {
            if (id != null && Property_File__c.SObjectType.getDescribe().isDeletable()) {
                List<Property_File__c> record = [SELECT Id FROM Property_File__c WHERE Id = :id LIMIT 1];
                delete record;
            } else if (propertyId != null) {
                List<Listing__c> listing = [SELECT Id, Property__c FROM Listing__c WHERE Id= :propertyId WITH SECURITY_ENFORCED LIMIT 1];
                if (!listing.isEmpty() && Property_File__c.SObjectType.getDescribe().isDeletable()) {
                    List<Property_File__c> allMedia = [SELECT Id, Property__c FROM Property_File__c WHERE Property__c = :listing[0].Property__c];
                    delete allMedia;
                }
            }   
            return true;
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'deletelistingmedia', 'Error while deleting Property_File__c record.');
            return false;
        }
    }

    /**
    Method Name : updateMediaName
    @param dataMapJSON to stored the Property_File__c records information
    @return Boolean value
    @description : Used to update Property_File__c records.
    */
    @AuraEnabled
    public static Boolean updateMediaName(String dataMapJSON) {
        try {
            List<MediaInfo> mediaInfoList = (List<MediaInfo>) JSON.deserialize(dataMapJSON, List<MediaInfo>.class);

            List<Property_File__c> recordsToUpdate = new List<Property_File__c>();
            
            Set<String> recordIds = new Set<String>();
            for (MediaInfo info : mediaInfoList) {
                recordIds.add(info.recordId);
            }
            
            Map<String, Property_File__c> recordsMap = new Map<String, Property_File__c>([SELECT Id, Name, Tags__c FROM Property_File__c WHERE Id IN :recordIds WITH SECURITY_ENFORCED]);

            for (MediaInfo info : mediaInfoList) {
                String recordId = info.recordId;
                String fileName = info.fileName;
                Set<String> picklistValues = info.picklistValues;
                
                Property_File__c record = recordsMap.get(recordId);
                
                if (record != null) {
                    record.Name = fileName;
                    record.Tags__c = picklistValues != null && !picklistValues.isEmpty() ? String.join(picklistValues, ';') : '';
                    recordsToUpdate.add(record);
                }
            }

            if (!recordsToUpdate.isEmpty() && 
                Property_File__c.SObjectType.getDescribe().isUpdateable() &&
                Schema.sObjectType.Property_File__c.fields.Name.isUpdateable() &&
                Schema.sObjectType.Property_File__c.fields.Tags__c.isUpdateable()
                ) {
                update recordsToUpdate;
            }

            return true;

        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'updateMediaName', 'Error while updating Property_File__c record.');
            return false;
        }
    }

    /**
    Class Name : MediaInfo
    @description : Used to store the media data.
    */
    public class MediaInfo {
        public String recordId;
        public String fileName;
        public Set<String> picklistValues;
    }

    /**
    Method Name : updateOrderState
    @param exposeIds to stored the Property_File__c records id that needs to add in expose
    @param websiteIds to stored the Property_File__c records id that needs to add in website
    @param portalIds to stored the Property_File__c records id that needs to add in portal
    @param exposeIdsFalse to stored the Property_File__c records id that needs to remove in expose
    @param websiteIdsFalse to stored the Property_File__c records id that needs to remove in website
    @param portalIdsFalse to stored the Property_File__c records id that needs to remove in portal
    @return Boolean value
    @description : Used to sort Property_File__c records.
    */
    @AuraEnabled
    public static Boolean updateOrderState(List<Id> exposeIds, List<Id> websiteIds, List<Id> portalIds, List<Id> exposeIdsFalse, List<Id> websiteIdsFalse, List<Id> portalIdsFalse){
        try {
            if (!Property_File__c.SObjectType.getDescribe().isUpdateable() ||
                !Schema.sObjectType.Property_File__c.fields.IsOnExpose__c.isUpdateable() ||
                !Schema.sObjectType.Property_File__c.fields.IsOnWebsite__c.isUpdateable() ||
                !Schema.sObjectType.Property_File__c.fields.IsOnPortalFeed__c.isUpdateable()
                ) {
                return false;
            }

            if(exposeIds != null){
                List<Property_File__c> exposedMediaList = [SELECT Id, Name, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c FROM Property_File__c WHERE Id IN : exposeIds WITH SECURITY_ENFORCED];
                List<Property_File__c> exposedMediaListToUpdate = new List<Property_File__c>();
                if(exposedMediaList.size()>0){
                    for(Property_File__c prope :exposedMediaList ){
                        prope.IsOnExpose__c = true;
                        exposedMediaListToUpdate.add(prope);
                    }
                    update exposedMediaListToUpdate;    
                }
            }
    
            if(websiteIds != null){
                List<Property_File__c> websiteMediaList = [SELECT Id, Name, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c FROM Property_File__c WHERE Id IN : websiteIds WITH SECURITY_ENFORCED];
                List<Property_File__c> websiteMediaListToUpdate = new List<Property_File__c>();
                if(websiteMediaList.size()>0){
                    for(Property_File__c propw :websiteMediaList ){
                        propw.IsOnWebsite__c = true; 
                        websiteMediaListToUpdate.add(propw);
                    }
                    update websiteMediaListToUpdate;    
                }
            }
    
            if(portalIds != null){
                List<Property_File__c> portalMediaList = [SELECT Id, Name, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c FROM Property_File__c WHERE Id IN : portalIds WITH SECURITY_ENFORCED];
                List<Property_File__c> portalMediaListToUpdate = new List<Property_File__c>();
                if(portalMediaList.size()>0){
                    for(Property_File__c propp :portalMediaList ){
                        propp.IsOnPortalFeed__c = true;
                        portalMediaListToUpdate.add(propp);
                    }
                    update portalMediaListToUpdate;    
                }
            }
    
            if(exposeIdsFalse != null){
                List<Property_File__c> exposedMediaListFalse = [SELECT Id, Name, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c FROM Property_File__c WHERE Id IN : exposeIdsFalse WITH SECURITY_ENFORCED];
                List<Property_File__c> exposedMediaListToUpdateFalse = new List<Property_File__c>();
                if(exposedMediaListFalse.size()>0){
                    for(Property_File__c propef :exposedMediaListFalse ){
                        propef.IsOnExpose__c = false;
                        exposedMediaListToUpdateFalse.add(propef);
                    }
                    update exposedMediaListToUpdateFalse;    
                }
            }
    
            if(websiteIdsFalse != null){
                List<Property_File__c> websiteMediaListFalse = [SELECT Id, Name, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c FROM Property_File__c WHERE Id IN : websiteIdsFalse WITH SECURITY_ENFORCED];
                List<Property_File__c> websiteMediaListToUpdateFalse = new List<Property_File__c>();
                if(websiteMediaListFalse.size()>0){
                    for(Property_File__c propwf :websiteMediaListFalse ){
                        propwf.IsOnWebsite__c = false;
                        websiteMediaListToUpdateFalse.add(propwf);
                    }
                    update websiteMediaListToUpdateFalse;    
                }
            }
    
            if(portalIdsFalse != null){
                List<Property_File__c> portalMediaListFalse = [SELECT Id, Name, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c FROM Property_File__c WHERE Id IN : portalIdsFalse WITH SECURITY_ENFORCED];
                List<Property_File__c> portalMediaListToUpdateFalse = new List<Property_File__c>();
                if(portalMediaListFalse.size()>0){
                    for(Property_File__c proppf :portalMediaListFalse ){
                        proppf.IsOnPortalFeed__c = false;
                        portalMediaListToUpdateFalse.add(proppf);
                    }
                    update portalMediaListToUpdateFalse;    
                }
            }
            return true;
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'updateOrderState', 'Error while updating Property_File__c record.');
            return false;
        }
    }

    /**
    Method Name : updateSortOrder
    @param mediaList to stored the Property_File__c records
    @return Boolean value
    @description : Used to sort Property_File__c records.
    */
    @AuraEnabled
    public static Boolean updateSortOrder(List<Property_File__c> mediaList){
        try {
            if(mediaList.size() > 0 && Property_File__c.SObjectType.getDescribe().isUpdateable()){ 
                update mediaList;
            }
            return true;
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'updateSortOrder', 'Error while updating Property_File__c record.');
            return false;
        }
    }

    /**
    Method Name : getS3ConfigSettings
    @return AWS_Config__c details
    @description : Used to return the AWS_Config__c custom setting record.
    */
    @AuraEnabled(cacheable=true)
    public static AWS_Config__c getS3ConfigSettings(){
        try {
            return AWS_Config__c.getOrgDefaults();
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ImageAndMediaController', 'getS3ConfigSettings', 'Error while getting AWS_Config__c record.');
            return null;
        }
        
    }
    
}