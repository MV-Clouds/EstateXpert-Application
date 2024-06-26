public with sharing class EmailCampaignController {
    @AuraEnabled(cacheable=true)
    public static List<Marketing_Campaign__c> getEmailCampaignTemplates() {

        List<Marketing_Campaign__c> templates = [SELECT Id, Label__c, From_Name__c, From_Address__c, Sender_Mode__c,Is_Marketing_Campaign_Template__c FROM Marketing_Campaign__c WHERE Is_Marketing_Campaign_Template__c = true WITH SECURITY_ENFORCED ];

        return templates;
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, Name,Email FROM Contact WITH SECURITY_ENFORCED ];
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
    public static List<Quick_Template__c> getQuickTemplates() {
        return [SELECT Id, Name, Subject__c FROM Quick_Template__c];
    }
    


    @AuraEnabled(cacheable=true)
    public static List<Marketing_Email_Campaign__c> getMarketingEmails(String templateId) {
        return [SELECT Id, Name, Marketing_Campaign__c ,Subject__c,Quick_Template__c
                FROM Marketing_Email_Campaign__c 
                WHERE Marketing_Campaign__c = :templateId];
    }

    
    // @AuraEnabled
    // public static String createCampaignAndEmails(String jsonCampaignEmailData) {

    //     System.debug('campaignEmailDataMap ==> ' + jsonCampaignEmailData);

    //     try {
    //         Map<String, Object> campaignEmailDataMap = (Map<String, Object>) JSON.deserializeUntyped(jsonCampaignEmailData);

    //         System.debug('campaignEmailDataMap ==> ' + campaignEmailDataMap);
    
    //         String campaignName = (String) campaignEmailDataMap.get('campaignName');
    //         String senderMode = (String) campaignEmailDataMap.get('senderMode');
    //         String fromAddress = (String) campaignEmailDataMap.get('fromAddress');
    //         String fromName = (String) campaignEmailDataMap.get('fromName');
    //         Boolean saveForFuture = (Boolean) campaignEmailDataMap.get('saveForFuture');
    
    //         // List<Map<String, Object>> selectedPrimaryRecipients = (List<Map<String, Object>>) campaignEmailDataMap.get('selectedPrimaryRecipients');
    //         // System.debug('selectedPrimaryRecipients ==> ' + selectedPrimaryRecipients);
    //         // List<Map<String, Object>> selectedCCRecipients = (List<Map<String, Object>>) campaignEmailDataMap.get('selectedCCRecipients');
    //         // List<Map<String, Object>> selectedBCCRecipients = (List<Map<String, Object>>) campaignEmailDataMap.get('selectedBCCRecipients');
    
    //         // Create campaign record
    //         Marketing_Campaign__c campaign = new Marketing_Campaign__c();
    //         campaign.Label__c = campaignName;
    //         campaign.Sender_Mode__c = senderMode;
    //         campaign.From_Address__c = fromAddress;
    //         campaign.From_Name__c = fromName;
    //         campaign.Is_Marketing_Campaign_Template__c = saveForFuture;
    //         // campaign.Primary_Recipient__c = formatRecipients(selectedPrimaryRecipients);
    //         // campaign.CC_Contacts__c = formatRecipients(selectedCCRecipients);
    //         // campaign.BCC_Contacts__c = formatRecipients(selectedBCCRecipients);
    
    //         insert campaign;
    
    //         // List<Map<String, Object>> emails = (List<Map<String, Object>>) campaignEmailDataMap.get('emails');
    //         // List<Marketing_Email_Campaign__c> emailRecords = new List<Marketing_Email_Campaign__c>();
    //         // for (Map<String, Object> emailData : emails) {
    //         //     Marketing_Email_Campaign__c emailCampaign = new Marketing_Email_Campaign__c();
    //         //     emailCampaign.Marketing_Campaign__c = campaign.Id;
    //         //     emailCampaign.Subject__c = (String) emailData.get('subject');
    //         //     emailCampaign.Quick_Template__c = (String) emailData.get('name');
    //         //     // emailCampaign.Days_After_Start_Date__c = (Integer) emailData.get('daysAfterStartDate'); // Make sure this field exists
    //         //     // emailCampaign.Time_To_Send__c = (String) emailData.get('timeToSend'); // Make sure this field exists
    //         //     emailRecords.add(emailCampaign);
    //         // }
    
    //         // if (!emailRecords.isEmpty()) {
    //         //     upsert emailRecords;
    //         // }
    
    //         return campaign.Id;
    //     } catch (Exception e) {
    //         System.debug('Error creating campaign and emails: ' + e.getMessage());
    //         throw new AuraHandledException('Error creating campaign and emails: ' + e.getMessage());
    //     }
    // }
    
    // private static String formatRecipients(List<Map<String, Object>> recipients) {
    //     if (recipients == null || recipients.isEmpty()) {
    //         return '';
    //     }
    
    //     String formattedRecipients = '';
    //     for (Map<String, Object> recipient : recipients) {
    //         String name = (String) recipient.get('name');
    //         String email = (String) recipient.get('email');
    //         formattedRecipients += '<p>' + name + ' (' + email + ')' + '</p>';
    //     }
    //     return formattedRecipients;
    // }

    @AuraEnabled
    public static String createCampaignAndEmails(String jsonCampaignEmailData) {
        System.debug('campaignEmailDataMap ==> ' + jsonCampaignEmailData);

        try {
            // Deserialize the JSON string to a Map
            Map<String, Object> campaignEmailDataMap = (Map<String, Object>) JSON.deserializeUntyped(jsonCampaignEmailData);
            System.debug('campaignEmailDataMap ==> ' + campaignEmailDataMap);

            // Extract relevant fields
            String campaignName = (String) campaignEmailDataMap.get('campaignName');
            String senderMode = (String) campaignEmailDataMap.get('senderMode');
            String fromAddress = (String) campaignEmailDataMap.get('fromAddress');
            String fromName = (String) campaignEmailDataMap.get('fromName');
            Boolean saveForFuture = (Boolean) campaignEmailDataMap.get('saveForFuture');

            // Initialize strings to store recipient JSON data
            String primaryRecipientsJsonString = '';
            String ccRecipientsJsonString = '';
            String bccRecipientsJsonString = '';

            // Extract and process Primary recipients
            List<Map<String, Object>> selectedPrimaryRecipients = new List<Map<String, Object>>();
            for (Object instance : (List<Object>) campaignEmailDataMap.get('selectedPrimaryRecipients')) {
                Map<String, Object> recipient = (Map<String, Object>) instance;
                Map<String, Object> recipientId = (Map<String, Object>) recipient.get('id');
                String recipientJsonString = JSON.serialize(recipientId);
                recipient.put('id', recipientJsonString);
                selectedPrimaryRecipients.add(recipient);
            }

            // Extract and process CC recipients
            List<Map<String, Object>> selectedCCRecipients = new List<Map<String, Object>>();
            for (Object instance : (List<Object>) campaignEmailDataMap.get('selectedCCRecipients')) {
                Map<String, Object> recipient = (Map<String, Object>) instance;
                Map<String, Object> recipientId = (Map<String, Object>) recipient.get('id');
                String recipientJsonString = JSON.serialize(recipientId);
                recipient.put('id', recipientJsonString);
                selectedCCRecipients.add(recipient);
            }

            // Extract and process BCC recipients
            List<Map<String, Object>> selectedBCCRecipients = new List<Map<String, Object>>();
            for (Object instance : (List<Object>) campaignEmailDataMap.get('selectedBCCRecipients')) {
                Map<String, Object> recipient = (Map<String, Object>) instance;
                Map<String, Object> recipientId = (Map<String, Object>) recipient.get('id');
                String recipientJsonString = JSON.serialize(recipientId);
                recipient.put('id', recipientJsonString);
                selectedBCCRecipients.add(recipient);
            }

            // Serialize the updated lists to JSON strings
            String selectedPrimaryRecipientsJson = JSON.serialize(selectedPrimaryRecipients);
            String selectedCCRecipientsJson = JSON.serialize(selectedCCRecipients);
            String selectedBCCRecipientsJson = JSON.serialize(selectedBCCRecipients);

            // Create campaign record
            Marketing_Campaign__c campaign = new Marketing_Campaign__c();
            campaign.Label__c = campaignName;
            campaign.Sender_Mode__c = senderMode;
            campaign.From_Address__c = fromAddress;
            campaign.From_Name__c = fromName;
            campaign.Is_Marketing_Campaign_Template__c = saveForFuture;
            campaign.Primary_Recipient__c = selectedPrimaryRecipientsJson; 
            campaign.CC_Contacts__c = selectedCCRecipientsJson; 
            campaign.BCC_Contacts__c = selectedBCCRecipientsJson; 

            // Insert the campaign record
            insert campaign;

            // Optional: Handling emails if needed (commented out in the original code)
            // List<Map<String, Object>> emails = (List<Map<String, Object>>) campaignEmailDataMap.get('emails');
            // List<Marketing_Email_Campaign__c> emailRecords = new List<Marketing_Email_Campaign__c>();
            // for (Map<String, Object> emailData : emails) {
            //     Marketing_Email_Campaign__c emailCampaign = new Marketing_Email_Campaign__c();
            //     emailCampaign.Marketing_Campaign__c = campaign.Id;
            //     emailCampaign.Subject__c = (String) emailData.get('subject');
            //     emailCampaign.Quick_Template__c = (String) emailData.get('name');
            //     emailRecords.add(emailCampaign);
            // }
            // if (!emailRecords.isEmpty()) {
            //     upsert emailRecords;
            // }

            return campaign.Id;
        } catch (Exception e) {
            System.debug('Error creating campaign and emails: ' + e.getMessage());
            throw new AuraHandledException('Error creating campaign and emails: ' + e.getMessage());
        }
    }
    
    
    
}
