public with sharing class PropertyTriggerHandler {
    
    List<Property__c> recordNewList = new List<Property__c>();
    List<Property__c> recordOldList = new List<Property__c>();
    Map<Id, Property__c> recordNewMap = new Map<Id, Property__c>();
    Map<Id, Property__c> recordOldMap = new Map<Id, Property__c>();
    Boolean isInsert ;
    Boolean isUpdate ;
    Boolean isDelete = false;
    Boolean isUndelete = false;
    private static final string CLASS_NAME = 'PropertyTriggerhandler';
    public static Boolean isFirstTime = true;

    public PropertyTriggerhandler(List<Property__c> newList, List<Property__c> oldList, Map<Id, Property__c> newMap, Map<Id, Property__c> oldMap, Boolean isInsert, Boolean isUpdate, Boolean isDelete, Boolean isUndelete) {
        this.recordNewList = newList;
        this.recordOldList = oldList;
        this.recordNewMap = newMap;
        this.recordOldMap = oldMap;
        this.isInsert = isInsert;
        this.isUpdate = isUpdate;
        this.isDelete = isDelete;
        this.isUndelete = isUndelete;
    }

    public void afterInsertEvent() {
        handlepropertyAfterInsert();
        isFirstTime = false;
    }

    public void afterUpdateEvent(){
        handlepropertyAfterUpdate();
        isFirstTime = false;
    }

    public void handlepropertyAfterInsert(){

        Mapping_Metadata__mdt metaData = [SELECT Mapping_String__c, Autometic_Sync__c, BlockedFields__c FROM Mapping_Metadata__mdt LIMIT 1];
            
        String[] mappingPairs = metaData.Mapping_String__c.split(';');
        Map<String, String> fieldMappings = new Map<String, String>();
        for (String pair : mappingPairs) {
            String[] parts = pair.split(':');
            if (parts.size() == 2) {
                fieldMappings.put(parts[0], parts[1]);
            }
        }

        if(metaData.Autometic_Sync__c != null && metaData.Autometic_Sync__c == true){

            Map<String, Schema.SObjectField> listingFieldsMap = Schema.SObjectType.Listing__c.fields.getMap();
            Set<String> listingFields = listingFieldsMap.keySet();
            
            Map<String, Schema.SObjectField> propertyFieldsMap = Schema.SObjectType.Property__c.fields.getMap();
            Set<String> propertyFields = propertyFieldsMap.keySet();
            
            Set<String> auditFields = new Set<String>(metaData.BlockedFields__c.split(';'));
            for (String auditField : auditFields) {
                if (listingFields.contains(auditField)) {
                    listingFields.remove(auditField);
                }
                if (propertyFields.contains(auditField)) {
                    propertyFields.remove(auditField);
                }
            }

            Set<String> unwritableFieldsForListing = new Set<String>();
            for (String fieldName : listingFields) {
                if (!listingFieldsMap.get(fieldName).getDescribe().isUpdateable()) {
                    unwritableFieldsForListing.add(fieldName);
                }
            }
            listingFields.removeAll(unwritableFieldsForListing);
            
            Set<String> unwritableFieldsForProperty = new Set<String>();
            for (String fieldName : propertyFields) {
                if (!propertyFieldsMap.get(fieldName).getDescribe().isUpdateable()) {
                    unwritableFieldsForProperty.add(fieldName);
                }
            }
            propertyFields.removeAll(unwritableFieldsForProperty);
            
            Set<String> matchingFields = new Set<String>(propertyFields);
            matchingFields.retainAll(listingFields);

            //Create Listing
            List<Listing__c> newListings = new List<Listing__c>();

            for (Property__c newProperty : recordNewList) {
                Listing__c listing = new Listing__c();
                for (String field : matchingFields) {
                    if (field != 'RecordTypeId') {
                        listing.put(field, newProperty.get(field));
                    }
                }
                listing.Property__c = newProperty.Id;
                newListings.add(listing);
            }

            System.debug('newListings ==> ' + newListings);

            Set<Listing__c> uniqueListings = new Set<Listing__c>(newListings);

            if(!uniqueListings.isempty()){
                insert new List<Listing__c>(uniqueListings);
            }

        }
        else {
            // When Automatic sync is off
            List<Listing__c> newListings = new List<Listing__c>();
        
            for (Property__c property : recordNewList) {
                Listing__c listing = new Listing__c(); 
                for (String propertyField : fieldMappings.keySet()) {
                    if (property.get(propertyField) != null) {
                        String listingField = fieldMappings.get(propertyField);
                        // Set the value from Property__c object to Listing__c object
                        listing.put(listingField, property.get(propertyField));  
                    }
                }
                listing.Property__c = property.Id;
                newListings.add(listing);
            }
            
            Set<Listing__c> uniqueListings = new Set<Listing__c>(newListings);
            
            if (!uniqueListings.isEmpty()) {
                insert new List<Listing__c>(uniqueListings);
            }
        }
        
    }

        
        

    public void handlepropertyAfterUpdate(){
        Mapping_Metadata__mdt metaData = [SELECT Mapping_String__c, Autometic_Sync__c, BlockedFields__c FROM Mapping_Metadata__mdt LIMIT 1];
        
        String[] mappingPairs = metaData.Mapping_String__c.split(';');
        Map<String, String> fieldMappings = new Map<String, String>();
        for (String pair : mappingPairs) {
            String[] parts = pair.split(':');
            if (parts.size() == 2) {
                fieldMappings.put(parts[0], parts[1]);
            }
        }
    
        if (metaData.Autometic_Sync__c != null && metaData.Autometic_Sync__c == true) {
            // Automatic sync is enabled
            Set<Id> propertyIds = new Set<Id>();
            for (Property__c property : recordNewList) {
                propertyIds.add(property.Id);
            }
    
            Map<Id, List<Listing__c>> propertyToListingsMap = new Map<Id, List<Listing__c>>();
            for (Listing__c listing : [SELECT Id, Property__c FROM Listing__c WHERE Property__c IN :propertyIds]) {
                if (!propertyToListingsMap.containsKey(listing.Property__c)) {
                    propertyToListingsMap.put(listing.Property__c, new List<Listing__c>());
                }
                propertyToListingsMap.get(listing.Property__c).add(listing);
            }
    
            List<Listing__c> listingsToUpdate = new List<Listing__c>();
    
            for (Property__c updatedProperty : recordNewList) {
                List<Listing__c> listings = propertyToListingsMap.get(updatedProperty.Id);
                if (listings != null) {
                    for (Listing__c listing : listings) {
                        for (String field : fieldMappings.keySet()) {
                            String propertyField = field;
                            String listingField = fieldMappings.get(field);
                            if (propertyField != 'RecordTypeId' && listingField != 'RecordTypeId' && propertyField != 'Name') {
                                listing.put(listingField, updatedProperty.get(propertyField));
                            }
                        }
                        listingsToUpdate.add(listing);
                    }
                }
            }
    
            if (!listingsToUpdate.isEmpty()) {
                update listingsToUpdate;
            }
        } 
        else {
            // Query all related listings for the updated properties
            Set<Id> propertyIds = new Set<Id>();
            for (Property__c updatedProperty : recordNewList) {
                propertyIds.add(updatedProperty.Id);
            }
            
            Map<Id, List<Listing__c>> propertyToListingsMap = new Map<Id, List<Listing__c>>();
            for (Listing__c listing : [SELECT Id, Property__c FROM Listing__c WHERE Property__c IN :propertyIds]) {
                if (!propertyToListingsMap.containsKey(listing.Property__c)) {
                    propertyToListingsMap.put(listing.Property__c, new List<Listing__c>());
                }
                propertyToListingsMap.get(listing.Property__c).add(listing);
            }
            
            List<Listing__c> listingsToUpdate = new List<Listing__c>();
            
            for (Property__c updatedProperty : recordNewList) {
                List<Listing__c> listings = propertyToListingsMap.get(updatedProperty.Id);
                if (listings != null) {
                    for (Listing__c listing : listings) {
                        for (String propertyField : fieldMappings.keySet()) {
                            String listingField = fieldMappings.get(propertyField);
                            if (updatedProperty.get(propertyField) != null && propertyField != 'RecordTypeId' && listingField != 'RecordTypeId' && propertyField != 'Name') {
                                listing.put(listingField, updatedProperty.get(propertyField));
                            }
                        }
                        listingsToUpdate.add(listing);
                    }
                }
            }
            
            if (!listingsToUpdate.isEmpty()) {
                update listingsToUpdate;
            }
        }        
    }
    

}