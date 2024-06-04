/**
* Class Name : PortalMappingController
* Test Class : Pending
* Created By : Karan Singh
* Last Modified Date : 03/06/2024
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

            List<Portal__c> listOfPortalRecords = [SELECT Id, endpoint__c, generator__c, Name, isActive__c FROM Portal__c WITH SECURITY_ENFORCED ORDER BY Name];
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
    */
    @AuraEnabled
    public static List<FieldWrapper> getObjectFields(String portalName) {
        List<FieldWrapper> result = new List<FieldWrapper>();

        List<Map<String, String>> fieldDetails = new List<Map<String, String>>();

        List<SObject> portalMetadata;

        if (portalName == 'Property_Finder__mdt') {
            portalMetadata = [SELECT MasterLabel, Listing_Field_API_Name__c, Portal_Field_Description__c, Portal_Field_Example__c, Required__c FROM Property_Finder__mdt WITH SECURITY_ENFORCED ORDER BY MasterLabel];
        } else if (portalName == 'Bayut__mdt') {
            portalMetadata = [SELECT MasterLabel, Listing_Field_API_Name__c, Portal_Field_Description__c, Portal_Field_Example__c, Required__c FROM Bayut__mdt WITH SECURITY_ENFORCED ORDER BY MasterLabel];
        } else if (portalName == 'Dubizzle__mdt') {
            portalMetadata = [SELECT MasterLabel, Listing_Field_API_Name__c, Portal_Field_Description__c, Portal_Field_Example__c, Required__c FROM Dubizzle__mdt WITH SECURITY_ENFORCED ORDER BY MasterLabel];
        } 
    
        Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get('Listing__c').getDescribe();

        Map<String, Schema.SObjectField> allFieldsMap = describeResult.fields.getMap();

        Blocked_Fields__c blockFields = Blocked_Fields__c.getOrgDefaults();

        Set<String> blockedFields = new Set<String>(blockFields.Fields_Name__c.split(';'));
    
        for (Schema.SObjectField field : allFieldsMap.values()) {
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            Map<String, String> fieldMap = new Map<String, String>();
            fieldMap.put('label', fieldDescribe.getLabel());
            fieldMap.put('apiName', fieldDescribe.getName());
            fieldDetails.add(fieldMap);
        }

        List<Map<String, String>> portalMetadataDetails = new List<Map<String, String>>();
        for (SObject record : portalMetadata) {
            Map<String, String> metadataMap = new Map<String, String>();
            metadataMap.put('MasterLabel', (String)record.get('MasterLabel'));
            metadataMap.put('Listing_Field_API_Name__c', (String)record.get('Listing_Field_API_Name__c'));
            metadataMap.put('Portal_Field_Description__c', (String)record.get('Portal_Field_Description__c'));
            metadataMap.put('Portal_Field_Example__c', (String)record.get('Portal_Field_Example__c'));

            Boolean requiredField = (Boolean)record.get('Required__c');
            metadataMap.put('Required__c', requiredField == true ? String.valueOf(requiredField) : '');

            portalMetadataDetails.add(metadataMap);
        }

        result.add(new FieldWrapper(portalMetadataDetails, blockedFields, fieldDetails));

        return result;
    }

    /**
    * Method Name : saveChangedFields
    * @description : Method is used to save the Portal and Listing field mapping in custom metadata records.
    * @param changedFields List<Map<String, String>> value.
    * @return deploy request Id.
    */
    @AuraEnabled
    public static string saveChangedFields(List<Map<String, String>> changedFields) {
        List<Metadata.CustomMetadata> metadataList = new List<Metadata.CustomMetadata>();

        for (Map<String, String> changedField : changedFields) {
            System.debug('changedField-->'+changedField);
            Metadata.CustomMetadata customMetadata = new Metadata.CustomMetadata();
            customMetadata.fullName = 'Property_Finder__mdt.' + changedField.get('MasterLabel');
            customMetadata.label = changedField.get('MasterLabel');

            List<Metadata.CustomMetadataValue> values = new List<Metadata.CustomMetadataValue>();

            Metadata.CustomMetadataValue listingFieldValue = new Metadata.CustomMetadataValue();
            listingFieldValue.field = 'Listing_Field_API_Name__c';
            listingFieldValue.value = changedField.get('Listing_Field_API_Name__c');
            values.add(listingFieldValue);

            customMetadata.values = values;

            metadataList.add(customMetadata);
        }

        if (!metadataList.isEmpty()) {
            Metadata.DeployContainer container = new Metadata.DeployContainer();
            for (Metadata.CustomMetadata metadata : metadataList) {
                container.addMetadata(metadata);
            }

            System.debug('container-->'+container);
            Id deployRequestId = Metadata.Operations.enqueueDeployment(container, new HandleResultCallback());
            return deployRequestId;
        }

        return null;
    }
    
    public class HandleResultCallback implements Metadata.DeployCallback {
        public void handleResult(Metadata.DeployResult result, Metadata.DeployCallbackContext context) {
            if(result.status == Metadata.DeployStatus.SUCCEEDED) {
                System.debug('Deployment succeeded: ' + result);
            } else {
                System.debug('Deployment failed: ' + result.errorMessage);
            }
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
                        portalAct = [SELECT Id, isActive__c FROM Portal__c WHERE Id =: portalId WITH SECURITY_ENFORCED];
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
    * @description : Method is used to update the isActive__c field value.
    * @param portal Portal__c value.
    * @param status Boolean value.
    * @param action String value.
    * @return update status.
    */
    private static String updatePortalStatus(Portal__c portal, Boolean status, String action) {
        portal.isActive__c = status;
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

}