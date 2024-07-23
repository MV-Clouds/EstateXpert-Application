/**
* Class Name : CreatePortalListingMappingRecords
* Test Class : CreatePortalListingMappingRecordsTest
* Created By : Karan Singh
* Last Modified Date : 12/07/2024
* Last Modified By : Karan Singh
* @description : Used in portalMappingComponent and portalMappingLandingPage LWC components
*/
public with sharing class CreatePortalListingMappingRecords {
    
    /**
    * Method Name : createPortalRecords
    * @param portalName - Name of the portal.
    * @description : Create records of Portal_Listing_Mapping__c object.
    * @return List of Portal_Listing_Mapping__c records.
    */
    public static String createPortalRecords(String portalName) {
        try {
            Portaldata__mdt portalMetaData = [SELECT MasterLabel, MVEX__Portal_Record__c, MVEX__Portal_Value__c FROM Portaldata__mdt WHERE MVEX__Portal_Value__c = :portalName WITH SECURITY_ENFORCED LIMIT 1];

            Object jsonObject = JSON.deserializeUntyped(portalMetaData.MVEX__Portal_Record__c);
            if (jsonObject instanceof List<Object>) {
                List<Object> jsonList = (List<Object>) jsonObject;
                List<Map<String, Object>> jsonData = new List<Map<String, Object>>();
                for (Object item : jsonList) {
                    if (item instanceof Map<String, Object>) {
                        jsonData.add((Map<String, Object>) item);
                    } else {
                        throw new TypeException('Unexpected JSON structure.');
                    }
                }

                List<Portal_Listing_Mapping__c> newRecords = new List<Portal_Listing_Mapping__c>();

                Map<String, String> stringMap = new Map<String, String>();
                
                for (Map<String, Object> recordData : jsonData) {
                    if (recordData.containsKey('MVEX__Listing_Field_API_Name__c') && recordData.get('MVEX__Listing_Field_API_Name__c') != null && recordData.containsKey('Name')) {
                        stringMap.put((String) recordData.get('MVEX__Listing_Field_API_Name__c'), (String) recordData.get('Name'));
                    }

                    Portal_Listing_Mapping__c newRecord = new Portal_Listing_Mapping__c();
                    
                    if (recordData.containsKey('MVEX__Allowed_Field_Datatype__c')) {
                        newRecord.MVEX__Allowed_Field_Datatype__c = (String) recordData.get('MVEX__Allowed_Field_Datatype__c');
                    }
                    if (recordData.containsKey('MVEX__Data_Type__c')) {
                        newRecord.MVEX__Data_Type__c = (String) recordData.get('MVEX__Data_Type__c');
                    }
                    if (recordData.containsKey('MVEX__Listing_Field_API_Name__c')) {
                        newRecord.MVEX__Listing_Field_API_Name__c = (String) recordData.get('MVEX__Listing_Field_API_Name__c');
                    }
                    if (recordData.containsKey('MVEX__Portal_Field_Description__c')) {
                        newRecord.MVEX__Portal_Field_Description__c = (String) recordData.get('MVEX__Portal_Field_Description__c');
                    }
                    if (recordData.containsKey('MVEX__Portal_Field_Example__c')) {
                        newRecord.MVEX__Portal_Field_Example__c = (String) recordData.get('MVEX__Portal_Field_Example__c');
                    }
                    if (recordData.containsKey('MVEX__Portal_Name__c')) {
                        newRecord.MVEX__Portal_Name__c = (String) recordData.get('MVEX__Portal_Name__c');
                    }
                    if (recordData.containsKey('MVEX__Required__c')) {
                        newRecord.MVEX__Required__c = (Boolean) recordData.get('MVEX__Required__c');
                    }
                    if (recordData.containsKey('MVEX__Value_Mapping__c')) {
                        newRecord.MVEX__Value_Mapping__c = (String) recordData.get('MVEX__Value_Mapping__c');
                    }
                    if (recordData.containsKey('Name')) {
                        newRecord.Name = (String) recordData.get('Name');
                    }
                    
                    newRecords.add(newRecord);
                }
                
                if (newRecords.size() > 0 && Portal_Listing_Mapping__c.SObjectType.getDescribe().isCreateable()) {
                    insert newRecords;
                }

                return JSON.serialize(stringMap);
            } else {
                throw new TypeException('Unexpected JSON structure.');
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'CreatePortalListingMappingRecords', 'createPortalRecords', 'Error while creating Portal_Listing_Mapping__c records.');
            return e.getMessage();
        }
    }
}