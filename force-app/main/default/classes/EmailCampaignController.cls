public with sharing class EmailCampaignController {
    @AuraEnabled(cacheable=true)
    public static List<Email_Campaign_Template__c> getEmailCampaignTemplates() {

        List<Email_Campaign_Template__c> templates = [SELECT Id, Label__c, Last_Usage_Date__c, Email_Campaign__c, Status__c 
                                                      FROM Email_Campaign_Template__c WITH SECURITY_ENFORCED ];

        return templates;
    }

    @AuraEnabled(cacheable=true)
    public static list<sObject> fetchLookupData(string searchKey , string sObjectApiName) {    
        List < sObject > returnList = new List < sObject > ();
        string sWildCardText = '%' + searchKey + '%';
        string sQuery = 'Select Id,Name From ' + sObjectApiName + ' Where Name Like : sWildCardText order by createdDate DESC LIMIT 5';
        for (sObject obj: database.query(sQuery)) {
            returnList.add(obj);
        }
        return returnList;
    }
}
