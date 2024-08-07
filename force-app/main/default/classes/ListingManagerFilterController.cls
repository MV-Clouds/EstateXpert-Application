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
    * @param ObjectApIName String value.
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
            }else{
                fieldDetails.referenceObjectName = objectApiName;
            }

            // Check if the field is a picklist
            if (fieldDescribe.getType() == Schema.DisplayType.Picklist) {
                List<PicklistValue> picklistValues = new List<PicklistValue>();
                for (Schema.PicklistEntry picklistEntry : fieldDescribe.getPicklistValues()) {
                    PicklistValue picklistValue = new PicklistValue();
                    picklistValue.label = picklistEntry.getLabel();
                    picklistValue.value = picklistEntry.getValue();
                    picklistValues.add(picklistValue);
                }
                fieldDetails.picklistValues = picklistValues;
            }

            // Add the field details object to the list
            fieldDetailsList.add(fieldDetails);
        }

        return fieldDetailsList;
    }

    /**
    * Class Name : FieldDetails
    * @description : this is a wrapper class to pass multiple values to the LWC component.
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
        @AuraEnabled
        public List<PicklistValue> picklistValues { get; set; }
    }

    /**
    * Class Name : PicklistValue
    * @description : this is a wrapper class to represent picklist values with label and value.
    */
    public class PicklistValue {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }
    }

    /**
    * Method Name : getPicklistValues
    * @description : get static fields picklist values.
    * @param apiName string field api name value.
    * @param objectName string object api name value.
    * @return List of picklist values.
    */
    @AuraEnabled
    public static List<Map<String, String>> getPicklistValues(String apiName ,String objectName) {
        String objectApiName =objectName ;
        String fieldApiName = apiName;
        List<Map<String, String>> picklistValues = new List<Map<String, String>>();
        
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
        Schema.DescribeSObjectResult describeSObjectResult = sObjectType.getDescribe();
        Schema.DescribeFieldResult describeFieldResult = describeSObjectResult.fields.getMap().get(fieldApiName).getDescribe();
        
        List<Schema.PicklistEntry> picklistEntries = describeFieldResult.getPicklistValues();
        
        for (Schema.PicklistEntry entry : picklistEntries) {
            picklistValues.add(new Map<String, String>{'label' => entry.getLabel(), 'value' => entry.getValue()});
        }     
        return picklistValues;
    }

    /**
    * Class Name : ListingWrapper
    * @description : this is a wrapper class to represent listing records with parent record.
    */
    public class ListingWrapper {
        public MVEX__Listing__c listing { get; set; }
        public Contact contact { get; set; }
        public MVEX__Property__c property { get; set; }
        public Account account { get; set; }
        public RecordType recordtype { get; set; }
        public User createdby { get; set; }
        public User lastmodifyby { get; set; }
        
        public ListingWrapper(MVEX__Listing__c listing, Contact contact,MVEX__Property__c property , Account account,RecordType recordtype,User createdby,User lastmodifyby ) {
            this.listing = listing;
            this.contact = contact;
            this.property = property;
            this.account = account;
            this.recordtype = recordtype;
            this.createdby = createdby;
            this.lastmodifyby = lastmodifyby;
        }

          /**
            * Method Name : toJson
            * @description : Convert the JSON data into string.
            * @return String of listing data.
            */
        public String toJson() {
            Map<String, Object> result = new Map<String, Object>();
            result.put('Id', listing.Id);
            result.put('Name', listing.Name);
            result.put('MVEX__Listing__c', getAllFieldsWithValues(listing));
            result.put('MVEX__Contact__r', getAllFieldsWithValues(contact));
            result.put('MVEX__Property__r', getAllFieldsWithValues(property));
            result.put('MVEX__Account__r', getAllFieldsWithValues(account));
            result.put('RecordTypeId', getAllFieldsWithValues(recordtype));
            result.put('CreatedBy', getAllFieldsWithValues(createdby));
            result.put('LastModifiedById', getAllFieldsWithValues(lastmodifyby));
            return JSON.serialize(result);
        }

         /**
            * Method Name : getAllFieldsWithValues
            * @description : Get all fields with value.
            * @param obj SObject value.
            * @return map of field-name within api-name.
            */
        public Map<String, Object> getAllFieldsWithValues(SObject obj) {
            Map<String, Object> fieldMap = new Map<String, Object>();
            if (obj != null) {
                for (SObjectField field : obj.getSObjectType().getDescribe().fields.getMap().values()) {
                    String fieldName = field.getDescribe().getName();
                    fieldMap.put(fieldName, obj.get(fieldName));
                }
            }
            return fieldMap;
        }
    }

     /**
    * Method Name : getListingsWithRelatedRecords
    * @description : get listing with related records.
    * @return List of picklist values.
    */
    @AuraEnabled
    public static List<String> getListingsWithRelatedRecords() {
        List<String> listingJsons = new List<String>();

        // Dynamically build the SOQL query to include all fields
        String listingFields = String.escapeSingleQuotes(getAllFields('MVEX__Listing__c'));
        String contactFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('Contact', 'MVEX__Contact__r'));
        String propertyFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('MVEX__Property__c', 'MVEX__Property__r'));
        String accountFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('Account', 'MVEX__Account__r'));
        String recordTypeFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('RecordType', 'RecordType'));
        String createdbyFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('User', 'CreatedBy'));
        String lastmodifybyFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('User', 'LastModifiedBy'));

        // Constructing the SOQL query
        String query = 'SELECT ' + listingFields + ', ' +
                       contactFields + ', ' +'MVEX__Contact__r.HasOptedOutOfEmail'+ ', ' + 'MVEX__Contact__r.HasOptedOutOfFax' + ', ' + 'MVEX__Contact__r.DoNotCall' + ', '+ 'MVEX__Contact__r.Pronouns' + ', '+ 'MVEX__Contact__r.GenderIdentity' + ', '+
                       propertyFields + ', ' +
                       accountFields + ', ' +'MVEX__Account__r.Tier'+', '+
                       recordTypeFields +', '+
                       createdbyFields + ', '+
                       lastmodifybyFields + ' '+
                       'FROM MVEX__Listing__c';

        // Debug the constructed query
        System.debug('SOQL Query: ' + query);

        // Fetch the listings with related records
        List<Listing__c> listings = Database.query(query);

        // Iterate through the listings and create wrapper instances
        for (Listing__c listing : listings) {
            Contact relatedContact = listing.MVEX__Contact__r;
            Property__c relatedProperty = listing.MVEX__Property__r;
            Account relatedAccount= listing.MVEX__Account__r;
            RecordType relatedRecordType= listing.RecordType;
            User relatedCreatedBy= listing.CreatedBy;
            User relatedLastModifiedBy= listing.LastModifiedBy;
            ListingWrapper lw = new ListingWrapper(listing, relatedContact, relatedProperty,relatedAccount,relatedRecordType,relatedCreatedBy,relatedLastModifiedBy);
            listingJsons.add(lw.toJson());
        }

        // Debug the listing wrapper records
        System.debug('Listing Wrappers JSON: ' + listingJsons);

        return listingJsons;
    }

    
     /**
    * Method Name : getAllFields
    * @description : get all fields of the obeject.
    * @param sObjectName String value object name.
    * @return String of fields Name.
    */
    public static String getAllFields(String sObjectName) {
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
    

       /**
    * Method Name : getAllFieldsWithPrefix
    * @description : get all fields with prefix.
    * @param sObjectName String value object name.
    * @param prefix String value prefix value.
    * @return String of fields Name.
    */
    public static String getAllFieldsWithPrefix(String sObjectName, String prefix) {
        // Get all fields of the given sObject and prefix them for a parent relationship query
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(sObjectName).getDescribe().fields.getMap();
        List<String> fieldNames = new List<String>();
        
        for (String fieldName : fieldMap.keySet()) {
            // Check if the field is accessible
            if (fieldMap.get(fieldName).getDescribe().isAccessible()) {
                fieldNames.add(prefix + '.' + fieldName);
            }
        }
        
        // Join the field names into a single comma-separated string
        return String.join(fieldNames, ', ');
    }

   /**
    * Method Name : getTheOfferRecords
    * @description : get all offer records.
    * @return String of fields Name.
    */
    @AuraEnabled
    public static List<Offer__c> getTheOfferRecords(){
        String querylist = String.escapeSingleQuotes(getAllFields('MVEX__Offer__c'));
        String query = 'SELECT ' + querylist+' '+
                       'FROM MVEX__Offer__c WHERE MVEX__Listing__c != NULL';
        List<Offer__c> listings = Database.query(query);
        return listings;
    }

    /**
    * Method Name : getStaticFields
    * @description : get the static fields from the custom metadata.
    * @return String of JSON data.
    */
    @AuraEnabled
    public static String getStaticFields() {
        ListingManagerFilterConfig__mdt filterConfig = [SELECT StaticFields__c FROM ListingManagerFilterConfig__mdt LIMIT 1];
        return filterConfig.StaticFields__c;
    }
}