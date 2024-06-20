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

}
