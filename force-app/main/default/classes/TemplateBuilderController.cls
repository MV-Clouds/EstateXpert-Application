public with sharing class TemplateBuilderController {

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

    @AuraEnabled(cacheable=true)
    public static Template__c getTemplateContentById(String templateId) {
        if (!Schema.sObjectType.Template__c.fields.Template_Body__c.isAccessible()) {
            throw new AuraHandledException('No access to Template_Body__c field.');
        }
        
        Template__c template = [SELECT Label__c, Template_Body__c FROM Template__c WHERE Id = :templateId LIMIT 1];
        return template;
    }
    

    @AuraEnabled
    public static void saveTemplate(String objectName, String templateName, String templateContent) {
        if (!Schema.sObjectType.Template__c.isCreateable()) {
            throw new AuraHandledException('No create access to Template__c object.');
        }
        if (!Schema.sObjectType.Template__c.isUpdateable()) {
            throw new AuraHandledException('No update access to Template__c object.');
        }
        
        Template__c template;
        try {
            template = [SELECT Id, Label__c	, Template_Body__c FROM Template__c WHERE Object_Name__c = :objectName AND Label__c = :templateName LIMIT 1];
        } catch (Exception e) {
            template = null;
        }
        
        if (template == null) {
            template = new Template__c(
                Label__c = templateName,
                Template_Body__c = templateContent,
                Object_Name__c = objectName
            );
            insert template;
        } else {
            template.Template_Body__c = templateContent;
            update template;
        }
    }

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

    @AuraEnabled
    public static List<Template__c> getTemplatesForObject(String objectName) {
        if (!Schema.sObjectType.Template__c.isAccessible()) {
            throw new AuraHandledException('No access to Template__c object.');
        }
        
        return [SELECT Id ,Label__c , Template_Body__c FROM Template__c WHERE Object_Name__c = :objectName];
    }


    @AuraEnabled
    public static void deleteTemplate(String templateId) {

        Template__c template = [SELECT Id FROM Template__c WHERE Id = :templateId LIMIT 1];
        if (template != null&& Schema.sObjectType.Template__c.isAccessible()) {
            delete template;
        }
    }
}