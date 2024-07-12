public without sharing class ListingTriggerHandler {
    
    List<Listing__c> recordNewList = new List<Listing__c>();
    List<Listing__c> recordOldList = new List<Listing__c>();
    Map<Id, Listing__c> recordNewMap = new Map<Id, Listing__c>();
    Map<Id, Listing__c> recordOldMap = new Map<Id, Listing__c>();
    Boolean isInsert ;
    Boolean isUpdate ;
    Boolean isDelete = false;
    Boolean isUndelete = false;
    private static final string CLASS_NAME = 'ListingTriggerHandler';
    public static Boolean isFirstTime = true;

    public ListingTriggerHandler(List<Listing__c> newList, List<Listing__c> oldList, Map<Id, Listing__c> newMap, Map<Id, Listing__c> oldMap, Boolean isInsert, Boolean isUpdate, Boolean isDelete, Boolean isUndelete) {
        this.recordNewList = newList;
        this.recordOldList = oldList;
        this.recordNewMap = newMap;
        this.recordOldMap = oldMap;
        this.isInsert = isInsert;
        this.isUpdate = isUpdate;
        this.isDelete = isDelete;
        this.isUndelete = isUndelete;
        //isFirstTime = true;
    }

    public void afterInsertEvent() {
        System.debug('in the after insert event');
        handleListingAfterInsert();
        isFirstTime = false;
    }

    public void afterUpdateEvent(){
        System.debug('in the after update event');
        handleListingAfterUpdate();
        isFirstTime = false;
    }

    public void beforeUpdateEvent(){
        System.debug('in the before update event');
        handleListingBeforeUpdate();
        isFirstTime = false;
    }
    
    //Main Methods
    public void handleListingAfterInsert() {
        try {
            //Get mapping from the metadata record
            System.debug('In Insert Method');
            Mapping_Metadata__mdt metaData = [SELECT Mapping_String__c, Automatic_Sync__c, BlockedFields__c FROM Mapping_Metadata__mdt LIMIT 1];
            
            String[] mappingPairs = metaData.Mapping_String__c.split(';');
            Map<String, String> fieldMappings = new Map<String, String>();
            for (String pair : mappingPairs) {
                String[] parts = pair.split(':');
                if (parts.size() == 2) {
                    fieldMappings.put(parts[0], parts[1]);
                }
            }
            
            //When Automatic sync is on
            if(metaData.Automatic_Sync__c != null && metaData.Automatic_Sync__c == true){

                //Get All fields and exclude the audit and unwritable fields
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
                
                Set<String> matchingFields = new Set<String>(listingFields);
                matchingFields.retainAll(propertyFields);

                List<Property__c> newProperties = new List<Property__c>();

                Map<Id, Property__c> existingPropertiesMap = new Map<Id, Property__c>();

                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c != null) {
                        existingPropertiesMap.put(newListing.Id, new Property__c(Id = newListing.Property__c));
                    }
                }

                Map<String, Property__c> matchingPropertiesMap = new Map<String, Property__c>();
                
                for (Property__c existingProperty : [SELECT Id, Name, Address__c, Bedrooms__c, Bathrooms__c FROM Property__c]) {
                    String propertyKey = existingProperty.Name + '|' + existingProperty.Address__c + '|' + existingProperty.Bedrooms__c + '|' + existingProperty.Bathrooms__c;
                    matchingPropertiesMap.put(propertyKey, existingProperty);
                }
                
                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c == null) {
                        System.debug('Here ==');
                        String propertyKey = newListing.Name + '|' + newListing.Address__c + '|' + newListing.Bedrooms__c	 + '|' + newListing.Bathrooms__c;
                        if (matchingPropertiesMap.containsKey(propertyKey)) {
                            Property__c existingProperty = matchingPropertiesMap.get(propertyKey);
                            System.debug('existingProperty ==>' + existingProperty);
                            for (String field : matchingFields) {
                                System.debug('listingField ==>' + field);
                                if (field != 'Id' && field != 'Name' && field != 'RecordTypeId') {
                                    existingProperty.put(field, newListing.get(field));
                                    System.debug('listingField in if ==>' + field);
                                }
                            }
                            newProperties.add(existingProperty);
                        } else {
                            // Create a new property
                            Property__c property = new Property__c();
                            for (String field : matchingFields) {
                                if (field != 'RecordTypeId') {
                                    property.put(field, newListing.get(field));
                                }
                            }
                            newProperties.add(property);
                        }
                    } else {
                        Property__c property = existingPropertiesMap.get(newListing.Id);
                        for (String field : matchingFields) {
                            if (field != 'RecordTypeId' && field != 'Id' && field != 'Name') {
                                property.put(field, newListing.get(field));
                            }
                        }
                        newProperties.add(property);
                    }
                }

                
                if (!newProperties.isEmpty()) {
                    upsert newProperties;
                    List<Listing__c> listingsToUpdate = new List<Listing__c>();
                    for (Integer i = 0; i < recordNewList.size(); i++) {
                        if (recordNewList[i].Property__c == null) {
                            listingsToUpdate.add(new Listing__c(
                                Id = recordNewList[i].Id,
                                Property__c = newProperties[i].Id
                            ));
                        }
                    }
                    update listingsToUpdate;
                }
            } else {
                //when Automatic sync is off
                List<Property__c> newProperties = new List<Property__c>();

                Map<Id, Property__c> existingPropertiesMap = new Map<Id, Property__c>();

                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c != null) {
                        existingPropertiesMap.put(newListing.Id, new Property__c(Id = newListing.Property__c));
                    }
                }
                
                Map<String, Property__c> matchingPropertiesMap = new Map<String, Property__c>();
                
                for (Property__c existingProperty : [SELECT Id, Name, Address__c, Bedrooms__c, Bathrooms__c FROM Property__c]) {
                    String propertyKey = existingProperty.Name + '|' + existingProperty.Address__c + '|' + existingProperty.Bedrooms__c + '|' + existingProperty.Bathrooms__c;
                    matchingPropertiesMap.put(propertyKey, existingProperty);
                }
                
                
                for (Listing__c listing : recordNewList) {
                    if (listing.Property__c == null) {
                        String propertyKey = listing.Name + '|' + listing.Address__c + '|' + listing.Bedrooms__c	 + '|' + listing.Bathrooms__c;
                        if (matchingPropertiesMap.containsKey(propertyKey)) {
                            Property__c existingProperty = matchingPropertiesMap.get(propertyKey);
                            for (String listingField : fieldMappings.keySet()) {
                                System.debug('listingField ==>' + listingField);
                                if (listing.get(listingField) != null) {
                                    String propertyField = fieldMappings.get(listingField);
                                    if(propertyField != 'Id' && Schema.SObjectType.Property__c.fields.getMap().get(propertyField).getDescribe().isUpdateable() && propertyField != 'RecordTypeId'){
                                        existingProperty.put(propertyField, listing.get(listingField));  
                                        System.debug('propertyField ==>' + propertyField);
                                    }
                                }
                            }
                            newProperties.add(existingProperty);
                        }
                        else{
                            Property__c property = new Property__c(); 
                            for (String listingField : fieldMappings.keySet()) {
                                if (listing.get(listingField) != null) {
                                    String propertyField = fieldMappings.get(listingField);
                                    if(propertyField != 'Id' && Schema.SObjectType.Property__c.fields.getMap().get(propertyField).getDescribe().isUpdateable() && propertyField != 'RecordTypeId'){
                                        property.put(propertyField, listing.get(listingField));  
                                    }
                                }
                            }
                            newProperties.add(property);
                        }

                    }
                    else{
                        Property__c property = existingPropertiesMap.get(listing.Id);
                        for (String listingField : fieldMappings.keySet()) {
                            if (listing.get(listingField) != null && listingField != 'Name') {
                                String propertyField = fieldMappings.get(listingField);
                                if(propertyField != 'Id' && Schema.SObjectType.Property__c.fields.getMap().get(propertyField).getDescribe().isUpdateable() && propertyField != 'RecordTypeId'){
                                    property.put(propertyField, listing.get(listingField));  
                                }
                            }
                        }
                        newProperties.add(property);

                    }

                }
                
                if (!newProperties.isEmpty()) {
                    upsert newProperties;
                    
                    List<Listing__c> listingsToUpdate = new List<Listing__c>();
                    for (Integer i = 0; i < recordNewList.size(); i++) {
                        listingsToUpdate.add(new Listing__c(
                            Id = recordNewList[i].Id,
                            Property__c = newProperties[i].Id
                        ));
                    }
                    update listingsToUpdate;
                }
            }
        } catch(Exception e) {
            System.debug('Exception ==> ' + e);
            System.debug('Line Number ==> ' + e.getLineNumber());
        }
    }

    public void handleListingAfterUpdate() {
        try {
            Mapping_Metadata__mdt metaData = [SELECT Mapping_String__c, Automatic_Sync__c, BlockedFields__c FROM Mapping_Metadata__mdt LIMIT 1];
            
            String[] mappingPairs = metaData.Mapping_String__c.split(';');
            Map<String, String> fieldMappings = new Map<String, String>();
            for (String pair : mappingPairs) {
                String[] parts = pair.split(':');
                if (parts.size() == 2) {
                    fieldMappings.put(parts[0], parts[1]);
                }
            }
            
            if (recordNewList.isEmpty()) {
                System.debug('recordNewList is empty');
                return;
            }
            
            //When Automatic sync is on
            if (metaData.Automatic_Sync__c != null && metaData.Automatic_Sync__c == true) {
                List<Property__c> propertiesToUpdate = new List<Property__c>();
                Set<Id> propertyIds = new Set<Id>();
                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c != null) {
                        propertyIds.add(newListing.Property__c);
                    }
                }
                Map<Id, Property__c> existingPropertiesMap = new Map<Id, Property__c>();
                if (!propertyIds.isEmpty()) {
                    for (Property__c existingProperty : [SELECT Id FROM Property__c WHERE Id IN :propertyIds]) {
                        existingPropertiesMap.put(existingProperty.Id, existingProperty);
                    }
                }
                
                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c != null && existingPropertiesMap.containsKey(newListing.Property__c)) {
                        Property__c existingProperty = existingPropertiesMap.get(newListing.Property__c);
                        Map<String, Object> listingFields = newListing.getPopulatedFieldsAsMap();
                        for (String fieldName : listingFields.keySet()) {
                            if (!fieldName.startsWith('System') && Schema.SObjectType.Property__c.fields.getMap().containsKey(fieldName) && Schema.SObjectType.Property__c.fields.getMap().get(fieldName).getDescribe().isUpdateable() && fieldName != 'Id' && fieldName != 'RecordTypeId' ) {
                                existingProperty.put(fieldName, newListing.get(fieldName));
                                System.debug('fieldName ==>' + fieldName);
                            }
                        }
                        propertiesToUpdate.add(existingProperty);
                        // debug
                    }
                }
                
                
                if (!propertiesToUpdate.isEmpty()) {
                    System.debug('existingPropertiesMap ==>' + propertiesToUpdate);
                    update propertiesToUpdate;
                }
            }
            else {
                // When Automatic sync is off
                List<Property__c> propertiesToUpdate = new List<Property__c>();
            
                Map<Id, Property__c> existingPropertiesMap = new Map<Id, Property__c>();
                
                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c != null) {
                        existingPropertiesMap.put(newListing.Id, new Property__c(Id = newListing.Property__c));
                    }
                }
            
                for (Listing__c newListing : recordNewList) {
                    if (newListing.Property__c != null) {
                        Property__c property = existingPropertiesMap.get(newListing.Id);
                        if (property != null) {
                            for (String listingField : fieldMappings.keySet()) {
                                String propertyField = fieldMappings.get(listingField);
                                if (newListing.get(listingField) != null && !metaData.BlockedFields__c.contains(propertyField) && propertyField != 'Id' ) {
                                    property.put(propertyField, newListing.get(listingField));  
                                }
                            }
                            propertiesToUpdate.add(property);
                        }
                    }
                }
            
                if (!propertiesToUpdate.isEmpty()) {
                    update propertiesToUpdate; 
                }
            }
            
            
        } catch(Exception e) {
            System.debug('Exception ==> ' + e);
            System.debug('Line Number ==>' + e.getLineNumber());
        }
    }

    public void handleListingBeforeUpdate(){
        try {
            List<MVEX__PortalListing__c> portalListingsToUpdate = new List<MVEX__PortalListing__c>();
            List<MVEX__PortalListing__c> portalListings = [SELECT Id, MVEX__Listing__c, MVEX__SystemIsActive__c, MVEX__Portal__r.MVEX__Generator__c FROM MVEX__PortalListing__c WHERE MVEX__Listing__c IN :recordNewList AND MVEX__SystemIsActive__c = true WITH SECURITY_ENFORCED];
            List<Map<String, String>> listingToGeneratorMap = new List<Map<String, String>>();

            for (Listing__c listing : recordNewList) {
                if (listing.MVEX__Status__c != 'Active' || listing.MVEX__Listing_Allowed_For_Portals__c != true) {
                    if(portalListings.size()>0){
                        for(MVEX__PortalListing__c portalListing : portalListings){
                            portalListing.MVEX__SystemIsActive__c = false;
                            portalListingsToUpdate.add(portalListing);
                            Map<String, String> newMap = new Map<String, String>();
                            newMap.put('listingId', portalListing.MVEX__Listing__c);
                            newMap.put('generator', portalListing.MVEX__Portal__r.MVEX__Generator__c);
                            listingToGeneratorMap.add(newMap);
                        }
                    }

                }
            }

            if(!portalListingsToUpdate.isEmpty()){
                update portalListingsToUpdate;
            }

            if (!listingToGeneratorMap.isEmpty()) {
                System.debug('listingToGeneratorMap ==>' + listingToGeneratorMap);
                for (Map<String, String> newMap : listingToGeneratorMap) {
                    System.debug('listingId ==>' + newMap.get('listingId'));
                    String generator = newMap.get('generator');
                    if (generator == 'Zoopla') {
                        System.debug('listingId1 ==>' + newMap.get('listingId'));
                        ZooplaIntegration.zooplaDeleteListing(newMap.get('listingId'));
                    } else if (generator == 'Rightmove') {
                        System.debug('listingId2 ==>' + newMap.get('listingId'));
                        RightmoveIntegration.rightmoveDeleteListing(newMap.get('listingId'));
                    }
                }
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingTriggerHandler', 'handleListingBeforeUpdate', 'Error while deleting listing records on Zoopla.');
        }
    }
    
}