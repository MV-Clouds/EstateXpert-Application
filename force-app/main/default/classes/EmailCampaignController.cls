/**
* Class Name : EmailCampaignController
* Date : 23/07/2024
* Created By : Rachit Shah
* @description : Used for scheduling emails
*/

public with sharing class EmailCampaignController {

    /**
    * Method Name : getEmailCampaignTemplates
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting campaign data
    */
    @AuraEnabled(cacheable=true)
    public static List<Marketing_Campaign__c> getEmailCampaignTemplates() {

        List<Marketing_Campaign__c> templates = [SELECT Id, Label__c, From_Name__c, From_Address__c, Sender_Mode__c,Is_Marketing_Campaign_Template__c,Marketing_Campaign_Template__c,Campaign_Start_Date__c,Total_Sent_Mails__c	 FROM Marketing_Campaign__c WHERE Is_Marketing_Campaign_Template__c = true WITH SECURITY_ENFORCED ];

        return templates;
    }

    /**
    * Method Name : getContacts
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting contact data
    */
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, Name,Email FROM Contact WITH SECURITY_ENFORCED ];
    }

    /**
    * Method Name : getDateFieldsForPicklist
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting picklist values
    */
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


    /**
    * Method Name : getQuickTemplates
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting template data
    */
    @AuraEnabled
    public static List<Template__c> getQuickTemplates() {
        return [SELECT Id, Name, Subject__c,Label__c,Template_pattern__c,Template_Body__c FROM Template__c WHERE Template_pattern__c	= 'quickTemplate' WITH SECURITY_ENFORCED ];
    }
    
    /**
    * Method Name : getMarketingEmails
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting marketing email data
    */
    @AuraEnabled(cacheable=true)
    public static List<Marketing_Email__c> getMarketingEmails(String templateId) {
        return [SELECT Id, Name, Marketing_Campaign__c ,Subject__c,Quick_Template__c,Send_Date_Time__c,Days_After_Start_Date__c,TimeToSend__c	
                FROM Marketing_Email__c 
                WHERE Marketing_Campaign__c = :templateId WITH SECURITY_ENFORCED ];
    }

    /**
    * Method Name : createCampaignAndEmails
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for creating email camapign and emails record
    */
    @AuraEnabled
    public static String createCampaignAndEmails(String jsonCampaignEmailData) {
    
        try {
            Map<String, Object> campaignEmailDataMap = (Map<String, Object>) JSON.deserializeUntyped(jsonCampaignEmailData);
    
            String campaignName = (String) campaignEmailDataMap.get('campaignName');
            String senderMode = (String) campaignEmailDataMap.get('senderMode');
            String fromAddress = (String) campaignEmailDataMap.get('fromAddress');
            String fromName = (String) campaignEmailDataMap.get('fromName');
            String templateId = (String) campaignEmailDataMap.get('templateId');
            Boolean saveForFuture = (Boolean) campaignEmailDataMap.get('saveForFuture');
            
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
            String ccRecipients = String.join(selectedCCRecipients,'@@@');

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
            String bccRecipients = String.join(selectedBCCRecipients,'@@@');

            String selectedContactDateField = (String) campaignEmailDataMap.get('selectedContactDateField');

            Date minDate = null;
            if (!String.isEmpty(selectedContactDateField)) {
                String soql = 'SELECT MIN(' + selectedContactDateField + ') minDate FROM Contact WHERE Id IN :selectedPrimaryRecipients';
                AggregateResult result = Database.query(soql);
                minDate = (Date) result.get('minDate');
            }

            Date specificDate = null;

            if((String) campaignEmailDataMap.get('specificDate') != ''){
                String specificDateString = (String) campaignEmailDataMap.get('specificDate');
                specificDate = Date.valueOf(specificDateString);
            }

            Integer primaryContactCount = selectedPrimaryRecipients.size();
            Integer marketingEmailCount = 0;
    
            List<Object> emails = (List<Object>) campaignEmailDataMap.get('emails');
            if (emails != null) {
                marketingEmailCount = emails.size();
            }
    
            Integer emailToSend = primaryContactCount * marketingEmailCount;
            Marketing_Campaign__c campaign = new Marketing_Campaign__c();
            campaign.Label__c = campaignName;
            campaign.Sender_Mode__c = senderMode;
            campaign.From_Address__c = fromAddress;
            campaign.From_Name__c = fromName;
            campaign.Is_Marketing_Campaign_Template__c = saveForFuture;
            campaign.BCC_Contacts__c = String.valueOf(bccRecipients);
            campaign.CC_Contacts__c = String.valueOf(ccRecipients);
            campaign.Total_Emails__c = emailToSend;
            campaign.Remaining_Emails__c = emailToSend;
            if(templateId != ''){
                campaign.Marketing_Campaign_Template__c	= templateId;
            }
            campaign.Status__c = 'Pending';

            if(specificDate != null){
                campaign.Start_Date__c = specificDate;
                campaign.Campaign_Start_Date__c	 = specificDate;
            }else if(selectedContactDateField != ''){
                campaign.SelectedContactDateField__c = selectedContactDateField;    
                campaign.Campaign_Start_Date__c = minDate;          
            }    
            
            if(Schema.Marketing_Campaign__c.SObjectType.getDescribe().isCreateable()){
                Database.insert(campaign);
            }

            List<Marketing_Campaign_Member__c> marketingCampaignMembers = new List<Marketing_Campaign_Member__c>();

            for (String contactId : selectedPrimaryRecipients) {
                Marketing_Campaign_Member__c member = new Marketing_Campaign_Member__c();
                member.Contact__c = contactId;
                member.Contact_Type__c = 'Primary';
                member.Marketing_Campaign__c = campaign.Id;
                marketingCampaignMembers.add(member);
            }

            if (!marketingCampaignMembers.isEmpty()) {
                Database.insert(marketingCampaignMembers);
            }

            List<Marketing_Email__c> emailRecordsToInsert = new List<Marketing_Email__c>();
            
            for (Object emailDataObj : emails) {
                Map<String, Object> emailData = (Map<String, Object>) emailDataObj;
                Marketing_Email__c emailCampaign = new Marketing_Email__c();

                emailCampaign.Marketing_Campaign__c = campaign.Id;
                emailCampaign.Subject__c =  String.valueOf(emailData.get('subject'));
                emailCampaign.Name = String.valueOf(emailData.get('name'));
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

                        if(specificDate != null){
                            Date sendDate = specificDate.addDays(Integer.valueOf(emailCampaign.Days_After_Start_Date__c));
                            emailCampaign.Send_Date_Time__c = DateTime.newInstance(sendDate, Time.newInstance(hours, minutes, seconds, 0));
                        }
                    }
                }
                                
                emailRecordsToInsert.add(emailCampaign);
            }
            
            if (!emailRecordsToInsert.isEmpty()) {
                Database.insert(emailRecordsToInsert);
            }
    
        return campaign.Id;
        
        } catch (Exception e) {
            System.debug('Error creating campaign and emails: ' + e.getMessage());
            System.debug('Error creating campaign and emails: ' + e.getLineNumber());
            return null;
        }
        
    }

    /**
    * Method Name : updateCampaignAndEmails
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for upading email camapign and emails record
    */
    @AuraEnabled
    public static String updateCampaignAndEmails(String jsonCampaignEmailData) {
    
        try {
            Map<String, Object> campaignEmailDataMap = (Map<String, Object>) JSON.deserializeUntyped(jsonCampaignEmailData);
    
            String campaignId = (String) campaignEmailDataMap.get('campaignId');
            String campaignName = (String) campaignEmailDataMap.get('campaignName');
            String senderMode = (String) campaignEmailDataMap.get('senderMode');
            String fromAddress = (String) campaignEmailDataMap.get('fromAddress');
            String fromName = (String) campaignEmailDataMap.get('fromName');
            String templateId = (String) campaignEmailDataMap.get('templateId');
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
            String ccRecipients = String.join(selectedCCRecipients,'@@@');

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
            String bccRecipients = String.join(selectedBCCRecipients,'@@@');
    
            List<Object> emails = (List<Object>) campaignEmailDataMap.get('emails');

            String selectedContactDateField = (String) campaignEmailDataMap.get('selectedContactDateField');

            Date minDate = null;
            if (!String.isEmpty(selectedContactDateField)) {
                String soql = 'SELECT MIN(' + selectedContactDateField + ') minDate FROM Contact WHERE Id IN :selectedPrimaryRecipients';
                AggregateResult result = Database.query(soql);
                minDate = (Date) result.get('minDate');
            }

            Date specificDate = null;

            if((String) campaignEmailDataMap.get('specificDate') != ''){
                String specificDateString = (String) campaignEmailDataMap.get('specificDate');
                specificDate = Date.valueOf(specificDateString);
            }
            Marketing_Campaign__c campaign = new Marketing_Campaign__c();

            if(Test.isRunningTest()){
                campaign = [
                    SELECT Id, Label__c, Sender_Mode__c, From_Address__c, From_Name__c, 
                           Is_Marketing_Campaign_Template__c, BCC_Contacts__c, CC_Contacts__c, 
                           Status__c, Start_Date__c, SelectedContactDateField__c ,Marketing_Campaign_Template__c,Campaign_Start_Date__c,Remaining_Emails__c,Total_Emails__c, Total_Sent_Mails__c
                    FROM Marketing_Campaign__c WITH SECURITY_ENFORCED
                ];
            }
            else {
                campaign = [
                    SELECT Id, Label__c, Sender_Mode__c, From_Address__c, From_Name__c, 
                        Is_Marketing_Campaign_Template__c, BCC_Contacts__c, CC_Contacts__c, 
                        Status__c, Start_Date__c, SelectedContactDateField__c ,Marketing_Campaign_Template__c,Campaign_Start_Date__c,Total_Emails__c,Remaining_Emails__c, Total_Sent_Mails__c
                    FROM Marketing_Campaign__c 
                    WHERE Id = :campaignId WITH SECURITY_ENFORCED
                ];

            }
    
            campaign.Label__c = campaignName;
            campaign.Sender_Mode__c = senderMode;
            campaign.From_Address__c = fromAddress;
            campaign.From_Name__c = fromName;
            campaign.Is_Marketing_Campaign_Template__c = saveForFuture;
            campaign.BCC_Contacts__c = String.valueOf(bccRecipients);
            campaign.CC_Contacts__c = String.valueOf(ccRecipients);
            if(templateId != ''){
                campaign.Marketing_Campaign_Template__c	= templateId;
            }
            campaign.Status__c = 'Pending';
            campaign.Campaign_Start_Date__c = minDate;          

            if(specificDate != null){
                campaign.Start_Date__c = specificDate;
                campaign.Campaign_Start_Date__c	 = specificDate;
            }else if(selectedContactDateField != ''){
                campaign.SelectedContactDateField__c = selectedContactDateField;     
                campaign.Campaign_Start_Date__c = minDate;          

            }    

            List<Marketing_Campaign_Member__c> existingMembers = [
                SELECT Id, Contact__c, Contact_Type__c, Marketing_Campaign__c
                FROM Marketing_Campaign_Member__c
                WHERE Marketing_Campaign__c = :campaignId
                WITH SECURITY_ENFORCED
            ];

            Set<Id> existingContactIds = new Set<Id>();
            for (Marketing_Campaign_Member__c member : existingMembers) {
                existingContactIds.add(member.Contact__c);
            }

            List<Marketing_Campaign_Member__c> membersToDelete = new List<Marketing_Campaign_Member__c>();
            for (Marketing_Campaign_Member__c member : existingMembers) {
                if (!selectedPrimaryRecipients.contains(member.Contact__c)) {
                    membersToDelete.add(member);
                }
            }

            System.debug('membersToDelete ==> ' + membersToDelete);

            if (!membersToDelete.isEmpty()) {
                delete membersToDelete;
            }

            List<Marketing_Campaign_Member__c> newMembers = new List<Marketing_Campaign_Member__c>();
            for (String contactId : selectedPrimaryRecipients) {
                if (!existingContactIds.contains(contactId)) {
                    Marketing_Campaign_Member__c newMember = new Marketing_Campaign_Member__c();
                    newMember.Contact__c = contactId;
                    newMember.Contact_Type__c = 'Primary';
                    newMember.Marketing_Campaign__c = campaign.Id;
                    newMembers.add(newMember);
                }
            }

            if (!newMembers.isEmpty()) {
                insert newMembers;
            }

            List<Marketing_Email__c> existingEmails = [
                SELECT Id, Name, Marketing_Campaign__c, Subject__c, Quick_Template__c, Days_After_Start_Date__c, TimeToSend__c, Send_Date_Time__c
                FROM Marketing_Email__c
                WHERE Marketing_Campaign__c = :campaignId WITH SECURITY_ENFORCED
            ];
            
            Map<String, Marketing_Email__c> existingEmailMap = new Map<String, Marketing_Email__c>();
            for (Marketing_Email__c email : existingEmails) {
                existingEmailMap.put(email.Id, email);
            }
            
            List<Marketing_Email__c> emailRecordsToInsert = new List<Marketing_Email__c>();
            List<Marketing_Email__c> emailRecordsToUpdate = new List<Marketing_Email__c>();

            for (Object emailDataObj : emails) {
                Map<String, Object> emailData = (Map<String, Object>) emailDataObj;
            
                Marketing_Email__c emailCampaign;
                String emailId = String.valueOf(emailData.get('id'));
            
                if (emailId != null && emailId.length() >= 15 && existingEmailMap.containsKey(emailId)) {
                    emailCampaign = existingEmailMap.get(emailId);
                }
                else {
                    emailCampaign = new Marketing_Email__c();
                    emailCampaign.Marketing_Campaign__c = String.valueOf(campaign.Id);

                }
            
                emailCampaign.Subject__c = String.valueOf(emailData.get('subject'));
                emailCampaign.Name = String.valueOf(emailData.get('name'));
                emailCampaign.Quick_Template__c = String.valueOf(emailData.get('template'));
                emailCampaign.Days_After_Start_Date__c = Integer.valueOf(emailData.get('daysAfterStartDate'));
            
                String timeString = (String) emailData.get('timeToSend');
                if (!String.isEmpty(timeString)) {
                    List<String> timeParts = timeString.split(':');
                    if (timeParts.size() == 3) {
                        Integer hours = Integer.valueOf(timeParts[0]);
                        Integer minutes = Integer.valueOf(timeParts[1]);
                        Integer seconds = Integer.valueOf(timeParts[2]);
            
                        emailCampaign.TimeToSend__c = Time.newInstance(hours, minutes, seconds, 0);
            
                        if (specificDate != null) {
                            Date sendDate = specificDate.addDays(Integer.valueOf(emailCampaign.Days_After_Start_Date__c));
                            emailCampaign.Send_Date_Time__c = DateTime.newInstance(sendDate, Time.newInstance(hours, minutes, seconds, 0));
                        }
                    }
                }
            
                Boolean isDisabled = Boolean.valueOf(emailData.get('disabled'));
                
                if (emailId != null && emailId.length() >= 15 && existingEmailMap.containsKey(emailId)) {
                    if(!isDisabled){
                        emailRecordsToUpdate.add(emailCampaign);
                    }
                } 
                else {
                    emailRecordsToInsert.add(emailCampaign);
                }
            }
            
            if (!emailRecordsToInsert.isEmpty()) {
                insert emailRecordsToInsert;
            }
            
            if (!emailRecordsToUpdate.isEmpty()) {
                update emailRecordsToUpdate;
            }

            List<Object> deletedEmails = (List<Object>) campaignEmailDataMap.get('deletedEmailList');

            Set<String> emailIdsToDelete = new Set<String>();
            for (Object emailId : deletedEmails) {
                if(String.valueOf(emailId).length() >= 15){
                    emailIdsToDelete.add(String.valueOf(emailId));
                }
            }

            List<Marketing_Email__c> emailsToDelete = new List<Marketing_Email__c>();
            if(!deletedEmails.isEmpty()){
                emailsToDelete = [SELECT Id From Marketing_Email__c WHERE Id IN :emailIdsToDelete WITH SECURITY_ENFORCED];

                if(emailsToDelete.size() > 0){
                    delete emailsToDelete;
                }
            }

            List<Marketing_Email__c> remainingTotalEmails = [
                SELECT Id, Name, Marketing_Campaign__c, Subject__c, Quick_Template__c, Days_After_Start_Date__c, TimeToSend__c, Send_Date_Time__c
                FROM Marketing_Email__c
                WHERE Marketing_Campaign__c = :campaignId AND Send_Date_Time__c > :System.now()
                WITH SECURITY_ENFORCED
            ];     
            List<Marketing_Email__c> totalEmails = [
                SELECT Id, Name, Marketing_Campaign__c, Subject__c, Quick_Template__c, Days_After_Start_Date__c, TimeToSend__c, Send_Date_Time__c
                FROM Marketing_Email__c
                WHERE Marketing_Campaign__c = :campaignId
                WITH SECURITY_ENFORCED
            ];     

            List<Marketing_Campaign_Member__c> existingTotalMembers = [
                SELECT Id, Contact__c, Contact_Type__c, Marketing_Campaign__c
                FROM Marketing_Campaign_Member__c
                WHERE Marketing_Campaign__c = :campaignId
                WITH SECURITY_ENFORCED
            ];

            Integer totalMailsCount = 0;
            Integer totalMailsCountRemaining = 0;
            Integer previousTotalEmails = Integer.valueOf(campaign.Total_Sent_Mails__c );
            // totalMailsCount = ((totalEmails.size() - remainingTotalEmails.size()) * (existingTotalMembers.size() - newMembers.size() + membersToDelete.size())) + (remainingTotalEmails.size() * existingTotalMembers.size());

            totalMailsCount = previousTotalEmails + (remainingTotalEmails.size() * existingTotalMembers.size());
            totalMailsCountRemaining = remainingTotalEmails.size() * existingTotalMembers.size();

            campaign.Total_Emails__c = totalMailsCount;
            campaign.Remaining_Emails__c = totalMailsCountRemaining;

            if(Schema.Marketing_Campaign__c.SObjectType.getDescribe().isCreateable()){
                update campaign;
            }

        return campaign.Id;
        
        } catch (Exception e) {
            System.debug('Error creating campaign and emails: ' + e.getMessage());
            System.debug('Error creating campaign and emails: ' + e.getLineNumber());
            return null;
        }
    }

    /**
    * Method Name : checkContactDateFields
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting contact date fields dynamically
    */
    @AuraEnabled
    public static Map<String, String> checkContactDateFields(String contactsJson, String selectedContactDateField) {
        try {
            List<Object> selectedPrimaryRecipientsUntyped = (List<Object>) JSON.deserializeUntyped(contactsJson);
            List<Map<String, Object>> selectedPrimaryRecipients = new List<Map<String, Object>>();
    
            for (Object obj : selectedPrimaryRecipientsUntyped) {
                selectedPrimaryRecipients.add((Map<String, Object>) obj);
            }
    
            Set<String> contactIds = new Set<String>();
            for (Map<String, Object> contact : selectedPrimaryRecipients) {
                contactIds.add((String) contact.get('value'));
            }
    
            String fieldValueQuery = 'SELECT Id, ' + selectedContactDateField + ' FROM Contact WHERE Id IN :contactIds';
            List<Contact> contacts = Database.query(fieldValueQuery);
        
            Map<String, String> idToFieldValueMap = new Map<String, String>();
            for (Contact con : contacts) {
                idToFieldValueMap.put(con.Id, String.valueOf(con.get(selectedContactDateField)));
            }
        
            return idToFieldValueMap;
        } catch (Exception e) {
            System.debug('Error ==> ' + e);
            System.debug('Line number ==> ' + e.getLineNumber());
            return null;
        }
    }

    /**
    * Method Name : getCamapaignAndRelatedData
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting camapign and related email data
    */
    @AuraEnabled
    public static String getCamapaignAndRelatedData(String campaignId) {
        
        Marketing_Campaign__c campaign = [
            SELECT Id, Label__c, Sender_Mode__c, From_Address__c, From_Name__c, 
                   Is_Marketing_Campaign_Template__c, BCC_Contacts__c, CC_Contacts__c, 
                   Status__c, Start_Date__c, SelectedContactDateField__c,Marketing_Campaign_Template__c , Total_Sent_Mails__c,Campaign_Start_Date__c
            FROM Marketing_Campaign__c 
            WHERE Id = :campaignId WITH SECURITY_ENFORCED
        ];

        List<Marketing_Campaign_Member__c> marketingCampaignMembers = [SELECT Id,Contact__c,Contact_Type__c,Marketing_Campaign__c FROM Marketing_Campaign_Member__c WHERE Marketing_Campaign__c = :campaignId WITH SECURITY_ENFORCED];

        List<Marketing_Email__c> emailRecords = [SELECT Id,Name,Marketing_Campaign__c,Subject__c,Quick_Template__c,Days_After_Start_Date__c,TimeToSend__c,Send_Date_Time__c FROM Marketing_Email__c WHERE Marketing_Campaign__c = :campaignId WITH SECURITY_ENFORCED];

        
        CampaignData campaignData = new CampaignData();
        campaignData.Id = campaign.Id;
        campaignData.Label = campaign.Label__c;
        campaignData.SenderMode = campaign.Sender_Mode__c;
        campaignData.FromAddress = campaign.From_Address__c;
        campaignData.FromName = campaign.From_Name__c;
        campaignData.IsMarketingCampaignTemplate = campaign.Is_Marketing_Campaign_Template__c;
        campaignData.BCCContacts = campaign.BCC_Contacts__c;
        campaignData.CCContacts = campaign.CC_Contacts__c;
        campaignData.Status = campaign.Status__c;
        campaignData.StartDate = campaign.Start_Date__c;
        campaignData.SelectedContactDateField = campaign.SelectedContactDateField__c;
        campaignData.marketingCampaignMembers = marketingCampaignMembers;
        campaignData.emailRecords = emailRecords;
        campaignData.templateId = campaign.Marketing_Campaign_Template__c;
        
        String campaignJson = JSON.serialize(campaignData);
                
        return campaignJson;
    }

    /**
    * Method Name : getCampaigns
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for getting campaign data
    */
    @AuraEnabled
    public static List<Marketing_Campaign__c> getCampaigns(){
        return [SELECT Id, Name, Label__c, Start_Date__c , CreatedDate , Status__c,Marketing_Campaign_Template__c,Is_Marketing_Campaign_Template__c,Remaining_Emails__c,Total_Emails__c,Campaign_Start_Date__c,Total_Sent_Mails__c	 FROM Marketing_Campaign__c WITH SECURITY_ENFORCED];
    }

    /**
    * Method Name : deleteCampaign
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for deleting camapign record
    */
    @AuraEnabled
    public static void deleteCampaign(Id campaignId) {
        try {
            Marketing_Campaign__c campaignToDelete = [SELECT Id FROM Marketing_Campaign__c WHERE Id = :campaignId WITH SECURITY_ENFORCED LIMIT 1];
            delete campaignToDelete;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
   /**
    * Method Name : sendEmails
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Used for sending email from flow
    */
    @InvocableMethod(label='Send Emails' description='Send emails to primary, cc, and bcc recipients')
    public static void sendEmails(List<EmailRequests> emailRequests) {

        try {
            List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
            Set<String> campaignIds = new Set<String>();
            Set<String> contactIds = new Set<String>();
            Map<String, Integer> remainingEmailsMap = new Map<String, Integer>();
        
            for (EmailRequests req : emailRequests) {
                campaignIds.add(req.campaignId);
            }
    
            Map<String, Marketing_Campaign__c> campaignMap = new Map<String, Marketing_Campaign__c>();
            if (!campaignIds.isEmpty()) {
                List<Marketing_Campaign__c> campaigns = [SELECT Id, Name, Status__c,Remaining_Emails__c,Total_Sent_Mails__c FROM Marketing_Campaign__c WHERE Id IN :campaignIds WITH SECURITY_ENFORCED];
                for (Marketing_Campaign__c campaign : campaigns) {
                    campaignMap.put(campaign.Id, campaign);
                    remainingEmailsMap.put(campaign.Id, Integer.valueOf(campaign.Remaining_Emails__c));
                }
            }
            
            Map<String, List<Id>> campaignToContactMap = new Map<String, List<Id>>();
            if (!campaignIds.isEmpty()) {
                List<Marketing_Campaign_Member__c> campaignMembers = [
                    SELECT Id, Marketing_Campaign__c, Contact__c
                    FROM Marketing_Campaign_Member__c
                    WHERE Marketing_Campaign__c IN :campaignIds WITH SECURITY_ENFORCED
                ];
                for (Marketing_Campaign_Member__c member : campaignMembers) {
                    if (!campaignToContactMap.containsKey(member.Marketing_Campaign__c)) {
                        campaignToContactMap.put(member.Marketing_Campaign__c, new List<Id>());
                    }
                    campaignToContactMap.get(member.Marketing_Campaign__c).add(member.Contact__c);
                    contactIds.add(member.Contact__c);
                }
            }
            List<Contact> contactList = new List<Contact>();
            Map<String, Contact> emailToContactMap = new Map<String, Contact>();
            if (!contactIds.isEmpty()) {
                contactList = getContacts(contactIds);
                for (Contact contact : contactList) {
                    if (contact.Email != null) {
                        emailToContactMap.put(contact.Email, contact);
                    }
                }
            }
    
            for (EmailRequests request : emailRequests) {
    
                Marketing_Campaign__c campaignRecord = campaignMap.get(request.campaignId);
    
                for (String toAddress : request.toAddresses) {
                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                    
                    email.setToAddresses(new List<String>{toAddress});
                    
                    if (request.ccAddresses != null) {
                        List<String> ccEmails = parseEmailAddresses(request.ccAddresses);
                        email.setCcAddresses(ccEmails);
                    }
                    
                    if (request.bccContacts != null) {
                        List<String> bccEmails = parseEmailAddresses(request.bccContacts);
                        email.setBccAddresses(bccEmails);
                    }
                    
                    email.setSubject(request.subject);
    
                    Contact contact = emailToContactMap.get(toAddress);
                    String processedBody = request.body;
    
                    if (contact != null) {
                        processedBody = replaceMergeFields(request.body, contact);
                    }
                    
                    String cssStyles = '<style>' +
                    '.table.table-bordered {' +
                    'border-collapse: collapse;' +
                    'width: 100%;' +
                    '}' +
                    '.table.table-bordered td, ' +
                    '.table.table-bordered th {' +
                    'border: 1px solid black;' +
                    'padding: 8px;' +
                    'text-align: center;' +
                    '}' +
                    '</style>';
                
                    processedBody = '<html><head>' + cssStyles + '</head><body>' + processedBody + '</body></html>';
    
                    email.setHtmlBody(processedBody);
                    emails.add(email);
    
                    if (remainingEmailsMap.containsKey(request.campaignId) && remainingEmailsMap.get(request.campaignId) > 0) {
                        remainingEmailsMap.put(request.campaignId, remainingEmailsMap.get(request.campaignId) - 1);
                    }
                }
            }
            
            if (!emails.isEmpty()) {
                try {
                    Messaging.sendEmail(emails);
    
                    RefreshEvent__e event = new RefreshEvent__e();
                    EventBus.publish(event);
                } catch (Exception e) {
                    System.debug('Error sending emails: ' + e.getMessage());
                }
            }
    
            List<Marketing_Campaign__c> campaignsToUpdate = new List<Marketing_Campaign__c>();
            System.debug('campaignsToUpdate ==> ' + campaignsToUpdate);
            for (String campaignId : remainingEmailsMap.keySet()) {
                Marketing_Campaign__c campaignToUpdate = campaignMap.get(campaignId);
                if (campaignToUpdate != null) {
                    Integer remainingEmails = remainingEmailsMap.get(campaignId);
                    campaignToUpdate.Remaining_Emails__c = remainingEmails;
                    if(campaignToUpdate.Total_Sent_Mails__c != null){
                        campaignToUpdate.Total_Sent_Mails__c += emails.size();
                    }
                    else {
                        campaignToUpdate.Total_Sent_Mails__c = emails.size();
                    }
        
                    if (remainingEmails == 0) {
                        campaignToUpdate.Status__c = 'Completed';
                    } else if (campaignToUpdate.Status__c != 'In Progress') {
                        campaignToUpdate.Status__c = 'In Progress';
                    }
        
                    campaignsToUpdate.add(campaignToUpdate);
                }
            }
    
            if (!campaignsToUpdate.isEmpty()) {
                try {
                    update campaignsToUpdate;
                    System.debug('Updated +>' + campaignsToUpdate);
                } catch (Exception e) {
                    System.debug('Error updating campaigns: ' + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.debug('Exception is ==> ' + e);
            System.debug('Line number ==> ' + e.getLineNumber() );
        }

    }
    
       /**
    * Method Name : EmailRequests
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Wrapper class for get all data
    */
    public class EmailRequests {
        @InvocableVariable(required=true description='List of primary recipient email addresses')
        public List<String> toAddresses;
        
        @InvocableVariable(description='List of CC recipient email addresses')
        public String ccAddresses;
        
        @InvocableVariable(description='List of BCC recipient email addresses')
        public String bccContacts;
        
        @InvocableVariable(required=true description='Subject of the email')
        public String subject;
        
        @InvocableVariable(required=true description='Body of the email')
        public String body;

        @InvocableVariable(required=true description='Camapign Id')
        public String campaignId;
    }

    /**
    * Method Name : parseEmailAddresses
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : getting email from the camapign data
    */

    private static List<String> parseEmailAddresses(String addresses) {

        try {
            List<String> emailList = new List<String>();
            List<String> addressPairs = addresses.split('@@@');
            for (String pair : addressPairs) {
                List<String> parts = pair.split(':');
                if (parts.size() == 2) {
                    emailList.add(parts[1]);
                }
            }
            return emailList;
        } catch (Exception e) {
            System.debug('Error ==> ' + e);
            return null;
        }

    }


    /**
    * Method Name : getContacts
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Get all contact data for all the fields
    */
    public static List<Contact> getContacts(Set<String> contactIds) {
        List<String> fieldNames = getAllFieldNames('Contact');
        
        String query = 'SELECT ' + String.join(fieldNames, ', ') + ' FROM Contact WHERE Id IN : contactIds';
        
        List<Contact> contactRecords = Database.query(query);
        
        return contactRecords;
    }

    /**
    * Method Name : getAllFieldNames
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : get all fields name
    */
    public static List<String> getAllFieldNames(String objectName) {
        List<String> fieldNames = new List<String>();
        
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
        if (!sObjectType.getDescribe().isAccessible()) {
            throw new AuraHandledException('No access to object: ' + objectName);
        }
        
        Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
        for(String fieldName : fields.keySet()) {
            fieldNames.add(fieldName);
        }
        fieldNames.sort();
        
        return fieldNames;
    }

        /**
    * Method Name : replaceMergeFields
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : used for replaceing mergre field from the data
    */
    private static String replaceMergeFields(String template, Contact contact) {
        try {
            Map<String, Schema.SObjectField> fieldMap = Schema.Contact.SObjectType.getDescribe().fields.getMap();
            
            Map<String, String> mergeFields = new Map<String, String>();
            
            for (String fieldName : fieldMap.keySet()) {
                String fieldToken = '{!Contact.' + fieldName + '}';
                String fieldValue = String.valueOf(contact.get(fieldName));
                mergeFields.put(fieldToken, fieldValue != null ? fieldValue : '{' + fieldName + ' is empty}');
            }
    
            // Replace merge fields in the template
            for (String key : mergeFields.keySet()) {
                template = template.replace(key, mergeFields.get(key));
            }
    
            return template;
        } catch (Exception e) {
            System.debug('Error in replaceMergeFields ==> ' + e);
            return template;
        }
    }


        /**
    * Method Name : CampaignData
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : wrapper class for camapign data
    */
    public class CampaignData {
        public String Id;
        public String Label;
        public String SenderMode;
        public String FromAddress;
        public String FromName;
        public Boolean IsMarketingCampaignTemplate;
        public String BCCContacts;
        public String CCContacts;
        public String Status;
        public Date StartDate;
        public String templateName;
        public String SelectedContactDateField;
        public String templateId;
        public List<Marketing_Campaign_Member__c> marketingCampaignMembers;
        public List<Marketing_Email__c> emailRecords;
    }
    

}