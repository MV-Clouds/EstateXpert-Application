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
        public Listing__c listing { get; set; }
        public Contact contact { get; set; }
        public Property__c property { get; set; }
        public Account account { get; set; }
        public RecordType recordtype { get; set; }
        public User createdby { get; set; }
        public User lastmodifyby { get; set; }
        
        public ListingWrapper(Listing__c listing, Contact contact, Property__c property , Account account,RecordType recordtype,User createdby,User lastmodifyby ) {
            this.listing = listing;
            this.contact = contact;
            this.property = property;
            this.account = account;
            this.recordtype = recordtype;
            this.createdby = createdby;
            this.lastmodifyby = lastmodifyby;
        }

        public String toJson() {
            Map<String, Object> result = new Map<String, Object>();
            result.put('Id', listing.Id);
            result.put('Name', listing.Name);
            result.put('Listing__c', getAllFieldsWithValues(listing));
            result.put('Contact__r', getAllFieldsWithValues(contact));
            result.put('Property__r', getAllFieldsWithValues(property));
            result.put('Account__r', getAllFieldsWithValues(account));
            result.put('RecordTypeId', getAllFieldsWithValues(recordtype));
            result.put('CreatedBy', getAllFieldsWithValues(createdby));
            result.put('LastModifiedById', getAllFieldsWithValues(lastmodifyby));
            return JSON.serialize(result);
        }

        private Map<String, Object> getAllFieldsWithValues(SObject obj) {
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
        String listingFields = String.escapeSingleQuotes(getAllFields('Listing__c'));
        String contactFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('Contact', 'Contact__r'));
        String propertyFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('Property__c', 'Property__r'));
        String accountFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('Account', 'Account__r'));
        String recordTypeFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('RecordType', 'RecordType'));
        String createdbyFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('User', 'CreatedBy'));
        String lastmodifybyFields =  String.escapeSingleQuotes(getAllFieldsWithPrefix('User', 'LastModifiedBy'));

        // Constructing the SOQL query
        String query = 'SELECT ' + listingFields + ', ' +
                       contactFields + ', ' +'Contact__r.HasOptedOutOfEmail'+ ', ' + 'Contact__r.HasOptedOutOfFax' + ', ' + 'Contact__r.DoNotCall' + ', '+ 'Contact__r.Pronouns' + ', '+ 'Contact__r.GenderIdentity' + ', '+
                       propertyFields + ', ' +
                       accountFields + ', ' +'Account__r.Tier'+', '+
                       recordTypeFields +', '+
                       createdbyFields + ', '+
                       lastmodifybyFields + ' '+
                       'FROM Listing__c';

        // Debug the constructed query
        System.debug('SOQL Query: ' + query);

        // Fetch the listings with related records
        List<Listing__c> listings = Database.query(query);

        // Iterate through the listings and create wrapper instances
        for (Listing__c listing : listings) {
            Contact relatedContact = listing.Contact__r;
            Property__c relatedProperty = listing.Property__r;
            Account relatedAccount= listing.Account__r;
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
    

       /**
    * Method Name : getAllFieldsWithPrefix
    * @description : get all fields with prefix.
    * @return String of fields Name.
    */
    private static String getAllFieldsWithPrefix(String sObjectName, String prefix) {
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
        String querylist = String.escapeSingleQuotes(getAllFields('Offer__c'));
        String query = 'SELECT ' + querylist+' '+
                       'FROM Offer__c';
        List<Offer__c> listings = Database.query(query);
        return listings;
    }
}