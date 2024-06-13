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
    public static String saveTemplate(Template__c template, String recId) {
        try {
            if (recId != null && recId != '') {
                // Query the existing template record
                Template__c existingTemplate = [SELECT Id, Object_Name__c, Label__c, Template_Body__c, Description__c 
                                                FROM Template__c WHERE Id = :recId LIMIT 1];
                
                existingTemplate.Object_Name__c = template.Object_Name__c;
                existingTemplate.Label__c = template.Label__c;
                existingTemplate.Template_Body__c = template.Template_Body__c;
                existingTemplate.Description__c = template.Description__c;
                System.debug('existingTemplate ==> ' + existingTemplate);
                update existingTemplate;

                return existingTemplate.Id;
            } else {
                insert template;

                return template.Id;
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error saving template: ' + e.getMessage());
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

    @AuraEnabled(cacheable=true)
    public static List<Template__c> getTemplates() {
        List<Template__c> templates = [SELECT Id, Name, Label__c , Object_Name__c , Status__c, Template_Body__c	, Template_Type__c	, Description__c,CreatedDate  FROM Template__c];
        return templates;
    }
}

