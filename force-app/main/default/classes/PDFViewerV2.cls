// public with sharing class PDFViewerV2 {
//     public String htmlContent { get; set; }
//     public Map<String, String> listingMap { get; set; }
//     public String selectedId { get; set; }
//     public String recordId { get; set; }

//     public PDFViewerV2() {
//         selectedId = ApexPages.currentPage().getParameters().get('selectedId');
//         recordId = ApexPages.currentPage().getParameters().get('recordId');
//         htmlContent = initialize(selectedId, recordId);
//     }

//     @AuraEnabled
//     public static String initialize(String selectedId, String recordId) {
//         try {
//             System.debug(selectedId);
//             System.debug(recordId);
//             Map<String, String> listingMap = new Map<String, String>();
//             String htmlContent;
//             // Check access to Listing__c object
//             if (!Schema.sObjectType.Listing__c.isAccessible()) {
//                 throw new SecurityException('No access to Listing__c');
//             }

//             // Step 1: Get all fields of Listing__c dynamically
//             Schema.SObjectType listingSchema = Listing__c.SObjectType;
//             Map<String, Schema.SObjectField> fieldMap = listingSchema.getDescribe().fields.getMap();
//             System.debug(fieldMap);
//             // Step 2: Build dynamic SOQL query
//             String fields = '';
//             for (String fieldName : fieldMap.keySet()) {
//                 fields += fieldName + ',';
//             }
//             fields = fields.substring(0, fields.length() - 1); // Remove trailing comma
//             System.debug(fields);
//             // Step 3: Execute the dynamic query
//             String query = 'SELECT ' + fields + ' FROM Listing__c WHERE Id = :recordId LIMIT 1';
//             List<Listing__c> listing = Database.query(query);
//             System.debug(listing);
//             // Step 4: Map field values dynamically
//             if (!listing.isEmpty()) {
//                 Listing__c listItem = listing[0];
//                 for (String fieldName : fieldMap.keySet()) {
//                     Object value = listItem.get(fieldName);
//                     listingMap.put(fieldName, value != null ? String.valueOf(value) : '');
//                 }
//                 System.debug(listItem);
//             }

//             // Step 5: Security check for Property_template__c
//             if (!Schema.sObjectType.Property_template__c.isAccessible()) {
//                 throw new SecurityException('No access to Property_template__c');
//             }

