public class EmailBatchScheduler implements Database.Batchable<sObject>, Database.AllowsCallouts {
    private Id emailId;
    private List<String> primaryRecipients;
    private List<String> ccRecipients;
    private List<String> bccRecipients;
    private String emailTemplateSubject;

    public EmailBatchScheduler(Id emailId, String selectedPrimaryRecipientsJson, String selectedCCRecipientsJson, String selectedBCCRecipientsJson) {
        this.emailId = emailId;
        this.primaryRecipients = extractEmailAddresses(selectedPrimaryRecipientsJson);
        this.ccRecipients = extractEmailAddresses(selectedCCRecipientsJson);
        this.bccRecipients = extractEmailAddresses(selectedBCCRecipientsJson);
    }

    public Database.QueryLocator start(Database.BatchableContext BC) {
        Marketing_Email_Campaign__c campaign = [SELECT Id, Name, Marketing_Campaign__c, Subject__c, Quick_Template__c
                                                FROM Marketing_Email_Campaign__c
                                                WHERE Id = :emailId LIMIT 1];

        Quick_Template__c template = [SELECT Id, Subject__c
                                      FROM Quick_Template__c
                                      WHERE Id = :campaign.Quick_Template__c LIMIT 1];

        if (template != null) {
            emailTemplateSubject = template.Subject__c;
        }

        return Database.getQueryLocator([
            SELECT Id, Email
            FROM Contact
            WHERE Email IN :primaryRecipients
        ]);
    }

    public void execute(Database.BatchableContext BC, List<Contact> contacts) {

        try {
            List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

            for (Contact contact : contacts) {
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setSubject(emailTemplateSubject); 
                email.setHtmlBody('Test Body');
                email.setToAddresses(new List<String>{ contact.Email });
                email.setCcAddresses(ccRecipients);
                email.setBccAddresses(bccRecipients);
    
                emails.add(email);
            }
    
            System.debug('emails ==> ' + emails);
    
            Messaging.sendEmail(emails);
        } catch (Exception e) {
            System.debug('Exception ==> ' + e);
            System.debug('Exception line number ==> ' + e.getLineNumber());

        }

    }

    public void finish(Database.BatchableContext BC) {
        System.debug('In the finish method');
    }

    private List<String> extractEmailAddresses(String recipientsJson) {
        List<String> emailAddresses = new List<String>();
        
        if (String.isNotBlank(recipientsJson)) {
            try {
                List<Object> recipientsList = (List<Object>) JSON.deserializeUntyped(recipientsJson);
                
                for (Object recipientObj : recipientsList) {
                    Map<String, Object> recipient = (Map<String, Object>) recipientObj;
                    
                    if (recipient.containsKey('id')) {
                        Map<String, Object> idMap = (Map<String, Object>) recipient.get('id');
                        if (idMap != null && idMap.containsKey('email')) {
                            String emailAddress = (String) idMap.get('email');
                            emailAddresses.add(emailAddress);
                        }
                    }
                }
            } catch (Exception e) {
                System.debug('Error parsing JSON: ' + e.getMessage());
            }
        }
        
        return emailAddresses;
    }
    
}
