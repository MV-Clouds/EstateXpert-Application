/**
* Class Name : PortalMappingController
* Test Class : Pending
* Created By : Karan Singh
* Last Modified Date : 06/06/2024
* Last Modified By : Karan Singh
* @description : Used in portalMappingComponent and portalMappingLandingPage LWC components
*/
public with sharing class PortalMappingController {

    /**
    * Method Name : getPortalRecords
    * @description : Get all the records of Portal__c object.
    * @return List of Portal__c records.
    */
    @AuraEnabled
    public static List<Portal__c> getPortalRecords(){
        try {

            List<Portal__c> listOfPortalRecords = [SELECT Id, Endpoint__c, Generator__c, Name, Is_Active__c FROM Portal__c WITH SECURITY_ENFORCED ORDER BY Name];
            return listOfPortalRecords;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
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
                portalListingMap = [SELECT Id, Name, Listing_Field_API_Name__c, Portal_Field_Description__c, Portal_Field_Example__c, Required__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: portalName WITH SECURITY_ENFORCED ORDER BY Name];
            }

            Blocked_Fields__c blockFields = Blocked_Fields__c.getOrgDefaults();

            Set<String> blockedFields = new Set<String>(blockFields.Fields_Name__c.split(';'));

            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get('Listing__c').getDescribe();
            Map<String, Schema.SObjectField> allFieldsMap = describeResult.fields.getMap();
            
            List<FieldInfo> fieldsInfoList = new List<FieldInfo>();
            
            for (Schema.SObjectField field : allFieldsMap.values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                fieldsInfoList.add(new FieldInfo(fieldDescribe.getLabel(), fieldDescribe.getName()));
            }
            
            fieldsInfoList.sort();
            
            for (FieldInfo fieldInfo : fieldsInfoList) {
                Map<String, String> fieldMap = new Map<String, String>();
                fieldMap.put('label', fieldInfo.label);
                fieldMap.put('apiName', fieldInfo.apiName);
                fieldDetails.add(fieldMap);
            }

            List<Map<String, String>> portalMetadataDetails = new List<Map<String, String>>();
            for (Portal_Listing_Mapping__c record : portalListingMap) {
                Map<String, String> metadataMap = new Map<String, String>();
                metadataMap.put('Id', (String)record.get('Id'));
                metadataMap.put('Name', (String)record.get('Name'));
                metadataMap.put('Listing_Field_API_Name__c', (String)record.get('Listing_Field_API_Name__c'));
                metadataMap.put('Portal_Field_Description__c', (String)record.get('Portal_Field_Description__c'));
                metadataMap.put('Portal_Field_Example__c', (String)record.get('Portal_Field_Example__c'));

                Boolean requiredField = (Boolean)record.get('Required__c');
                metadataMap.put('Required__c', requiredField == true ? String.valueOf(requiredField) : '');

                portalMetadataDetails.add(metadataMap);
            }

            result.add(new FieldWrapper(portalMetadataDetails, blockedFields, fieldDetails));

            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
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
        
        public FieldInfo(String label, String apiName) {
            this.label = label;
            this.apiName = apiName;
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
    * @return deploy request Id.
    * Last Update Date : 07/06/2024
    * Updated By : Karan Singh
    * Change Description : Made the required changes for saving the PortalListingMapping records updates.
    */
    @AuraEnabled
    public static string saveChangedFields(List<Map<String, String>> changedFields) {
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
                record.Listing_Field_API_Name__c = changedField.get('Listing_Field_API_Name__c');

                recordsToUpdate.add(record);
            }

            if (!recordsToUpdate.isEmpty()) {
                update recordsToUpdate;
            }

            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
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
            throw new AuraHandledException(e.getMessage());
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
    * Method Name : savePropertyPortalRecord
    * @description : Method is used for deleting the Portal__c object record.
    * @param portalWrapper propertyPortalWrapper value.
    */
    @AuraEnabled
    public static void savePropertyPortalRecord(String portalWrapper) {
        PropertyPortalWrapper wrapper = (PropertyPortalWrapper)JSON.deserialize(portalWrapper, PropertyPortalWrapper.class);
        
        if (Portal__c.SObjectType.getDescribe().isAccessible() && Portal__c.SObjectType.getDescribe().isCreateable()) {
            Portal__c newportal = new Portal__c();
            newportal.Name = wrapper.title;
            newportal.Endpoint__c = wrapper.getPortalIconUrl;
            newportal.Is_Active__c = true;
            newportal.Generator__c = wrapper.portalname == 'Property Finder' ? 'Propertyfinder' : wrapper.portalname;

            insert newportal;
        }
    
    }

    /**
    * Wrapper Class Name : PropertyPortalWrapper
    * @description : This Wrapper class used for method name savePropertyPortalRecord.
    */
    public class PropertyPortalWrapper {
        @AuraEnabled public String title;
        @AuraEnabled public String email;
        @AuraEnabled public String url;
        @AuraEnabled public String externalImage;
        @AuraEnabled public String portalname;
        @AuraEnabled public String getPortalIconUrl;
    }

}