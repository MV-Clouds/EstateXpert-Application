public with sharing class MarketingEmailTriggerHandler {

    List<Marketing_Email__c> newMarketingEmails;
    List<Marketing_Email__c> oldMarketingEmails;
    Map<Id, Marketing_Email__c> newMarketingEmailsMap;
    Map<Id, Marketing_Email__c> oldMarketingEmailsMap;
    Boolean isInsert;
    Boolean isUpdate;
    Boolean isDelete;
    Boolean isUndelete;
    private static final String CLASS_NAME = 'MarketingEmailTriggerHandler';

    /**
    * Method Name : MarketingEmailTriggerHandler
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : constructor for setting all the data from the triger
    */
    public MarketingEmailTriggerHandler(List<Marketing_Email__c> newList, List<Marketing_Email__c> oldList, Map<Id, Marketing_Email__c> newMap, Map<Id, Marketing_Email__c> oldMap, Boolean isInsert, Boolean isUpdate, Boolean isDelete, Boolean isUndelete) {
        this.newMarketingEmails = newList;
        this.oldMarketingEmails = oldList;
        this.newMarketingEmailsMap = newMap;
        this.oldMarketingEmailsMap = oldMap;
        this.isInsert = isInsert;
        this.isUpdate = isUpdate;
        this.isDelete = isDelete;
        this.isUndelete = isUndelete;
    }

        /**
    * Method Name : onAfterInsert
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : method to run after insert event
    */
    public void onAfterInsert() {
        handleCampaignLogic(newMarketingEmails, true);
    }

     /**
    * Method Name : onAfterUpdate
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : method to run after update event
    */
    public void onAfterUpdate() {
        handleCampaignLogic(newMarketingEmails, false);
    }

    /**
    * Method Name : handleCampaignLogic
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : method to create or update camapign member records based on condition
    */
    private void handleCampaignLogic(List<Marketing_Email__c> marketingEmails, Boolean isInsert) {
        
       try {
        Set<Id> contactIds = new Set<Id>();
        Map<Id, List<Marketing_Email__c>> campaignToEmailsMap = new Map<Id, List<Marketing_Email__c>>();

        for (Marketing_Email__c email : marketingEmails) {
            if (!campaignToEmailsMap.containsKey(email.Marketing_Campaign__c)) {
                campaignToEmailsMap.put(email.Marketing_Campaign__c, new List<Marketing_Email__c>());
            }
            campaignToEmailsMap.get(email.Marketing_Campaign__c).add(email);
        }

        System.debug('campaignToEmailsMap ==> ' + campaignToEmailsMap);


        List<Marketing_Campaign_Member__c> campaignMembers = [
            SELECT Id, Marketing_Campaign__c, Contact__c
            FROM Marketing_Campaign_Member__c
            WHERE Marketing_Campaign__c IN :campaignToEmailsMap.keySet()
            AND Contact_Type__c = 'Primary'
        ];

        for (Marketing_Campaign_Member__c member : campaignMembers) {
                contactIds.add(member.Contact__c); 
        }

        Map<Id, Marketing_Campaign__c> campaigns = new Map<Id, Marketing_Campaign__c>(
            [SELECT Id, SelectedContactDateField__c FROM Marketing_Campaign__c WHERE Id IN :campaignToEmailsMap.keySet()]
        );
    
        String contactQuery = 'SELECT Id, FirstName, LastName';
        
        Set<String> contactFields = new Set<String>();
        for (Marketing_Campaign__c campaign : campaigns.values()) {
            if (campaign.SelectedContactDateField__c != null) {
                contactFields.add(campaign.SelectedContactDateField__c);
                
            }
        }
        
        for (String field : contactFields) {
            contactQuery += ', ' + field;
        }
        
        contactQuery += ' FROM Contact WHERE Id IN :contactIds';
    
        List<Contact> contactList = Database.query(contactQuery);
        Map<Id, Contact> contacts = new Map<Id, Contact>(contactList);
        Map<Id, List<Marketing_Campaign_Member__c>> campaignMembersMap = new Map<Id, List<Marketing_Campaign_Member__c>>();

        if (isInsert) {
            List<Email_Member__c> emailMembersToCreate = new List<Email_Member__c>();

            for (Marketing_Campaign__c campaign : campaigns.values()) {
                List<Marketing_Campaign_Member__c> members = [
                    SELECT Id, Contact__c, Contact_Type__c, Marketing_Campaign__c 
                    FROM Marketing_Campaign_Member__c 
                    WHERE Marketing_Campaign__c = :campaign.Id WITH SECURITY_ENFORCED
                ];
                campaignMembersMap.put(campaign.Id, members);
            }

            for (Id campaignId : campaignToEmailsMap.keySet()) {
                List<Marketing_Email__c> relatedEmails = campaignToEmailsMap.get(campaignId);
                
                Marketing_Campaign__c campaign = campaigns.get(campaignId);
                if (campaign != null && campaign.SelectedContactDateField__c != null) {
                    List<Marketing_Campaign_Member__c> members = campaignMembersMap.get(campaign.Id);

                    for (Marketing_Campaign_Member__c member : members) {
                        Contact contact = contacts.get(member.Contact__c);
                        if (contact != null) {
                            System.debug('contact ==> ' + contact);
                            Date selectedDate = (Date) contact.get(campaign.SelectedContactDateField__c);
                            System.debug('selectedDate ==> ' + selectedDate);
                            if (selectedDate != null) {
                                for (Marketing_Email__c email : relatedEmails) {
                                    DateTime scheduleDateTime = DateTime.newInstance(selectedDate, email.TimeToSend__c);
                                    System.debug('scheduleDateTime ==> ' + scheduleDateTime);
                                    Email_Member__c emailMember = new Email_Member__c(
                                        Contact__c = contact.Id,
                                        Marketing_Email__c = email.Id,
                                        Schedule_Date_and_Time__c = scheduleDateTime
                                    );
                                    emailMembersToCreate.add(emailMember);
                                }
                            }
                        }
                    }
                }
            }
            
            if (!emailMembersToCreate.isEmpty()) {
                insert emailMembersToCreate;
            }
        }
                
        else {
            Map<Id, Email_Member__c> existingEmailMembers = new Map<Id, Email_Member__c>(
                [SELECT Id, Contact__c, Marketing_Email__c, Schedule_Date_and_Time__c FROM Email_Member__c WHERE Marketing_Email__c IN :newMarketingEmailsMap.keySet()]
            );
            List<Email_Member__c> emailMembersToUpdate = new List<Email_Member__c>();
            for (Marketing_Email__c email : marketingEmails) {
                Marketing_Campaign__c campaign = campaigns.get(email.Marketing_Campaign__c);
                if (campaign != null && campaign.SelectedContactDateField__c != null) {
                    List<Marketing_Campaign_Member__c> members = campaignMembersMap.get(campaign.Id);
                    if (members != null) {
                        for (Marketing_Campaign_Member__c member : members) {
                            Contact contact = contacts.get(member.Contact__c);
                            if (contact != null) {
                                Date selectedDate = (Date) contact.get(campaign.SelectedContactDateField__c);
                                if (selectedDate != null) {
                                    DateTime scheduleDateTime = DateTime.newInstance(selectedDate, email.TimeToSend__c);

                                    Email_Member__c emailMember = existingEmailMembers.get(email.Id);
                                    if (emailMember != null) {
                                        emailMember.Schedule_Date_and_Time__c = scheduleDateTime;
                                        emailMembersToUpdate.add(emailMember);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!emailMembersToUpdate.isEmpty()) {
                update emailMembersToUpdate;
            }
        }
        }catch (Exception e) {
            System.debug('Exception ==> ' + e);
            System.debug('Line number ==> ' + e.getLineNumber());
       }
    }
}