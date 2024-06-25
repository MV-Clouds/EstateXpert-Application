public with sharing class EmailCampaignController {
    @AuraEnabled(cacheable=true)
    public static List<Marketing_Campaign__c> getEmailCampaignTemplates() {

        List<Marketing_Campaign__c> templates = [SELECT Id, Label__c, From_Name__c, From_Address__c, Sender_Mode__c,Is_Marketing_Campaign_Template__c FROM Marketing_Campaign__c WHERE Is_Marketing_Campaign_Template__c = true WITH SECURITY_ENFORCED ];

        return templates;
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, Name FROM Contact WITH SECURITY_ENFORCED ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getDateFieldsForPicklist() {
        List<Map<String, String>> options = new List<Map<String, String>>();
    
        Map<String, Schema.SObjectField> contactFields = Schema.SObjectType.Contact.fields.getMap();
        
        Set<String> auditFieldsToExclude = new Set<String>{
            'CreatedDate', 'LastModifiedDate', 'SystemModstamp', 'LastActivityDate', 'LastReferencedDate', 'LastViewedDate'
        };
        
        for (String fieldName : contactFields.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = contactFields.get(fieldName).getDescribe();
            if (fieldDescribe.getType() == Schema.DisplayType.Date && !auditFieldsToExclude.contains(fieldName)) {
                options.add(new Map<String, String>{
                    'label' => fieldDescribe.getLabel(),
                    'value' => fieldName
                });
            }
        }
                
        return options;
    }
    
    

    @AuraEnabled
    public static String createEmailCampaignRecord(String campaignData) {
        if (!Schema.sObjectType.Marketing_Campaign__c.isCreateable()) {
            throw new AuraHandledException('You do not have permission to create a Marketing Campaign record.');
        }
    
        try {
            Map<String, Object> campaignDataMap = (Map<String, Object>) JSON.deserializeUntyped(campaignData);
    
            Marketing_Campaign__c newCampaign = new Marketing_Campaign__c(
                Label__c = (String) campaignDataMap.get('campaignName'),
                Sender_Mode__c = (String) campaignDataMap.get('senderMode'),
                From_Address__c = (String) campaignDataMap.get('fromAddress'),
                From_Name__c = (String) campaignDataMap.get('fromName')
            );
    
            if (!Schema.sObjectType.Marketing_Campaign__c.fields.Label__c.isCreateable() ||
                !Schema.sObjectType.Marketing_Campaign__c.fields.Sender_Mode__c.isCreateable() ||
                !Schema.sObjectType.Marketing_Campaign__c.fields.From_Address__c.isCreateable() ||
                !Schema.sObjectType.Marketing_Campaign__c.fields.From_Name__c.isCreateable()) {
                throw new AuraHandledException('You do not have permission to create one or more fields on Marketing Campaign.');
            }
    
            insert newCampaign;
    
            return newCampaign.Id;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Quick_Template__c> getQuickTemplates() {
        return [SELECT Id, Name, Subject__c FROM Quick_Template__c];
    }
    


    @AuraEnabled(cacheable=true)
    public static List<Marketing_Email_Campaign__c> getMarketingEmails(String templateId) {
        return [SELECT Id, Name, Marketing_Campaign__c ,Subject__c,Quick_Template__c
                FROM Marketing_Email_Campaign__c 
                WHERE Marketing_Campaign__c = :templateId];
    }
    
    

}
