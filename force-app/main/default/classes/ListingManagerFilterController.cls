/**
* Class Name : ListingManagerFilterController
* Test Class : Pending
* Created By : Vyom Soni
* Last Modified Date : 07-06-2024
* Last Modified By : Vyom Soni
* @description : Used in portalMappingComponent and portalMappingLandingPage LWC components
*/

public without sharing class ListingManagerFilterController {

     /**
    * Method Name : getListingFields
    * @description : get the fields by parent object name.
    * @return List of Fields of all references of Listing.
    */
    @AuraEnabled
    public static List<FieldDetails> getListingFields(String objectApiName) {
        List<FieldDetails> fieldDetailsList = new List<FieldDetails>();

        // Get the Describe result for the given object
        Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();

        // Get the fields map for the object
        Map<String, Schema.SObjectField> fieldsMap = objDescribe.fields.getMap();

        // Iterate through each field
        for (String fieldName : fieldsMap.keySet()) {
            Schema.SObjectField field = fieldsMap.get(fieldName);
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();

            // Create a new FieldDetails object for each field
            FieldDetails fieldDetails = new FieldDetails();
            fieldDetails.fieldName = fieldDescribe.getLabel();
            fieldDetails.fieldAPIName = fieldDescribe.getName();
            fieldDetails.fieldType = String.valueOf(fieldDescribe.getType());

            // Check if the field is a reference field
            if (fieldDescribe.getType() == Schema.DisplayType.Reference) {
                // Get the reference to the related objects
                List<Schema.SObjectType> referenceTo = fieldDescribe.getReferenceTo();
                if (!referenceTo.isEmpty()) {
                    fieldDetails.referenceObjectName = referenceTo[0].getDescribe().getName();
                }
            }

            // Add the field details object to the list
            fieldDetailsList.add(fieldDetails);
        }

        return fieldDetailsList;
    }

     /**
    * Class Name : FieldDetails
    * @description : this is wrapper class for the pass mutiple value to lwc component.
    * @return List of Fields of all references of Listing.
    */
    public class FieldDetails {
        @AuraEnabled
        public String fieldName { get; set; }
        @AuraEnabled
        public String fieldAPIName { get; set; }
        @AuraEnabled
        public String fieldType { get; set; }
        @AuraEnabled
        public String referenceObjectName { get; set; }
    }
}
