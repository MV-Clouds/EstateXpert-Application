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
    public static List<Template__c> getQuickTemplates() {
        return [SELECT Id, Name, Subject__c,Label__c,Template_pattern__c FROM Template__c WHERE Template_pattern__c	= 'quickTemplate' WITH SECURITY_ENFORCED ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Marketing_Email__c> getMarketingEmails(String templateId) {
        return [SELECT Id, Name, Marketing_Campaign__c ,Subject__c,Quick_Template__c,Send_Date_Time__c
                FROM Marketing_Email__c 
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
            
            // Extract and process Primary recipients (ContactIds)
            List<String> selectedPrimaryRecipients = new List<String>();
            if (campaignEmailDataMap.containsKey('selectedPrimaryRecipients')) {
                Object selectedPrimaryRecipientsObj = campaignEmailDataMap.get('selectedPrimaryRecipients');
                if (selectedPrimaryRecipientsObj instanceof List<Object>) {
                    List<Object> selectedPrimaryRecipientsList = (List<Object>) selectedPrimaryRecipientsObj;
                    for (Object recipient : selectedPrimaryRecipientsList) {
                        selectedPrimaryRecipients.add((String) recipient);

                    }
                }
            }
            System.debug('selectedPrimaryRecipients ==> ' + selectedPrimaryRecipients);
    
            // Extract and process CC recipients
            List<String> selectedCCRecipients = new List<String>();
            if (campaignEmailDataMap.containsKey('selectedCCRecipients')) {
                Object selectedCCRecipientsObj = campaignEmailDataMap.get('selectedCCRecipients');
                if (selectedCCRecipientsObj instanceof List<Object>) {
                    List<Object> selectedCCRecipientsList = (List<Object>) selectedCCRecipientsObj;
                    for (Object recipient : selectedCCRecipientsList) {
                        selectedCCRecipients.add((String) recipient);
                    }
                }
            }
            System.debug('selectedCCRecipients ==> ' + selectedCCRecipients);
    
            // Extract and process BCC recipients
            List<String> selectedBCCRecipients = new List<String>();
            if (campaignEmailDataMap.containsKey('selectedBCCRecipients')) {
                Object selectedBCCRecipientsObj = campaignEmailDataMap.get('selectedBCCRecipients');
                if (selectedBCCRecipientsObj instanceof List<Object>) {
                    List<Object> selectedBCCRecipientsList = (List<Object>) selectedBCCRecipientsObj;
                    for (Object recipient : selectedBCCRecipientsList) {
                        selectedBCCRecipients.add((String) recipient);
                    }
                }
            }

            String specificDateString = (String) campaignEmailDataMap.get('specificDate');
            Date specificDate = Date.valueOf(specificDateString);

            // Create campaign record
            Marketing_Campaign__c campaign = new Marketing_Campaign__c();
            campaign.Label__c = campaignName;
            campaign.Sender_Mode__c = senderMode;
            campaign.From_Address__c = fromAddress;
            campaign.From_Name__c = fromName;
            campaign.Is_Marketing_Campaign_Template__c = saveForFuture;
    
            // Insert the campaign record
            if(Schema.Marketing_Campaign__c.SObjectType.getDescribe().isCreateable()){
                Database.insert(campaign);
            }

            // Create Marketing_Campaign_Member__c records
            List<Marketing_Campaign_Member__c> marketingCampaignMembers = new List<Marketing_Campaign_Member__c>();

            for (String contactId : selectedPrimaryRecipients) {
                Marketing_Campaign_Member__c member = new Marketing_Campaign_Member__c();
                member.Contact__c = contactId;
                member.Contact_Type__c = 'Primary';
                member.Marketing_Campaign__c = campaign.Id;
                marketingCampaignMembers.add(member);
            }


            for (String contactId : selectedCCRecipients) {
                Marketing_Campaign_Member__c member = new Marketing_Campaign_Member__c();
                member.Contact__c = contactId;
                member.Contact_Type__c = 'CC';
                member.Marketing_Campaign__c = campaign.Id;
                marketingCampaignMembers.add(member);
            }

            for (String contactId : selectedBCCRecipients) {
                Marketing_Campaign_Member__c member = new Marketing_Campaign_Member__c();
                member.Contact__c = contactId;
                member.Contact_Type__c = 'BCC';
                member.Marketing_Campaign__c = campaign.Id;
                marketingCampaignMembers.add(member);
            }


            // Insert the Marketing_Campaign_Member__c records
            if (!marketingCampaignMembers.isEmpty()) {
                Database.insert(marketingCampaignMembers);
            }

            List<Object> emails = (List<Object>) campaignEmailDataMap.get('emails');
            List<Marketing_Email__c> emailRecordsToInsert = new List<Marketing_Email__c>();
            
            for (Object emailDataObj : emails) {
                System.debug('emailDataObj ==> ' + emailDataObj);
                Map<String, Object> emailData = (Map<String, Object>) emailDataObj;
                System.debug('emailData ==> ' + emailData);
                Marketing_Email__c emailCampaign = new Marketing_Email__c();

                emailCampaign.Marketing_Campaign__c = campaign.Id;
                emailCampaign.Subject__c =  String.valueOf(emailData.get('subject'));
                emailCampaign.Quick_Template__c = String.valueOf(emailData.get('template'));
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
                Database.insert(emailRecordsToInsert);
            }
    
        return campaign.Id;
        
        } catch (Exception e) {
            System.debug('Error creating campaign and emails: ' + e.getMessage());
            System.debug('Error creating campaign and emails: ' + e.getLineNumber());
            throw new AuraHandledException('Error creating campaign and emails: ' + e.getMessage());
        }
        
    }

}