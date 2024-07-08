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

    public void onAfterInsert() {
        handleCampaignLogic(newMarketingEmails, true);
    }

    public void onAfterUpdate() {
        handleCampaignLogic(newMarketingEmails, false);
    }

    private void handleCampaignLogic(List<Marketing_Email__c> marketingEmails, Boolean isInsert) {
        
       try {
        Set<Id> campaignIds = new Set<Id>();
        Set<Id> contactIds = new Set<Id>();

        for (Marketing_Email__c email : marketingEmails) {
            if (email.Marketing_Campaign__c != null) {
                campaignIds.add(email.Marketing_Campaign__c);
            }
        }

        Map<Id, List<Marketing_Campaign_Member__c>> campaignMembersMap = new Map<Id, List<Marketing_Campaign_Member__c>>();
        for (Id campaignId : campaignIds) {
            campaignMembersMap.put(campaignId, new List<Marketing_Campaign_Member__c>());
        }

        List<Marketing_Campaign_Member__c> campaignMembers = [
            SELECT Id, Marketing_Campaign__c, Contact__c
            FROM Marketing_Campaign_Member__c
            WHERE Marketing_Campaign__c IN :campaignIds
            AND Contact_Type__c = 'Primary'
        ];

        for (Marketing_Campaign_Member__c member : campaignMembers) {
            if (campaignMembersMap.containsKey(member.Marketing_Campaign__c)) {
                campaignMembersMap.get(member.Marketing_Campaign__c).add(member);
                contactIds.add(member.Contact__c); 
            }
        }

        if (!campaignIds.isEmpty() && !contactIds.isEmpty()) {
            Map<Id, Marketing_Campaign__c> campaigns = new Map<Id, Marketing_Campaign__c>(
                [SELECT Id, SelectedContactDateField__c FROM Marketing_Campaign__c WHERE Id IN :campaignIds]
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
            
            if (isInsert) {
                List<Email_Member__c> emailMembersToCreate = new List<Email_Member__c>();
                for (Marketing_Email__c email : marketingEmails) {
                    Marketing_Campaign__c campaign = campaigns.get(email.Marketing_Campaign__c);
                    System.debug('campaign ==> ' + campaign);
                    if (campaign != null && campaign.SelectedContactDateField__c != null) {
                        List<Marketing_Campaign_Member__c> members = campaignMembersMap.get(campaign.Id);
                        if (members != null) {
                            for (Marketing_Campaign_Member__c member : members) {
                                Contact contact = contacts.get(member.Contact__c);
                                if (contact != null) {
                                    System.debug('contact ==> ' + contact);
                                    Date selectedDate = (Date) contact.get(campaign.SelectedContactDateField__c);
                                    if (selectedDate != null) {
                                        DateTime scheduleDateTime = DateTime.newInstance(selectedDate, email.TimeToSend__c);
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
            } else {
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
                                        // Combine date from contact and time from marketing email
                                        DateTime scheduleDateTime = DateTime.newInstance(selectedDate, email.TimeToSend__c);

                                        Email_Member__c emailMember = existingEmailMembers.get(email.Id);
                                        if (emailMember != null) {
                                            // Update Email_Member__c record
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
        }
       } catch (Exception e) {
        System.debug('Exception ==> ' + e);
        System.debug('Line number ==> ' + e.getLineNumber());
       }
    }
}
