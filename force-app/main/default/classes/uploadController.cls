public with sharing class uploadController {

    @AuraEnabled
    public static Listing__c getListingRecord(String recordId) {
        try {
            return [SELECT Id, Property__c FROM Listing__c WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching listing record: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static list<Property_File__c> fetchdataforlisting(String recordId){
        Listing__c listing = [SELECT Id, Property__c FROM Listing__c WHERE Id= :recordId WITH SECURITY_ENFORCED LIMIT 1];
        List<Property_File__c> result = [SELECT Id, BaseUrl__c, Tags__c, Name, ExternalLink__c, Size__c, Property__c, IsOnPortalFeed__c, IsOnWebsite__c, IsOnExpose__c, Sort_on_Expose__c, Sort_on_Portal_Feed__c, Sort_on_Website__c FROM Property_File__c WHERE Property__c = :listing.Property__c WITH SECURITY_ENFORCED ORDER BY Name];
        result.sort();
        return result;
    }

    @AuraEnabled
    public static Boolean createmediaforlisting(Id recordId, List<MediaData> mediaList){
        try {
            List<Property_File__c> mediaToInsert = new List<Property_File__c>();

            Listing__c listing = [SELECT Id, Property__c FROM Listing__c WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];

            for (MediaData media : mediaList) {
                
                Property_File__c mediaRecord = new Property_File__c();
                mediaRecord.BaseUrl__c = media.externalUrl;
                mediaRecord.Name = media.name;
                mediaRecord.Size__c = media.size;
                mediaRecord.Property__c = listing.Property__c;
                mediaRecord.ExternalLink__c = media.externalVideoUrl;
                mediaRecord.IsOnExpose__c = media.IsOnExpose;
                mediaRecord.IsOnPortalFeed__c = media.IsOnPortalFeed;
                mediaRecord.IsOnWebsite__c = media.IsOnWebsite;
                mediaToInsert.add(mediaRecord);
            }
            
            if (!mediaToInsert.isEmpty() && Property_File__c.SObjectType.getDescribe().isCreateable()) {
                insert mediaToInsert;
            }
            
            return true;
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public class MediaData {
        @AuraEnabled
        public String Name { get; set; }
        @AuraEnabled
        public Decimal Size { get; set; }
        @AuraEnabled
        public String externalUrl { get; set; }
        @AuraEnabled
        public String externalVideoUrl { get; set; }
        @AuraEnabled
        public Boolean IsOnExpose { get; set; }
        @AuraEnabled
        public Boolean IsOnPortalFeed { get; set; }
        @AuraEnabled
        public Boolean IsOnWebsite { get; set; }
    }

    @AuraEnabled
    public static Boolean deletelistingmedia(String id,String property_id){
        if(id !=null && Property_File__c.SObjectType.getDescribe().isDeletable()){
            List<Property_File__c> result = [SELECT Id, BaseUrl__c,IsOnExpose__c, Name, Size__c, Property__c FROM Property_File__c WHERE Id = :id LIMIT 1];
            delete result;
        }
        if(property_id !=null && Property_File__c.SObjectType.getDescribe().isDeletable()){
            Listing__c listing = [SELECT Id, Property__c FROM Listing__c WHERE Id= :property_id WITH SECURITY_ENFORCED LIMIT 1];
            List<Property_File__c> allMedia = [SELECT Id, BaseUrl__c, Name, Size__c, Property__c FROM Property_File__c WHERE Property__c = :listing.Property__c];
            delete allMedia;
        }
        return true;
    }

    @AuraEnabled
    public static Boolean update_media_name(String dataMapJSON) {
        try {
            List<MediaInfo> mediaInfoList = (List<MediaInfo>) JSON.deserialize(dataMapJSON, List<MediaInfo>.class);

            List<Property_File__c> recordsToUpdate = new List<Property_File__c>();
            
            // Collect recordIds to query outside the loop
            Set<String> recordIds = new Set<String>();
            for (MediaInfo info : mediaInfoList) {
                recordIds.add(info.recordId);
            }
            
            // Query records outside the loop
            Map<String, Property_File__c> recordsMap = new Map<String, Property_File__c>([SELECT Id, Name, Tags__c FROM Property_File__c WHERE Id IN :recordIds]);

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

            // Update records
            if (!recordsToUpdate.isEmpty()) {
                update recordsToUpdate;
            }

            return true;

        } catch (Exception e) {
            // System.debug('Exception ==> ' + e);
            return false;
        }
    }


    public class MediaInfo {

        public String recordId;
        public String fileName;
        public Set<String> picklistValues;
    }

    @AuraEnabled
    public static String getCurrentDateTimeWithSeconds() {
        DateTime currentDateTime = DateTime.now();
        String currentDateTimeWithSeconds = currentDateTime.format('yyyy-MM-dd HH:mm:ss');
        return currentDateTimeWithSeconds;
    }

    @AuraEnabled
    public static Boolean updateOrderState(List<Id> expose_ids, List<Id> website_ids, List<Id> portal_ids, List<Id> expose_ids_false, List<Id> website_ids_false, List<Id> portal_ids_false){


        if(expose_ids !=null && Property_File__c.SObjectType.getDescribe().isUpdateable()){
            List<Property_File__c> exposedMediaList = [SELECT Id,Name,IsOnPortalFeed__c,IsOnWebsite__c,IsOnExpose__c FROM Property_File__c WHERE Id IN : expose_ids WITH SECURITY_ENFORCED];
            List<Property_File__c> exposedMediaListToUpdate = new List<Property_File__c>();
            if(exposedMediaList.size()>0){
                for(Property_File__c prope :exposedMediaList ){
                    prope.IsOnExpose__c = true;
                    exposedMediaListToUpdate.add(prope);
                }
                update exposedMediaListToUpdate;    
            }
        }

        if(website_ids !=null && Property_File__c.SObjectType.getDescribe().isUpdateable()){
            List<Property_File__c> websiteMediaList = [SELECT Id,Name,IsOnPortalFeed__c,IsOnWebsite__c,IsOnExpose__c FROM Property_File__c WHERE Id IN : website_ids WITH SECURITY_ENFORCED];
            List<Property_File__c> websiteMediaListToUpdate = new List<Property_File__c>();
            if(websiteMediaList.size()>0){
                for(Property_File__c propw :websiteMediaList ){
                    propw.IsOnWebsite__c = true;
                    websiteMediaListToUpdate.add(propw);
                }
                update websiteMediaListToUpdate;    
            }
        }

        if(portal_ids !=null && Property_File__c.SObjectType.getDescribe().isUpdateable()){
            List<Property_File__c> portalMediaList = [SELECT Id,Name,IsOnPortalFeed__c,IsOnWebsite__c,IsOnExpose__c FROM Property_File__c WHERE Id IN : portal_ids WITH SECURITY_ENFORCED];
            List<Property_File__c> portalMediaListToUpdate = new List<Property_File__c>();
            if(portalMediaList.size()>0){
                for(Property_File__c propp :portalMediaList ){
                    propp.IsOnPortalFeed__c = true;
                    portalMediaListToUpdate.add(propp);
                }
                update portalMediaListToUpdate;    
            }
        }

        if(expose_ids_false !=null && Property_File__c.SObjectType.getDescribe().isUpdateable()){
            List<Property_File__c> exposedMediaListFalse = [SELECT Id,Name,IsOnPortalFeed__c,IsOnWebsite__c,IsOnExpose__c FROM Property_File__c WHERE Id IN : expose_ids_false WITH SECURITY_ENFORCED];
            List<Property_File__c> exposedMediaListToUpdateFalse = new List<Property_File__c>();
            if(exposedMediaListFalse.size()>0){
                for(Property_File__c propef :exposedMediaListFalse ){
                    propef.IsOnExpose__c = false;
                    exposedMediaListToUpdateFalse.add(propef);
                }
                update exposedMediaListToUpdateFalse;    
            }
        }

        if(website_ids_false !=null && Property_File__c.SObjectType.getDescribe().isUpdateable()){
            List<Property_File__c> websiteMediaListFalse = [SELECT Id,Name,IsOnPortalFeed__c,IsOnWebsite__c,IsOnExpose__c FROM Property_File__c WHERE Id IN : website_ids_false WITH SECURITY_ENFORCED];
            List<Property_File__c> websiteMediaListToUpdateFalse = new List<Property_File__c>();
            if(websiteMediaListFalse.size()>0){
                for(Property_File__c propwf :websiteMediaListFalse ){
                    propwf.IsOnWebsite__c = false;
                    websiteMediaListToUpdateFalse.add(propwf);
                }
                update websiteMediaListToUpdateFalse;    
            }
        }

        if(portal_ids_false !=null && Property_File__c.SObjectType.getDescribe().isUpdateable()){
            List<Property_File__c> portalMediaListFalse = [SELECT Id,Name,IsOnPortalFeed__c,IsOnWebsite__c,IsOnExpose__c FROM Property_File__c WHERE Id IN : portal_ids_false WITH SECURITY_ENFORCED];
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
    }

    @AuraEnabled
    public static Boolean updateSortOrder(List<Property_File__c> mediaList){
        if(mediaList.size() > 0 && Property_File__c.SObjectType.getDescribe().isUpdateable()){ 
            update mediaList;
        }
        return true;
    }

    @AuraEnabled (cacheable=true)
    public static AWS_Config__c getS3ConfigSettings(){
        return AWS_Config__c.getOrgDefaults();
    }
    
}