/** 
* Class Name: TemplateBuilderController 
* @description: Used in templatebuilder , custommodal , templatemodalchild component
* Date: 11/06/2024 
* Created By: Rachit Shah 
*/ 

public with sharing class TemplateBuilderController {

    /** 
    * Method Name: getAllFieldNames
    * @description: Retrieves all field names of a given sObject.
    * @param objectName Name of the sObject.
    * @return List of field names.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 

    @AuraEnabled(cacheable=true)
    public static List<String> getAllFieldNames(String objectName) {
        List<String> fieldNames = new List<String>();
        
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
        if (!sObjectType.getDescribe().isAccessible()) {
            throw new AuraHandledException('No access to object: ' + objectName);
        }
        
        Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
        for(String fieldName : fields.keySet()) {
            fieldNames.add(fieldName);
        }
        fieldNames.sort();
        
        return fieldNames;
    }

    /** 
    * Method Name: getTemplateContentById
    * @description: Retrieves the content of a Template__c record by its Id.
    * @param templateId Id of the template.
    * @return Template__c record.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 

    @AuraEnabled
    public static Template__c getTemplateContentById(String templateId) {
        if (!Schema.sObjectType.Template__c.fields.Template_Body__c.isAccessible()) {
            throw new AuraHandledException('No access to Template_Body__c field.');
        }
        
        Template__c template = [SELECT Label__c, Template_Body__c FROM Template__c WHERE Id = :templateId WITH SECURITY_ENFORCED LIMIT 1] ;
        return template;
    }

    /** 
    * Method Name: saveTemplate
    * @description: Saves or updates a Template__c record based on the provided Id.
    * @param template Template__c record to save or update.
    * @param recId Id of the record to update. If null or empty, a new record will be created.
    * @return void.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 

    @AuraEnabled
    public static void saveTemplate(Template__c template, String recId) {
        try {
            if (recId != null && recId != '') {
                if (Schema.sObjectType.Template__c.fields.Object_Name__c.isUpdateable() &&
                    Schema.sObjectType.Template__c.fields.Label__c.isUpdateable() &&
                    Schema.sObjectType.Template__c.fields.Template_Body__c.isUpdateable() &&
                    Schema.sObjectType.Template__c.fields.Description__c.isUpdateable() &&
                    Schema.sObjectType.Template__c.fields.Template_Type__c.isUpdateable()) {
                    
                    Template__c existingTemplate = [SELECT Id, Object_Name__c, Label__c, Template_Body__c, Description__c 
                                                    FROM Template__c WHERE Id = :recId WITH SECURITY_ENFORCED LIMIT 1];
                    
                    existingTemplate.Object_Name__c = template.Object_Name__c;
                    existingTemplate.Label__c = template.Label__c;
                    existingTemplate.Template_Body__c = template.Template_Body__c;
                    existingTemplate.Description__c = template.Description__c;
                    existingTemplate.Template_Type__c = template.Template_Type__c;
                    System.debug('existingTemplate ==> ' + existingTemplate);
                    update existingTemplate;
                } else {
                    throw new AuraHandledException('No access to update fields on Template__c.');
                }
            } else {
                if (Schema.sObjectType.Template__c.fields.Object_Name__c.isCreateable() &&
                    Schema.sObjectType.Template__c.fields.Label__c.isCreateable() &&
                    Schema.sObjectType.Template__c.fields.Template_Body__c.isCreateable() &&
                    Schema.sObjectType.Template__c.fields.Description__c.isCreateable() &&
                    Schema.sObjectType.Template__c.fields.Template_Type__c.isCreateable()) {
                    
                    insert template;
                } else {
                    throw new AuraHandledException('No access to create fields on Template__c.');
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error saving template: ' + e.getMessage());
        }
    }

    /** 
    * Method Name: getAllObjectNames
    * @description: Retrieves all standard sObject names.
    * @return List of standard sObject names.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 

    @AuraEnabled(cacheable=true)
    public static List<String> getAllObjectNames() {
        List<String> objectNames = new List<String>();
        
        List<Schema.SObjectType> objectTypes = Schema.getGlobalDescribe().Values();
        for(Schema.SObjectType objectType : objectTypes) {
            Schema.DescribeSObjectResult objResult = objectType.getDescribe();
            if(!objResult.isCustom() && !objResult.isCustomSetting() && !objResult.isDeprecatedAndHidden()) {
                objectNames.add(objResult.getName());
            }
        }
        objectNames.sort();
        
        return objectNames;
    }

    /** 
    * Method Name: getTemplateTypePicklistValues
    * @description: Retrieves the picklist values for the Template_Type__c field on Template__c.
    * @return List of picklist values.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 

    @AuraEnabled(cacheable=true)
    public static List<String> getTemplateTypePicklistValues() {
        Schema.DescribeFieldResult fieldResult = Template__c.Template_Type__c.getDescribe();
        List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
        
        List<String> picklistValueStrings = new List<String>();
        for(Schema.PicklistEntry picklistEntry : picklistValues) {
            picklistValueStrings.add(picklistEntry.getValue());
        }
        
        return picklistValueStrings;
    }

    /** 
    * Method Name: deleteTemplate
    * @description: Deletes a Template__c record by its Id.
    * @param templateId Id of the template to delete.
    * @return void.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 

    @AuraEnabled
    public static void deleteTemplate(String templateId) {

        Template__c template = [SELECT Id FROM Template__c WHERE Id = :templateId WITH SECURITY_ENFORCED LIMIT 1];

        if (Schema.sObjectType.Template__c.isDeletable() && template != null) {
            database.delete(template);
        }
    }

    /** 
    * Method Name: getTemplates
    * @description: Retrieves all Template__c records.
    * @return List of Template__c records.
    * Date: 11/06/2024 
    * Created By: Rachit Shah 
    */ 
    
    @AuraEnabled
    public static List<Template__c> getTemplates() {
        List<Template__c> templates = [SELECT Id, Name, Label__c , Object_Name__c , Status__c, Template_Body__c	, Template_Type__c	, Description__c,CreatedDate  FROM Template__c WITH SECURITY_ENFORCED];
        return templates;
    }
}

