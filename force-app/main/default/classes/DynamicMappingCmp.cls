/**
* Class Name : DynamicMappingCmp
* Date : 28-07-2024
* Created By : Vyom Soni
* Last Modified Date : 03-07-2024
* Last Modified By : Vyom Soni
* @description : Used in the mapFields lwc component
*/
public with sharing class DynamicMappingCmp {
        
    /**
   * Method Name : getObjectFields
   * @description : get field data using schema builder.
   * @param ObjectApIName String value.
   * @return List of mappings.
   */
   @AuraEnabled
   public static List<Map<String, String>> getObjectFields(String objectName) {
       List<Map<String, String>> fieldDetails = new List<Map<String, String>>();    
   
       // Query Mapping_Metadata__mdt
       Dynamicmapping__mdt	 metaData = [SELECT Mapping_String__c, Autometic_Sync__c, BlockedFields__c FROM Dynamicmapping__mdt	 WITH SECURITY_ENFORCED LIMIT 1];
   
       Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objectName).getDescribe();
   
       // Get all fields for the object
       Map<String, Schema.SObjectField> allFieldsMap = describeResult.fields.getMap();
    
       // Get unwritable fields
       Set<String> unwritableFields = new Set<String>();
       for (String fieldName : allFieldsMap.keySet()) {
           if (!allFieldsMap.get(fieldName).getDescribe().isUpdateable()) {
               unwritableFields.add(fieldName);
           }
       }

       System.debug('unwritableFields ==>' + unwritableFields);
       System.debug('unwritableFields lenghth ==> ' + unwritableFields.size());

       allFieldsMap.keySet().removeAll(unwritableFields);

       Set<String> blockedFields = new Set<String>();
        if (metaData.BlockedFields__c != null) {
            blockedFields.addAll(new List<String>(metaData.BlockedFields__c.split(';')));
        }
        System.debug('Blocked Fields: ' + blockedFields);
        allFieldsMap.keySet().removeAll(blockedFields);
   
       for (Schema.SObjectField field : allFieldsMap.values()) {
           Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
   
           Map<String, String> fieldMap = new Map<String, String>();
           fieldMap.put('label', fieldDescribe.getLabel());
           fieldMap.put('apiName', fieldDescribe.getName());
   
           // Convert data type enum value to string
           String dataType = fieldDescribe.getType().name();
           fieldMap.put('dataType', dataType);
   
           fieldDetails.add(fieldMap);
       }
   
       System.debug('fieldDetails ==>' + fieldDetails);
       System.debug('fieldDetails lenghth ==> ' + fieldDetails.size());
       return fieldDetails;
   }
   
   
   /**
   * Method Name : saveMappings
   * @description : save mapping in the of the fields.
   * @param mappingsData String value.
   * @param checkboxValue Boolean value.
   */
   @AuraEnabled
   public static void saveMappings( String mappingsData ,Boolean checkboxValue,String logicalCondition){

       //fetch records
       List<Dynamicmapping__mdt	> metaList = [Select MasterLabel, DeveloperName, Mapping_String__c,Logical_Condition__c From Dynamicmapping__mdt	 WITH SECURITY_ENFORCED];

       System.debug('metaList ==> ' + metaList);
       
       //instance of the record
       Metadata.CustomMetadata mdata = new Metadata.CustomMetadata();
       mdata.fullName = 'Dynamicmapping__mdt.'+ metaList[0].DeveloperName;
       mdata.label = metaList[0].MasterLabel;

       System.debug('metaList ==> ' + mdata);
       
       //instance of the value
       Metadata.CustomMetadataValue instance = new Metadata.CustomMetadataValue();
       instance.field = 'Mapping_String__c';
       instance.value = mappingsData;
       //adding the value to the record
       mdata.values.add(instance);

       System.debug('instance ==> ' + instance);


       Metadata.CustomMetadataValue instance2 = new Metadata.CustomMetadataValue();
       instance2.field = 'Autometic_Sync__c';
       instance2.value = checkboxValue;
       //adding the value to the record
       mdata.values.add(instance2);

       Metadata.CustomMetadataValue instance3 = new Metadata.CustomMetadataValue();
       instance3.field = 'Logical_Condition__c';
       instance3.value = logicalCondition;
       //adding the value to the record
       mdata.values.add(instance3);

       System.debug('instance3 ==> ' + instance3);

       //instance of the container
       Metadata.DeployContainer container = new Metadata.DeployContainer();
       container.addMetadata(mdata);

       System.debug('container ==> ' + container);
       
       //enqueue deployment to the salesforce org
       Metadata.Operations.enqueueDeployment(container, null);

       System.debug('metaList ==> ' + metaList);

       
    }

     /**
   * Method Name : getMetadata
   * @description : get the fieds pair stirng from the metadata.
   * @return List of string.
   */
    @AuraEnabled
    public static List<String> getMetadata() {
        List<String> metadataValues = new List<String>();
    
        // Fetch records
        List<Dynamicmapping__mdt> metadataRecords = [SELECT Mapping_String__c, Autometic_Sync__c,Logical_Condition__c FROM Dynamicmapping__mdt WITH SECURITY_ENFORCED LIMIT 1];
        
        // Check if records exist
        if (!metadataRecords.isEmpty()) {
            Dynamicmapping__mdt	 metadataRecord = metadataRecords[0];
            
            // Add field values to the list
            metadataValues.add(metadataRecord.Mapping_String__c);
            metadataValues.add(String.valueOf(metadataRecord.Autometic_Sync__c));
            metadataValues.add(String.valueOf(metadataRecord.Logical_Condition__c));
        }
        
        return metadataValues;
        
    }
}