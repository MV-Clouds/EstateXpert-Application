/*******************************************************************************************
@Name Estate_GeneratePdfController
@Author Harsh Vora <harsh200453@gmail.com>
@Date 05/06/2024
@Description Controller class for handling PDF generation and insertion.
            Generates PDF from HTML content and inserts it as a ContentVersion.
            Utilizes an external API for PDF conversion.
*******************************************************************************************/

/* MODIFICATION LOG
Version    Developer        Date        Description
1.0        Harsh Vora     05/06/2024  Initial Creation
*/

public with sharing class Estate_GeneratePdfController {
    public String htmlContent { get; set; }
    public Map<String, String> listingMap { get; set; }

    private static final String API_KEY = 'harsh200453@gmail.com_9qUFTKqmxfWuNCiW6OH7mb638IsC4dn0qLs9nz9y1j11nCtOB0iD5pNADEqd4mx2';

    /*
    * Method Name: getRecords
    * @description: Retrieves records from the Property_template__c object with security enforcement.
    * @return: List of Property_template__c records.
    */
    @AuraEnabled(cacheable=true)
    public static List<Property_template__c> getRecords() {
        try {
            return [SELECT Id, Name, HTML__c FROM Property_template__c];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching records from Property_template__c: ' + e.getMessage());
        }
    }
        
    /*
    * Method Name: Estate_GeneratePdfController
    * @description: Constructor for Estate_GeneratePdfController class. This constructor initializes the controller by performing the following tasks:
    * - Checks access permissions for Listing__c and Property_template__c objects.
    * - Dynamically retrieves all fields of Listing__c and constructs a SOQL query to fetch the record with the given recordId.
    * - Maps the retrieved field values to a map.
    * - Fetches the HTML template from Property_template__c using the selectedId.
    * - Replaces placeholders in the HTML template with the corresponding field values from the map.
    * @param selectedId: Id of the selected Property_template__c record.
    * @param recordId: Id of the Listing__c record to be queried.
    */
    public Estate_GeneratePdfController(String selectedId, String recordId) {
        try {
            listingMap = new Map<String, String>();

            // Check access to Listing__c object
            if (!Schema.sObjectType.Listing__c.isAccessible()) {
                throw new SecurityException('No access to Listing__c');
            }

            // Step 1: Get all fields of Listing__c dynamically
            Schema.SObjectType listingSchema = Listing__c.SObjectType;
            Map<String, Schema.SObjectField> fieldMap = listingSchema.getDescribe().fields.getMap();

            // Step 2: Build dynamic SOQL query
            String fields = '';
            for (String fieldName : fieldMap.keySet()) {
                fields += fieldName + ',';
            }
            fields = fields.substring(0, fields.length() - 1); // Remove trailing comma
            System.debug(fields);

            // Step 3: Execute the dynamic query
            String query = 'SELECT ' + fields + ' FROM Listing__c WHERE Id = :recordId LIMIT 1';
            System.debug(query);
            List<Listing__c> listing = Database.query(query);
            System.debug(listing);

            // Step 4: Map field values dynamically
            if (!listing.isEmpty()) {
                Listing__c listItem = listing[0];
                System.debug(listItem);
                for (String fieldName : fieldMap.keySet()) {
                    Object value = listItem.get(fieldName);
                    System.debug(value);
                    listingMap.put(fieldName, value != null ? String.valueOf(value) : '');
                }
            }

            // Step 5: Security check for Property_template__c
            if (!Schema.sObjectType.Property_template__c.isAccessible()) {
                throw new SecurityException('No access to Property_template__c');
            }

            // Step 6: Query Property_template__c
            List<Property_template__c> propList = [SELECT HTML__c FROM Property_template__c WHERE Id = :selectedId LIMIT 1];
            if (!propList.isEmpty()) {
                htmlContent = propList[0].HTML__c;
                if (htmlContent != null) {
                    System.debug(listingMap.keySet());
                    for (String key : listingMap.keySet()) {
                        System.debug(listingMap.get(key));
                        htmlContent = htmlContent.replace('{{Listing__c.' + key + '}}', listingMap.get(key) != null ? listingMap.get(key) : '');
                    }
                    System.debug(htmlContent);
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error initializing PDFController: ' + e.getMessage());
        }
    }

    /*
    * Method Name: convertHtmlToPdf
    * @description: Converts HTML content to PDF using an external service.
    * @param htmlContent: HTML content to be converted.
    * @return: HttpResponse containing the converted PDF.
    */
    public static HttpResponse convertHtmlToPdf(String htmlContent) {
        try {
            String endPointURL = 'https://api.pdf.co/v1/pdf/convert/from/html';
            Http http = new Http();
            HttpRequest request = new HttpRequest();

            String authHeader = 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(API_KEY + ':'));
            request.setHeader('Authorization', authHeader);

            request.setEndpoint(endPointURL);
            request.setMethod('POST');
            request.setHeader('Content-Type', 'application/json');

            String escapedHtmlContent = escapeJsonString(htmlContent);
            String requestBody = '{"html": "' + escapedHtmlContent + '"}';

            request.setBody(requestBody);
            request.setTimeout(60000);

            HttpResponse response = http.send(request);
            return response;
        } catch (Exception e) {
            throw new AuraHandledException('Error converting HTML to PDF: ' + e.getMessage());
        }
    }

    /*
    * Method Name: escapeJsonString
    * @description: Escapes special characters in a JSON string.
    * @param str: Input string.
    * @return: Escaped JSON string.
    */
    public static String escapeJsonString(String str) {
        try {
            if (str == null) return '';
            str = str.replace('\\', '\\\\');
            str = str.replace('"', '\\"');
            str = str.replace('\b', '\\b');
            str = str.replace('\f', '\\f');
            str = str.replace('\n', '\\n');
            str = str.replace('\r', '\\r');
            str = str.replace('\t', '\\t');
            return str;
        } catch (Exception e) {
            throw new AuraHandledException('Error escaping JSON string: ' + e.getMessage());
        }
    }

    /*
    * Method Name: generateAndConvertPdf
    * @description: Generates and converts HTML content to PDF and returns the PDF URL.
    * @param selectedId: Id of the selected Property_template__c record.
    * @param recordId: Id of the Listing__c record.
    * @return: PDF URL if successful, error message otherwise.
    */
    @AuraEnabled
    public static String generateAndConvertPdf(String selectedId, String recordId) {
        try {
            if (String.isEmpty(selectedId) || String.isEmpty(recordId)) {
                throw new IllegalArgumentException('SelectedId and RecordId must be provided.');
            }

            // Initialize PDFController and retrieve HTML content
            Estate_GeneratePdfController controller = new Estate_GeneratePdfController(selectedId, recordId);
            String htmlContent = controller.htmlContent;

            if (String.isNotEmpty(htmlContent)) {
                // Convert HTML content to PDF
                HttpResponse response = convertHtmlToPdf(htmlContent);

                if (response.getStatusCode() == 200) {
                    // Retrieve PDF URL from response
                    String responseBody = response.getBody();
                    Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
                    String pdfUrl = (String) responseMap.get('url');

                    return pdfUrl;
                } else {
                    return 'PDF conversion failed with status code: ' + response.getStatusCode() + '. Response: ' + response.getBody();
                }
            } else {
                return 'HTML content is empty. Cannot convert to PDF.';
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error generating and converting PDF: ' + e.getMessage());
        }
    }

    /*
    * Method Name: fetchPdfBlobFromUrl
    * @description: Fetches PDF Blob from the given URL.
    * @param pdfUrl: URL of the PDF.
    * @return: PDF Blob.
    */
    public static Blob fetchPdfBlobFromUrl(String pdfUrl) {
        try {
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(pdfUrl);
            req.setMethod('GET');
            req.setTimeout(60000);
            HttpResponse res = http.send(req);
            return res.getBodyAsBlob();
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching PDF Blob from URL: ' + e.getMessage());
        }
    }

    /*
    * Method Name: insertPdfAsContentVersion
    * @description: Inserts PDF as ContentVersion and creates ContentDocumentLink.
    * @param recordId: Id of the Listing__c record.
    * @param pdfBlob: Blob data of the PDF.
    * @return: ContentDocumentId of the inserted PDF.
    */
    public static String insertPdfAsContentVersion(String recordId, Blob pdfBlob) {
        try {
            // Query the Listing__c record
            Listing__c listing = [SELECT Name FROM Listing__c WHERE Id = :recordId LIMIT 1];
            if (listing == null) {
                throw new AuraHandledException('Listing not found for recordId: ' + recordId);
            }
    
            // Create a new ContentVersion
            ContentVersion cv = new ContentVersion();
            cv.Title = listing.Name + '.pdf';
            cv.PathOnClient = listing.Name + '.pdf';
            cv.VersionData = pdfBlob;
            cv.FirstPublishLocationId = recordId;
            insert cv;
    
            // Create a new ContentDocumentLink
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id].ContentDocumentId;
            cdl.LinkedEntityId = recordId;
            cdl.ShareType = 'V';
            cdl.Visibility = 'AllUsers';
            insert cdl;
    
            return cdl.ContentDocumentId;
        } catch (Exception e) {
            // Log the exception message
            System.debug('Error inserting PDF as ContentVersion: ' + e.getMessage());
            // Rethrow the exception or handle it as needed
            throw new AuraHandledException('Error inserting PDF as ContentVersion: ' + e.getMessage());
        }
    }
    

    /*
    * Method Name: generateAndInsertPdf
    * @description: Generates, converts, and inserts PDF into ContentVersion with associated ContentDocumentLink.
    * @param selectedId: Id of the selected Property_template__c record.
    * @param recordId: Id of the Listing__c record.
    * @return: ContentDocumentId of the inserted PDF.
    */
    @AuraEnabled
    public static String generateAndInsertPdf(String selectedId, String recordId) {
        try {
            // Generate the PDF URL
            String pdfUrl = generateAndConvertPdf(selectedId, recordId);

            // Fetch the PDF Blob from the URL
            Blob pdfBlob = fetchPdfBlobFromUrl(pdfUrl);

            // Insert the PDF as a ContentVersion
            ContentVersion contentVersion = new ContentVersion();
            contentVersion.Title = 'Generated PDF';
            contentVersion.PathOnClient = 'GeneratedPDF.pdf';
            contentVersion.VersionData = pdfBlob;
            insert contentVersion;

            // Get the ContentDocumentId
            Id contentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id].ContentDocumentId;

            // Check if the link already exists
            List<ContentDocumentLink> existingLinks = [SELECT Id FROM ContentDocumentLink WHERE ContentDocumentId = :contentDocumentId AND LinkedEntityId = :recordId];
            if (existingLinks.isEmpty()) {
                // Create a new ContentDocumentLink
                ContentDocumentLink contentDocumentLink = new ContentDocumentLink();
                contentDocumentLink.ContentDocumentId = contentDocumentId;
                contentDocumentLink.LinkedEntityId = recordId;
                contentDocumentLink.ShareType = 'V';
                insert contentDocumentLink;
            } else {
                System.debug('ContentDocumentLink already exists');
            }

            return contentDocumentId;
        } catch (Exception e) {
            throw new AuraHandledException('Error generating and inserting PDF: ' + e.getMessage());
        }
    }
}