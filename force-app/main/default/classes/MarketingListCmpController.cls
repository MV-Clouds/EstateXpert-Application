/**
* Class Name : ListingManagerController
* Date : 03-06-2024
* @description : Used in the ListingManager lwc component
*/

public with sharing class MarketingListCmpController {
    public class WrapperClass{
        @AuraEnabled
        public List<Contact> contacts;  
        // @AuraEnabled
        // public Map<Id, String> medias;        
    }
    /**
    * Method Name : getListingData
    * @description : for the retrieve the listing data.
    * @return List<Listing__c>.
    */
    @AuraEnabled
    public static WrapperClass getContactData(){
        if (!Schema.sObjectType.Contact.isAccessible()) {
        throw new AuraHandledException('You do not have permission to access Listing records.');
    }
        try {
            String contactFields = String.escapeSingleQuotes(getAllFields('Contact'));
            String query = 'SELECT ' + contactFields + ' ' +'FROM Contact';

        // Debug the constructed query
        System.debug('SOQL Query: ' + query);

        // Fetch the listings with related records
        List<Contact> contacts = Database.query(query);
        // Set<Id> propertyIds = new Set<Id>();     

        // for(Listing__c listingrec :listing) {
        //     Id propertyId = (Id)listingrec.get('Property__c');
        //     if (propertyId != null) {
        //         propertyIds.add(propertyId);
        //     }
        // }  

        // List<Property_File__c> medias = [SELECT Id, BaseUrl__c, Property__c FROM Property_File__c WHERE Property__c IN:propertyIds];

        // Map<Id, String> propertyMediaUrlsMap = new Map<Id, String>();
        // for (Property_File__c media : medias) {
        //         propertyMediaUrlsMap.put(media.Property__c,media.BaseUrl__c);
        // }


        WrapperClass wc = new WrapperClass();
        wc.contacts = contacts;
        // wc.medias = propertyMediaUrlsMap;          
        return wc;
            // List<Listing__c> listings = [SELECT Id,imageUrl__c,Name,Listing_Price__c,Bathrooms__c,Bedrooms__c,Size__c,	Status__c,Year_Built__c,City__c,Zip_Postal_Code__c,State__c,Street__c,Sq_Ft__c FROM Listing__c  WITH SECURITY_ENFORCED];
            // return listings;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

     /**
    * Method Name : getAllFields
    * @description : get all fields of the obeject.
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

    // Inner class representing a form field
    public class FieldSetForm {
        @AuraEnabled
        public List<FormField> fieldsData { get; set; }

        public FieldSetForm() {
            fieldsData = new List<FormField>();
        }
    }

    // Inner class representing a field from the field set
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

}