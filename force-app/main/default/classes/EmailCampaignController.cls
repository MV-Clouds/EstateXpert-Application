public with sharing class EmailCampaignController {
    @AuraEnabled(cacheable=true)
    public static List<Email_Campaign_Template__c> getEmailCampaignTemplates() {

        List<Email_Campaign_Template__c> templates = [SELECT Id, Label__c, Last_Usage_Date__c, Email_Campaign__c, Status__c 
                                                      FROM Email_Campaign_Template__c WITH SECURITY_ENFORCED ];

        return templates;
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, Name FROM Contact];
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getDateFieldsForPicklist() {
        List<Map<String, String>> options = new List<Map<String, String>>();

        // Get all date fields dynamically using Schema
        Map<String, Schema.SObjectField> contactFields = Schema.SObjectType.Contact.fields.getMap();
        
        // Exclude audit fields
        Set<String> auditFieldsToExclude = new Set<String>{'CreatedDate', 'LastModifiedDate', 'SystemModstamp'};
        
        for (String fieldName : contactFields.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = contactFields.get(fieldName).getDescribe();
            if (fieldDescribe.getType() == Schema.DisplayType.Date && !auditFieldsToExclude.contains(fieldName)) {
                options.add(new Map<String, String>{
                    'label' => fieldDescribe.getLabel(),
                    'value' => fieldName
                });
            }
        }
        
        // System.debug('options ==> ' + options);
        
        return options;
    }
}
