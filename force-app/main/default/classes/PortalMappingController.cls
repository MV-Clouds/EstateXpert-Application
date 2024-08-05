/**
* Class Name : PortalMappingController
* Test Class : PortalMappingControllerTest
* Created By : Karan Singh
* Last Modified Date : 08/08/2024
* Last Modified By : Karan Singh
* @description : Used in portalMappingComponent and portalMappingLandingPage LWC components
*/
public with sharing class PortalMappingController {

    public class ObjectFieldsWrapper {
        @AuraEnabled public List<PortalDetail__mdt> portalDetailsMetadataRecords;
        @AuraEnabled public List<Portal__c> portalRecords;
    }
    /**
    * Method Name : getPortalRecords
    * @description : Get all the records of Portal__c object.
    * @return List of Portal__c records.
    */
    @AuraEnabled
    public static ObjectFieldsWrapper getPortalRecords(){
        ObjectFieldsWrapper result = new ObjectFieldsWrapper();
        result.portalDetailsMetadataRecords = new List<PortalDetail__mdt>();
        result.portalRecords = new List<Portal__c>();
        try {
            result.portalDetailsMetadataRecords = [SELECT MasterLabel, Logo_URL__c FROM PortalDetail__mdt WITH SECURITY_ENFORCED];
            result.portalRecords = [SELECT Id, endpoint__c, Generator__c, Name, Is_Active__c FROM Portal__c WITH SECURITY_ENFORCED ORDER BY Name];

        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingController', 'getPortalRecords', 'Error while fetching Portal__c records.');
        }
        return result;
    }

    /**
    * Wrapper Class Name : FieldWrapper
    * @description : This Wrapper class used for method name getObjectFields to return Custom Metadata, Custom Setting and Listing fields datas.
    */
    public class FieldWrapper {
        @AuraEnabled
        public List<Map<String, String>> portalMetadataRecords { get; set; }
        @AuraEnabled
        public Set<String> blockfields { get; set; }
        @AuraEnabled
        public List<Map<String, String>> listingFields { get; set; }
    
        public FieldWrapper(List<Map<String, String>> portalMetadataRecords, Set<String> blockfields, List<Map<String, String>> listingFields) {
            this.portalMetadataRecords = portalMetadataRecords;
            this.blockfields = blockfields;
            this.listingFields = listingFields;
        }
    }    

    /**
    * Method Name : getObjectFields
    * @description : Method is used to return Listing object fields, Portal Custom Metadat records and List of Blocked fields for Portal and Listing field mapping.
    * @param portalName String value.
    * @return List of FieldWrapper.
    * Last Update Date : 06/06/2024
    * Updated By : Karan Singh
    * Change Description : Replaced the custom metadata with custom object for portal listing field mapping.
    */
    @AuraEnabled
    public static List<FieldWrapper> getObjectFields(String portalName) {
        try {
            List<FieldWrapper> result = new List<FieldWrapper>();

            List<Map<String, String>> fieldDetails = new List<Map<String, String>>();

            List<Portal_Listing_Mapping__c> portalListingMap ;
            if (portalName != null) {
                portalListingMap = [SELECT Id, Name, Listing_Field_API_Name__c, Portal_Field_Description__c, Portal_Field_Example__c, Required__c, Allowed_Field_Datatype__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: portalName WITH SECURITY_ENFORCED ORDER BY Required__c DESC, Name ASC];
            }

            sObject blockFields = getBlockedFields(portalName);

            Set<String> blockedFields = new Set<String>();
            if (blockFields != null && blockFields.get('MVEX__Fields_Name__c') != null) {
                blockedFields = new Set<String>(((String)blockFields.get('MVEX__Fields_Name__c')).split(';'));
            }

            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get('MVEX__Listing__c').getDescribe();
            Map<String, Schema.SObjectField> allFieldsMap = describeResult.fields.getMap();
            
            List<FieldInfo> fieldsInfoList = new List<FieldInfo>();
            
            for (Schema.SObjectField field : allFieldsMap.values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                fieldsInfoList.add(new FieldInfo(fieldDescribe.getLabel(), fieldDescribe.getName(), fieldDescribe.getType())); // Pass field data type here
            }
            
            fieldsInfoList.sort();
            
            for (FieldInfo fieldInfo : fieldsInfoList) {
                Map<String, String> fieldMap = new Map<String, String>();
                fieldMap.put('label', fieldInfo.label);
                fieldMap.put('apiName', fieldInfo.apiName);
                fieldMap.put('dataType', String.valueOf(fieldInfo.dataType));
                fieldDetails.add(fieldMap);
            }

            List<Map<String, String>> portalMetadataDetails = new List<Map<String, String>>();
            for (Portal_Listing_Mapping__c record : portalListingMap) {
                Map<String, String> metadataMap = new Map<String, String>();
                metadataMap.put('Id', (String)record.get('Id'));
                metadataMap.put('Name', (String)record.get('Name'));
                metadataMap.put('MVEX__Listing_Field_API_Name__c', (String)record.get('MVEX__Listing_Field_API_Name__c'));
                metadataMap.put('MVEX__Portal_Field_Description__c', (String)record.get('MVEX__Portal_Field_Description__c'));
                metadataMap.put('MVEX__Portal_Field_Example__c', (String)record.get('MVEX__Portal_Field_Example__c'));
                metadataMap.put('MVEX__Allowed_Field_Datatype__c', (String)record.get('MVEX__Allowed_Field_Datatype__c'));

                Boolean requiredField = (Boolean)record.get('MVEX__Required__c');
                metadataMap.put('MVEX__Required__c', requiredField == true ? String.valueOf(requiredField) : '');

                portalMetadataDetails.add(metadataMap);
            }

            result.add(new FieldWrapper(portalMetadataDetails, blockedFields, fieldDetails));

            return result;
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingController', 'getObjectFields', 'Error while fetching Portal__c records.');
            return null;
        }
    }

    /**
    * Method Name : getBlockedFields
    * @description : Method is used to get the blocked fields.
    * @param portalName: Name of the Portal.
    * @return sObject: Returns the custom setting record of the specified type and name.
    */
    public static sObject getBlockedFields(String portalName) {
        if (portalName == 'Propertyfinder') {
            return BFFPF__c.getOrgDefaults();
        } else if (portalName == 'Zoopla') {
            return BFFZ__c.getOrgDefaults();
        } else if (portalName == 'Bayut') {
            return BFFB__c.getOrgDefaults();
        } else if (portalName == 'Rightmove') {
            return BFFR__c.getOrgDefaults();
        } else if (portalName == 'Dubizzle') {
            return BFFB__c.getOrgDefaults();
        } else {
            return null;
        }
    }

    /**
    * Method Name : compareTo
    * @description : Compares this FieldInfo object with the specified FieldInfo object for order based on the label property.
    * @return Integer: A negative integer, zero, or a positive integer if the label of this FieldInfo object is less than, equal to, or greater than the label of the specified FieldInfo object, respectively.
    */
    public class FieldInfo implements Comparable {
        public String label;
        public String apiName;
        public Schema.DisplayType dataType; // Change dataType variable type
        
        public FieldInfo(String label, String apiName, Schema.DisplayType dataType) { // Update constructor to include dataType of type Schema.DisplayType
            this.label = label;
            this.apiName = apiName;
            this.dataType = dataType;
        }
        
        public Integer compareTo(Object other) {
            FieldInfo otherFieldInfo = (FieldInfo) other;
            return this.label.compareTo(otherFieldInfo.label);
        }
    }

    /**
    * Method Name : saveChangedFields
    * @description : Method is used to save the Portal and Listing field mapping in custom metadata records.
    * @param changedFields List<Map<String, String>> value.
    * @param jsonList String value.
    * @param portalName String value.
    * @return deploy request Id.
    * Last Update Date : 07/06/2024
    * Updated By : Karan Singh
    * Change Description : Made the required changes for saving the PortalListingMapping records updates.
    */
    @AuraEnabled
    public static string saveChangedFields(List<Map<String, String>> changedFields, String jsonList, String portalName) {
        try {
            // Check object-level permissions
            if (!Portal_Listing_Mapping__c.SObjectType.getDescribe().isAccessible() || 
                !Portal_Listing_Mapping__c.SObjectType.getDescribe().isUpdateable()) {
                throw new AuraHandledException('Insufficient access rights on object: Portal_Listing_Mapping__c');
            }

            // Check field-level permissions
            if (!Schema.sObjectType.Portal_Listing_Mapping__c.fields.Listing_Field_API_Name__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient access rights on field: Listing_Field_API_Name__c');
            }

            List<Portal_Listing_Mapping__c> recordsToUpdate = new List<Portal_Listing_Mapping__c>();

            for (Map<String, String> changedField : changedFields) {
                Portal_Listing_Mapping__c record = new Portal_Listing_Mapping__c();
                record.Id = changedField.get('Id');
                record.Listing_Field_API_Name__c = changedField.get('MVEX__Listing_Field_API_Name__c');

                recordsToUpdate.add(record);
            }

            if (!recordsToUpdate.isEmpty()) {
                update recordsToUpdate;

                List<Portal__c> portalToUpdate = [SELECT Id, Field_Mapping__c, Generator__c FROM Portal__c WHERE Generator__c =: portalName WITH SECURITY_ENFORCED LIMIT 1];
                if (!portalToUpdate.isEmpty() && Portal__c.SObjectType.getDescribe().isUpdateable()) {

                    portalToUpdate[0].Field_Mapping__c = jsonList;

                    update portalToUpdate;
                }
            }

            return 'Success';
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingController', 'saveChangedFields', 'Error while saving Portal_Listing_Mapping__c records.');
            return null;
        }
    }

    /**
    * Method Name : portalAction
    * @description : Method is used to active, deactive and delete the portal records.
    * @param portalId String value.
    * @param actionName String value.
    * @return status.
    */
    @AuraEnabled
    public static string portalAction(String portalId, String actionName) {
        try {
            List<Portal__c> portalAct;

            if (Portal__c.SObjectType.getDescribe().isAccessible() && 
                Portal__c.SObjectType.getDescribe().isUpdateable() &&
                Portal__c.SObjectType.getDescribe().isDeletable()) {
                    if (portalId != null) {
                        portalAct = [SELECT Id, Is_Active__c FROM Portal__c WHERE Id =: portalId WITH SECURITY_ENFORCED];
                        if (portalAct.isEmpty()) {
                            return 'Portal not found.';
                        }
                    } else {
                        return 'Portal is missing.';
                    }
            } else {
                return 'Portal is not accessible.';
            }

            Portal__c portal = portalAct[0];
            
            switch on actionName {
                when 'deactivate' {
                    return updatePortalStatus(portal, false, 'deactivated');
                }
                when 'activate' {
                    return updatePortalStatus(portal, true, 'activated');
                }
                when 'delete' {
                    return deletePortal(portal);
                }
                when else {
                    return 'Invalid action.';
                }
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingController', 'portalAction', 'Error while performing Portal__c record actions.');
            return null;
        }
    }

    /**
    * Method Name : updatePortalStatus
    * @description : Method is used to update the Is_Active__c field value.
    * @param portal Portal__c value.
    * @param status Boolean value.
    * @param action String value.
    * @return update status.
    */
    private static String updatePortalStatus(Portal__c portal, Boolean status, String action) {
        portal.Is_Active__c = status;
        update portal;
        return action;
    }

    /**
    * Method Name : updatePortalStatus
    * @description : Method is used for deleting the Portal__c object record.
    * @param portal Portal__c value.
    * @return delete status.
    */
    private static String deletePortal(Portal__c portal) {
        delete portal;
        return 'deleted';
    }

    /**
    * Wrapper Class Name : PropertyPortalWrapper
    * @description : This Wrapper class used for method name savePropertyPortalRecord.
    */
    public class PropertyPortalWrapper {
        @AuraEnabled public String name;
        @AuraEnabled public String portalname;
        @AuraEnabled public String getPortalIconUrl;
        @AuraEnabled public String certificate;
        @AuraEnabled public String branch_reference;
        @AuraEnabled public String branch_name;
        @AuraEnabled public String street_name;
        @AuraEnabled public String town_or_city;
        @AuraEnabled public String postal_code;
        @AuraEnabled public String country_code;
        @AuraEnabled public String is_test_portal;
        @AuraEnabled public String differentiator_values;
    }

    /**
    * Method Name : savePropertyPortalRecord
    * @description : Method is used for deleting the Portal__c object record.
    * @param portalWrapper propertyPortalWrapper value.
    * @param portalName String value.
    */
    @AuraEnabled
    public static String savePropertyPortalRecord(String portalWrapper, String portalName) {
        try {
            if(portalName == null || portalName == '') {
                return 'Portal name is missing.';
            }

            PropertyPortalWrapper wrapper = (PropertyPortalWrapper)JSON.deserialize(portalWrapper, PropertyPortalWrapper.class);
            List<Portal_Listing_Mapping__c> portalListingMaps = [SELECT Id, Listing_Field_API_Name__c, Name FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: portalName AND Listing_Field_API_Name__c != null];
            Map<String, String> jsonBodyMap = new Map<String, String>();
            String jsonBody = '';
            if(!portalListingMaps.isEmpty()) {
                for (Portal_Listing_Mapping__c mapping : portalListingMaps) {
                    jsonBodyMap.put(mapping.Listing_Field_API_Name__c, mapping.Name);
                }
                jsonBody = JSON.serialize(jsonBodyMap);
            } else {
                jsonBody = CreatePortalListingMappingRecords.createPortalRecords(portalName);
            }

            System.debug('jsonBody: ' + jsonBody);
            
            String portalId;
            if (Portal__c.SObjectType.getDescribe().isAccessible() && Portal__c.SObjectType.getDescribe().isCreateable()) {
                Portal__c newportal = new Portal__c();
                newportal.Name = wrapper.name;
                newportal.Endpoint__c = wrapper.getPortalIconUrl;
                newportal.Is_Active__c = true;
                newportal.Portal_Configuration__c = portalWrapper;
                newportal.Field_Mapping__c = jsonBody;
                newportal.Generator__c = wrapper.portalname == 'Property Finder' ? 'Propertyfinder' : wrapper.portalname;

                insert newportal;

                portalId = newportal.Id;
            }

            if (wrapper.portalname == 'Zoopla') {
                ZooplaIntegration.zooplaCreateAndUpdateBranch(portalWrapper, portalId);
            }

            return 'success';
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingController', 'savePropertyPortalRecord', 'Error while saving Portal__c record.');
            return e.getMessage();
        }
    }

    /**
    * Wrapper Class Name : FieldList
    * @description : This Wrapper class used for method name getAllCustomFields.
    */
    public class FieldList {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }
        
        public FieldList(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    /**
    * Method Name : getAllCustomFields
    * @description : Method is used for fetching all the custom fields from the Listing__c object.
    * @return List<FieldList> value.
    */
    @AuraEnabled
    public static List<FieldList> getAllCustomFields() {
        List<FieldList> customFields = new List<FieldList>();

        try {
            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get('MVEX__Listing__c').getDescribe();

            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();

            for (Schema.SObjectField field : fieldsMap.values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                
                if (fieldDescribe.isCustom()) {
                    String fieldLabel = fieldDescribe.getLabel();
                    String fieldApiName = fieldDescribe.getName();
                    customFields.add(new FieldList(fieldLabel, fieldApiName));
                }
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingController', 'getAllCustomFields', 'Error while fetching custom fields from Listing__c object.');
        }

        return customFields;
    }
    
}