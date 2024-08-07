/**
* Class Name : MarketingListCmpController
* Test Class : Pending
* Date : 21/06/2024
* Created By : Vyom Soni
* Last Modified Date : 08-07-2024
* Last Modified By : Vyom Soni
* @description : Used in the MarketingList lwc component
*/

public with sharing class MarketingListCmpController {
     /**
    * Class Name : WrapperClass
    * @description : this wrapper list set contacts and medias together.
    */
    public class WrapperClass{
        @AuraEnabled
        public List<Contact> contacts;         
    }

    /**
    * Method Name : getContactData
    * @description : for the retrieve the contact data.
    * @return List<Contact>.
    */
    @AuraEnabled
    public static WrapperClass getContactData(){
        if (!Schema.sObjectType.Contact.isAccessible()) {
        throw new AuraHandledException('You do not have permission to access Contact records.');
    }
        try {
            String contactFields = String.escapeSingleQuotes(getAllFields('Contact'));
            String query = 'SELECT ' + contactFields + ' ' +'FROM Contact';

        // Debug the constructed query
        System.debug('SOQL Query: ' + query);

        // Fetch the contacts with related records
        List<Contact> contacts = Database.query(query);

        WrapperClass wc = new WrapperClass();
        wc.contacts = contacts;         
        return wc;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

     /**
    * Method Name : getAllFields
    * @description : get all fields of the obeject.
    * @param sObjectName String sObject name value.
    * @return String of fields Name.
    */
    private static String getAllFields(String sObjectName) {
        // Get all fields of the given sObject
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap();
        List<String> fieldNames = new List<String>();
        
        for (String fieldName : fieldMap.keySet()) {
            // Check if the field is accessible
            if (fieldMap.get(fieldName).getDescribe().isAccessible()) {
                fieldNames.add(fieldName);
            }
        }
        
        // Join the field names into a single comma-separated string
        return String.join(fieldNames, ', ');
    }

    // Method to get form data based on recordId, objectName, and fieldSetName
     /**
    * Method Name : getForm
    * @description : get fields from the field-set and set into wrapper class.
    * @param recordId Id value.
    * @param objectName String Object Name value.
    * @param fieldSetName String field-set name value.
    * @return String of fields Name.
    */
    @AuraEnabled
    public static FieldSetForm getForm(Id recordId, String objectName, String fieldSetName) {
        System.debug('Entering getForm method');
        FieldSetForm form = new FieldSetForm();
        form.fieldsData = getFields(recordId, objectName, fieldSetName);
        System.debug('Exiting getForm method with form: ' + form);
        return form;
    }

    /**
    * Method Name : getFields
    * @description : for the retrieve the fields apiname and labels.
    * @param recordId Id value.
    * @param objectName String Object Name value.
    * @param fieldSetName String field-set name value.
    * @return List<FormField>.
    */
    @AuraEnabled
    public static List<FormField> getFields(Id recordId, String objectName, String fieldSetName) {
        System.debug('Entering getFields method');
        Schema.SObjectType objectType = null;

        // Determine the object type from the recordId or objectName
        if (recordId != null) {
            objectType = recordId.getSObjectType();
        } else if (String.isNotBlank(objectName)) {
            objectType = Schema.getGlobalDescribe().get(objectName);
        } else {
            throw new IllegalArgumentException('Both recordId and objectName cannot be null or empty');
        }

        if (objectType == null) {
            throw new IllegalArgumentException('Object type could not be determined from recordId or objectName');
        }

        // Describe the object and get the field set map
        Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();
        Map<String, Schema.FieldSet> fieldSetMap = objectDescribe.fieldSets.getMap();

        // Ensure the field set exists
        if (!fieldSetMap.containsKey(fieldSetName)) {
            throw new IllegalArgumentException('Field set name ' + fieldSetName + ' does not exist on object ' + objectType.getDescribe().getName());
        }

        // Get the fields from the field set
        Schema.FieldSet fieldSet = fieldSetMap.get(fieldSetName);
        List<Schema.FieldSetMember> fieldSetMembers = fieldSet.getFields();

        // Convert field set members to FormField objects
        List<FormField> fields = new List<FormField>();
        for (Schema.FieldSetMember fsm : fieldSetMembers) {
            fields.add(new FormField(fsm));
        }

        System.debug('Exiting getFields method with fields: ' + fields);
        return fields;
    }

     /**
    * Class Name : FieldSetForm
    * @description : this is wrapper class for set fieldsetdata.
    */
    public class FieldSetForm {
        @AuraEnabled
        public List<FormField> fieldsData { get; set; }

        public FieldSetForm() {
            fieldsData = new List<FormField>();
        }
    }

     /**
    * Class Name : FieldSetForm
    * @description : Inner class representing a field from the field set.
    */
    public class FormField {
        @AuraEnabled
        public String fieldName { get; set; }
        @AuraEnabled
        public String fieldLabel { get; set; }

        public FormField(Schema.FieldSetMember fieldSetMember) {
            this.fieldName = fieldSetMember.getFieldPath();
            this.fieldLabel = fieldSetMember.getLabel();
        }
    }

      /**
    * Class Name : sendEmail
    * @description : send to mass email
    */
    @AuraEnabled
    public static void sendEmail(String emailDataJson) {
        Map<String, Object> emailData = (Map<String, Object>) JSON.deserializeUntyped(emailDataJson);
        
        String sendMethod = (String) emailData.get('sendMethod');
        String templateId = (String) emailData.get('templateId');
        
        // Explicitly cast the contacts to the correct type
        List<Object> contactListRaw = (List<Object>) emailData.get('contacts');
        List<Map<String, Object>> contacts = new List<Map<String, Object>>();
        
        for (Object contactRaw : contactListRaw) {
            contacts.add((Map<String, Object>) contactRaw);
        }

        System.debug('contacts ==> ' + contacts);
        
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        Template__c template = [SELECT Id, Name, Label__c , Object_Name__c , Status__c, Template_Body__c, Template_Type__c, Description__c, CreatedDate, Template_pattern__c, Subject__c FROM Template__c WHERE Id = :templateId WITH SECURITY_ENFORCED];
        
        for (Map<String, Object> contact : contacts) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            String contactEmail = (String) contact.get('Email');
            
            if (contactEmail != null && contactEmail != '') {
                email.setToAddresses(new List<String>{contactEmail});
                email.setSubject(template.Subject__c);

                String processedBody = template.Template_Body__c;
                processedBody = replaceMergeFields(template.Template_Body__c, contact);

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
   
                System.debug('processedBody ==> ' + processedBody);
                emails.add(email);
            }
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }

    /**
    * Class Name : replaceMergeFields
    * @description : relace actual data with merge fields
    */
    private static String replaceMergeFields(String templateBody, Map<String, Object> contact) {
        try {
            Map<String, Schema.SObjectField> fieldMap = Schema.Contact.SObjectType.getDescribe().fields.getMap();
            Map<String, String> mergeFields = new Map<String, String>();
            
            for (String fieldName : fieldMap.keySet()) {
                String fieldToken = '{!Contact.' + fieldName + '}';
                String fieldValue = contact.containsKey(fieldName) ? String.valueOf(contact.get(fieldName)) : '{' + fieldName + ' is empty}';
                mergeFields.put(fieldToken, fieldValue != null ? fieldValue : '{' + fieldName + ' is empty}');
            }
    
            // Replace merge fields in the template
            for (String key : mergeFields.keySet()) {
                templateBody = templateBody.replace(key, mergeFields.get(key));
            }

            System.debug('templateBody ==> ' + templateBody);
    
            return templateBody;
        } catch (Exception e) {
            System.debug('Error in replaceMergeFields ==> ' + e);
            return templateBody;
        }
    }











}