//             // Step 6: Query Property_template__c
//             List<Property_template__c> propList = [SELECT HTML__c FROM Property_template__c WHERE Id = :selectedId LIMIT 1];
//             if (!propList.isEmpty()) {
//                 htmlContent = propList[0].HTML__c; // Assign directly to the class-level variable
//                 if (htmlContent != null) {
//                     for (String key : listingMap.keySet()) {
//                         htmlContent = htmlContent.replace('{{Listing__c.' + key + '}}', listingMap.get(key) != null ? listingMap.get(key) : '');
//                     }
//                 }
//                 System.debug('htmlContent ===> ' + htmlContent);
//             }
//             return htmlContent;
//         } catch (Exception e) {
//             throw new AuraHandledException('Error initializing PDFController: ' + e.getMessage());
//         }
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<Property_template__c> getRecords() {
//         if (!Schema.sObjectType.Property_template__c.isAccessible()) {
//             throw new SecurityException('No access to Property_template__c');
//         }
//         return [SELECT Id, Name, HTML__c FROM Property_template__c];
//     }
// }
// public class PDFViewerV2 {
//     public String htmlContent { get; set; }
//     public Map<String, String> listingMap { get; set; }
//     public String selectedId { get; set; }
//     public String recordId { get; set; }

//     public PDFViewerV2() {
//         selectedId = ApexPages.currentPage().getParameters().get('selectedId');
//         recordId = ApexPages.currentPage().getParameters().get('recordId');
//         if (String.isBlank(selectedId) || String.isBlank(recordId)) {
//             // Handle null or blank values for selectedId or recordId
//             throw new AuraHandledException('Error initializing PDFViewerV2: selectedId or recordId is null or blank.');
//         }
//         htmlContent = initialize(selectedId, recordId);
//     }

//     @AuraEnabled
//     public static String initialize(String selectedId, String recordId) {
//         try {
//             Map<String, String> listingMap = new Map<String, String>();
//             // Check access to Listing__c object
//             if (!Schema.sObjectType.Listing__c.isAccessible()) {
//                 throw new SecurityException('No access to Listing__c');
//             }

//             // Dynamic SOQL to get Listing__c fields
//             Schema.SObjectType listingSchema = Listing__c.SObjectType;
//             Map<String, Schema.SObjectField> fieldMap = listingSchema.getDescribe().fields.getMap();
//             List<String> fieldNames = new List<String>(fieldMap.keySet());
//             String fields = String.join(fieldNames, ',');
//             String query = 'SELECT ' + fields + ' FROM Listing__c WHERE Id = :recordId LIMIT 1';
//             List<Listing__c> listing = Database.query(query);

//             if (!listing.isEmpty()) {
//                 Listing__c listItem = listing[0];
//                 for (String fieldName : fieldNames) {
//                     Object value = listItem.get(fieldName);
//                     listingMap.put(fieldName, value != null ? String.valueOf(value) : '');
//                 }
//                 System.debug(listItem);
//             }

//             // Check access to Property_template__c object
//             if (!Schema.sObjectType.Property_template__c.isAccessible()) {
//                 throw new SecurityException('No access to Property_template__c');
//             }

//             // Query Property_template__c
//             List<Property_template__c> propList = [SELECT HTML__c FROM Property_template__c WHERE Id = :selectedId LIMIT 1];
//             if (!propList.isEmpty()) {
//                 String htmlContent = propList[0].HTML__c;
//                 if (!String.isEmpty(htmlContent)) {
//                     // Additional replacements for dynamic content
//                     for (String key : listingMap.keySet()) {
//                         htmlContent = htmlContent.replace('{{Listing__c.' + key + '}}', listingMap.get(key) != null ? listingMap.get(key) : '');
//                     }
//                 }
//                 return htmlContent;
//             } else {
//                 throw new AuraHandledException('Property_template__c record not found.');
//             }
//         } catch (Exception e) {
//             throw new AuraHandledException('Error initializing PDFViewerV2: ' + e.getMessage());
//         }
//     }

//     @AuraEnabled(cacheable=true)
//     public static List<Property_template__c> getRecords() {
//         if (!Schema.sObjectType.Property_template__c.isAccessible()) {
//             throw new SecurityException('No access to Property_template__c');
//         }
//         return [SELECT Id, Name, HTML__c FROM Property_template__c];
//     }
// }

public class PDFViewerV2 {
    public String htmlContent { get; set; }
    public Map<String, String> listingMap { get; set; }
    public String selectedId { get; set; }
    public String recordId { get; set; }

    public PDFViewerV2() {
        selectedId = ApexPages.currentPage().getParameters().get('selectedId');
        recordId = ApexPages.currentPage().getParameters().get('recordId');
        if (String.isBlank(selectedId) || String.isBlank(recordId)) {
            // Handle null or blank values for selectedId or recordId
            throw new AuraHandledException('Error initializing PDFViewerV2: selectedId or recordId is null or blank.');
        }
        htmlContent = initialize(selectedId, recordId);
    }

    @AuraEnabled
    public static String initialize(String selectedId, String recordId) {
        try {
            Map<String, String> listingMap = new Map<String, String>();
            // Check access to Listing__c object
            if (!Schema.sObjectType.Listing__c.isAccessible()) {
                throw new SecurityException('No access to Listing__c');
            }

            // Dynamic SOQL to get Listing__c fields
            Schema.SObjectType listingSchema = Listing__c.SObjectType;
            Map<String, Schema.SObjectField> fieldMap = listingSchema.getDescribe().fields.getMap();
            List<String> fieldNames = new List<String>(fieldMap.keySet());
            String fields = String.join(fieldNames, ',');
            String query = 'SELECT ' + fields + ' FROM Listing__c WHERE Id = :recordId LIMIT 1';
            List<Listing__c> listing = Database.query(query);

            if (!listing.isEmpty()) {
                Listing__c listItem = listing[0];
                for (String fieldName : fieldNames) {
                    Object value = listItem.get(fieldName);
                    listingMap.put(fieldName, value != null ? String.valueOf(value) : '');
                }
                System.debug(listItem);
            }

            // Check access to Property_template__c object
            if (!Schema.sObjectType.Property_template__c.isAccessible()) {
                throw new SecurityException('No access to Property_template__c');
            }

            // Query Property_template__c
            List<Property_template__c> propList = [SELECT HTML__c FROM Property_template__c WHERE Id = :selectedId LIMIT 1];
            if (!propList.isEmpty()) {
                String htmlContent = propList[0].HTML__c;
                if (!String.isEmpty(htmlContent)) {
                    // Replace image placeholder with ContentVersion data
                    htmlContent = replaceImagePlaceholder(htmlContent, listingMap.get('image_c'));
                }
                return htmlContent;
            } else {
                throw new AuraHandledException('Property_template__c record not found.');
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error initializing PDFViewerV2: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Property_template__c> getRecords() {
        if (!Schema.sObjectType.Property_template__c.isAccessible()) {
            throw new SecurityException('No access to Property_template__c');
        }
        return [SELECT Id, Name, HTML__c FROM Property_template__c];
    }

    // Method to replace image placeholder with ContentVersion data
    private static String replaceImagePlaceholder(String htmlContent, String contentDocumentId) {
        System.debug(contentDocumentId);
        String imageDataUri = getImageDataUriFromDocumentId(contentDocumentId);
        if (imageDataUri != null) {
            return htmlContent.replace('{{Listing__c.image_c}}', imageDataUri);
        } else {
            // Handle if image data is not found
            return htmlContent;
        }
    }

    // Method to get image data URI from ContentDocumentId
    private static String getImageDataUriFromDocumentId(String contentDocumentId) {
        String imageDataUri;
        // Query ContentVersion to get VersionData
        ContentVersion[] versions = [SELECT Id,FileType,VersionData FROM ContentVersion ORDER BY CreatedDate DESC LIMIT 1];
        System.debug(versions);
        if (!versions.isEmpty()) {
            Blob imageBlob = versions[0].VersionData;
            String contentType = versions[0].FileType;
            //imageDataUri = 'data:' + contentType + ';base64,' + EncodingUtil.base64Encode(imageBlob);
            imageDataUri = 'data:image'+';base64,' + EncodingUtil.base64Encode(imageBlob);
            System.debug(imageDataUri);
        } else {
            // Handle if ContentVersion is not found
            imageDataUri = null;
        }
        system.debug('imageDataUri>>'+imageDataUri);
        return imageDataUri;
    }
}