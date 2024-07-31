/**
* Method Name : EmailCampaignScheduler
* Date : 23/07/2024
* Created By : Rachit Shah
* @description : Class for sedning email using flow
*/

public class EmailCampaignScheduler {

    /**
    * Method Name : sendEmails
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : Class for sedning email using flow
    */
    @InvocableMethod(label='Contact Specific Send Email' description='Send emails to primary, cc, and bcc recipients')
    public static void sendEmails(List<EmailRequest> emailRequests) {

        try {

            List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
            Set<String> campaignIds = new Set<String>();
            Set<String> contactIds = new Set<String>();

            for (EmailRequest req : emailRequests) {
                campaignIds.add(req.campaignId);
                contactIds.add(req.contactId);
            }

            Map<String, Marketing_Campaign__c> campaignMap = new Map<String, Marketing_Campaign__c>();
            if (!campaignIds.isEmpty()) {
                List<Marketing_Campaign__c> campaigns = [SELECT Id, Name, Remaining_Emails__c, Status__c,Total_Sent_Mails__c FROM Marketing_Campaign__c WHERE Id IN :campaignIds WITH SECURITY_ENFORCED];
                for (Marketing_Campaign__c campaign : campaigns) {
                    campaignMap.put(campaign.Id, campaign);
                }
            }

            Map<String, Contact> contactMap = new Map<String, Contact>();
            if (!contactIds.isEmpty()) {
                List<Contact> contacts = getContacts(contactIds);
                for (Contact contact : contacts) {
                    contactMap.put(contact.Id, contact);
                }
            }

            for (EmailRequest req : emailRequests) {
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                
                email.setToAddresses(new List<String>{req.email});
                
                if (req.ccAddresses != null) {
                    List<String> ccEmails = parseEmailAddresses(req.ccAddresses);
                    email.setCcAddresses(ccEmails);
                }
                
                if (req.bccAddresses != null) {
                    List<String> bccEmails = parseEmailAddresses(req.bccAddresses);
                    email.setBccAddresses(bccEmails);
                }

                email.setSubject(req.subject);
                
                String processedBody = req.body;
                if (req.contactId != null) {
                    Contact contact = contactMap.get(req.contactId);
                    if (contact != null) {
                        processedBody = replaceMergeFields(req.body, contact);
                    }
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

                Marketing_Campaign__c campaignRecord = campaignMap.get(req.campaignId);
                if (campaignRecord != null) {
                    if (campaignRecord.Remaining_Emails__c != null && campaignRecord.Remaining_Emails__c > 0) {
                        campaignRecord.Remaining_Emails__c -= 1;
                        // campaignRecord.Total_Sent_Mails__c += 1;

                        if (campaignRecord.Remaining_Emails__c == 0) {
                            campaignRecord.Status__c = 'Completed';
                        } else if (campaignRecord.Status__c != 'In Progress') {
                            campaignRecord.Status__c = 'In Progress';
                        }
                    }
                }

                emails.add(email);
            }
    
    
            if (!emails.isEmpty()) {
                Messaging.sendEmail(emails);

                RefreshEvent__e event = new RefreshEvent__e();
                EventBus.publish(event);
            }
            
            // Update campaigns in the database
            if (!campaignMap.isEmpty()) {
                update campaignMap.values();
            }

        } catch (Exception e) {
            System.debug('Error in sendEmails ==> ' + e);
        }

    }

    /**
    * Method Name : parseEmailAddresses
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description :  getting email address for from the camapign data
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
    * @description : get all contact data 
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
    * @description : replace merge field value from the body
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
    * Method Name : EmailRequest
    * Date : 23/07/2024
    * Created By : Rachit Shah
    * @description : wrapper class for the getitng all the data
    */
    public class EmailRequest {
        @InvocableVariable(required=true description = 'Selected Contact Email address')
        public String email;

        @InvocableVariable(description='List of CC recipient email addresses')
        public String ccAddresses;
        
        @InvocableVariable(description='List of BCC recipient email addresses')
        public String bccAddresses;
        
        @InvocableVariable(required=true description='Subject of the email')
        public String subject;
        
        @InvocableVariable(required=true description='Body of the email')
        public String body;

        @InvocableVariable(required=true description='Campaign Id')
        public String campaignId;

        @InvocableVariable(required=true description='Contact Id for merge fields')
        public String contactId;
    }
}