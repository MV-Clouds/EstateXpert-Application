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
        return [SELECT Id, Name, Subject__c FROM Quick_Template__c WITH SECURITY_ENFORCED ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Marketing_Email_Campaign__c> getMarketingEmails(String templateId) {
        return [SELECT Id, Name, Marketing_Campaign__c ,Subject__c,Quick_Template__c
                FROM Marketing_Email_Campaign__c 
                WHERE Marketing_Campaign__c = :templateId WITH SECURITY_ENFORCED ];
    }

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
            
    
            // Extract and process Primary recipients
            List<Map<String, Object>> selectedPrimaryRecipients = new List<Map<String, Object>>();
            for (Object instance : (List<Object>) campaignEmailDataMap.get('selectedPrimaryRecipients')) {
                Map<String, Object> recipient = (Map<String, Object>) instance;
                selectedPrimaryRecipients.add(recipient);
            }
    
            // Extract and process CC recipients
            List<Map<String, Object>> selectedCCRecipients = new List<Map<String, Object>>();
            for (Object instance : (List<Object>) campaignEmailDataMap.get('selectedCCRecipients')) {
                Map<String, Object> recipient = (Map<String, Object>) instance;
                selectedCCRecipients.add(recipient);
            }
    
            // Extract and process BCC recipients
            List<Map<String, Object>> selectedBCCRecipients = new List<Map<String, Object>>();
            for (Object instance : (List<Object>) campaignEmailDataMap.get('selectedBCCRecipients')) {
                Map<String, Object> recipient = (Map<String, Object>) instance;
                selectedBCCRecipients.add(recipient);
            }
    
            // Serialize the updated lists to JSON strings
            String selectedPrimaryRecipientsJson = JSON.serialize(selectedPrimaryRecipients);
            String selectedCCRecipientsJson = JSON.serialize(selectedCCRecipients);
            String selectedBCCRecipientsJson = JSON.serialize(selectedBCCRecipients);
    
            System.debug('selectedPrimaryRecipientsJson ==> ' + selectedPrimaryRecipientsJson);
            System.debug('selectedCCRecipientsJson ==> ' + selectedCCRecipientsJson);
            System.debug('selectedBCCRecipientsJson ==> ' + selectedBCCRecipientsJson);

            String selectedContactDateField = (String) campaignEmailDataMap.get('selectedContactDateField');

            Date specificDate = null;
            if((String) campaignEmailDataMap.get('specificDate') != ''){
                String specificDateString = (String) campaignEmailDataMap.get('specificDate');
                specificDate = Date.valueOf(specificDateString);
            }

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
            if(specificDate != null){
                campaign.Start_Date__c = specificDate;
            }else if(selectedContactDateField != ''){
                campaign.SelectedContactDateField__c = selectedContactDateField;               
            }


            System.debug('selectedContactDateField ==> ' + selectedContactDateField);
            System.debug('specificDate ==> ' + specificDate);
    
            // Insert the campaign record
            if(Schema.Marketing_Campaign__c.SObjectType.getDescribe().isCreateable()){
                Database.insert(campaign);
            }
    
            List<Object> emails = (List<Object>) campaignEmailDataMap.get('emails');
            List<Marketing_Email_Campaign__c> emailRecordsToInsert = new List<Marketing_Email_Campaign__c>();
            
            for (Object emailDataObj : emails) {
                System.debug('emailDataObj ==> ' + emailDataObj);
                Map<String, Object> emailData = (Map<String, Object>) emailDataObj;
                System.debug('emailData ==> ' + emailData);
                Marketing_Email_Campaign__c emailCampaign = new Marketing_Email_Campaign__c();

                emailCampaign.Marketing_Campaign__c = campaign.Id;
                emailCampaign.Subject__c =  String.valueOf(emailData.get('subject'));
                emailCampaign.Quick_Template__c = String.valueOf(emailData.get('name'));
                emailCampaign.Days_After_Start_Date__c	= Integer.valueOf(emailData.get('daysAfterStartDate'));
                String timeString = (String)emailData.get('timeToSend');
                if (!String.isEmpty(timeString)) {
                    List<String> timeParts = timeString.split(':');
                    if (timeParts.size() == 3) {
                        Integer hours = Integer.valueOf(timeParts[0]);
                        Integer minutes = Integer.valueOf(timeParts[1]);
                        Integer seconds = Integer.valueOf(timeParts[2]);
                        
                        emailCampaign.TimeToSend__c = Time.newInstance(hours, minutes, seconds, 0);
                    }
                }
                                
                System.debug('emailCampaign ==> ' + emailCampaign);

                emailRecordsToInsert.add(emailCampaign);
            }

            System.debug('emailRecordsToInsert ==> ' + emailRecordsToInsert);
            
            if (!emailRecordsToInsert.isEmpty()) {
                insert emailRecordsToInsert;
            }

            if (!emailRecordsToInsert.isEmpty()) {
                Id campaignId = campaign.Id;
                EmailBatchScheduler emailBatch = new EmailBatchScheduler(campaignId);
                Database.executeBatch(emailBatch);
            }
    
        return campaign.Id;
        
        } catch (Exception e) {
            System.debug('Error creating campaign and emails: ' + e.getMessage());
            System.debug('Error creating campaign and emails: ' + e.getLineNumber());
            throw new AuraHandledException('Error creating campaign and emails: ' + e.getMessage());
        }
        
    }

}