/**
* Class Name : ListingManagerController
* Date : 03-06-2024
* @description : Used in the ListingManager lwc component
*/

public with sharing class ListingManagerController {

    /**
    * Method Name : getListingData
    * @description : for the retrieve the listing data.
    * @return List<Listing__c>.
    */
    @AuraEnabled
    public static List<Listing__c> getListingData(){
        if (!Schema.sObjectType.Listing__c.isAccessible()) {
        throw new AuraHandledException('You do not have permission to access Listing records.');
    }
        try {
            List<Listing__c> listings = [SELECT Id,imageUrl__c,Name,Name__c,Listing_Price__c,Number_Of_Bathrooms__c,Number_Of_Bedrooms__c,Size__c,	Status__c,Year_Built__c,City__c,Country__c,Postal_Code__c,State__c,Street__c,Sq_Ft__c FROM Listing__c  WITH SECURITY_ENFORCED];
            return listings;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
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