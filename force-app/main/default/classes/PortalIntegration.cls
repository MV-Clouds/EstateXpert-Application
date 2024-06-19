public with sharing class PortalIntegration {
    
    @AuraEnabled
    public static void getListingRecordForSync(String listingId) {
        try {
            List<Portal__c> portalZoopla = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c 
                                            FROM Portal__c 
                                            WHERE generator__c = 'Zoopla' AND Is_Active__c = true WITH SECURITY_ENFORCED 
                                            LIMIT 1];

            if (!portalZoopla.isEmpty()) {
                Portal__c zooplaPortal = portalZoopla[0];

                Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Field_Mapping__c);
                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Portal_Configuration__c);
                Map<String, Object> finalMapping = new Map<String, Object>();
                Boolean isSandbox = true; // Initialize with a default value

                if (configMap.containsKey('branch_reference')) {
                    finalMapping.put('branch_reference', configMap.get('branch_reference'));
                }
                if (configMap.containsKey('is_test_portal')) {
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    // Ensure the value can be correctly converted to a Boolean
                    if (isTestPortalValue instanceof Boolean) {
                        isSandbox = (Boolean) isTestPortalValue;
                    } else if (isTestPortalValue instanceof String) {
                        isSandbox = Boolean.valueOf((String) isTestPortalValue);
                    }
                }

                List<String> fieldNames = new List<String>();
                for (String key : jsonMap.keySet()) {
                    String value = (String) jsonMap.get(key);
                    fieldNames.add(value);
                    System.debug('fieldNames-->' + fieldNames);
                }

                String query = 'SELECT Id, Property__c';
                for (String fieldName : fieldNames) {
                    query += ', ' + fieldName;
                }
                query += ' FROM Listing__c WHERE Id = :listingId';

                List<SObject> records = Database.query(query);
                System.debug('records-->' + records);
                if (!records.isEmpty()) {
                    SObject listingRecord = records[0];
                    String propertyId = (String) listingRecord.get('Property__c');
                    List<Property_File__c> media = [SELECT Id, BaseUrl__c, ExternalLink__c, Tags__c 
                                                    FROM Property_File__c 
                                                    WHERE Property__c = :propertyId AND IsOnPortalFeed__c = true 
                                                    WITH SECURITY_ENFORCED 
                                                    ORDER BY Sort_on_Portal_Feed__c ASC NULLS LAST, Name ASC];
                    for (String key : jsonMap.keySet()) {
                        String value = (String) jsonMap.get(key);
                        System.debug('value-->' + value);
                        finalMapping.put(key, listingRecord.get(value));
                    }
                    System.debug('finalMapping--> ' + finalMapping);

                    String finalMappingStr = JSON.serialize(finalMapping);
                    String mediaStr = JSON.serialize(media);

                    zooplaCreateAndUpdateListing(finalMappingStr, portalZoopla[0].Id, records[0].Id, mediaStr, isSandbox);
                }
            }
        } catch (Exception e) {
            System.debug('error getListingRecordForSync -->' + e.getMessage());
            System.debug('error getListingRecordForSync -->' + e.getLineNumber());
        }
    }

    public static void zooplaGetListing(String branchRef, Boolean isSandbox) {
        try {
            String endpoint;
            if (isSandbox) {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/list';
            } else {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/listing/list';
            }
            Http h3 = new Http();
            HttpRequest req3 = new HttpRequest();
            
            req3.setClientCertificateName('zoopla_certificate');
            req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.0/schemas/listing/list.json');
            req3.setBody('{ "branch_reference": "' + branchRef + '" }');
            req3.setMethod('POST');
            req3.setEndpoint(endpoint);
            
            HttpResponse res3 = h3.send(req3);
            
            System.debug('Response Status: ' + res3.getStatus());
            System.debug('Response Body: ' + res3.getBody());
            
            if (res3.getStatusCode() == 200) {
                String responseBody = res3.getBody();
            } else {
                System.debug('Request failed with status code: ' + res3.getStatusCode());
                System.debug('Error Response: ' + res3.getBody());
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
    }

    @future(callout= true)
    public static void zooplaCreateAndUpdateListing(String finalMappingStr, String portalId, String listingId, String mediaStr, Boolean isSandbox) {
        System.debug('inside --> zooplaCreateAndUpdateListing');
        try {

            Map<String, Object> finalMapping = (Map<String, Object>) JSON.deserializeUntyped(finalMappingStr);
            List<Property_File__c> media = (List<Property_File__c>) JSON.deserialize(mediaStr, List<Property_File__c>.class);

            String requestBody = JSONBuilder.createInputData(finalMapping, media);
            System.debug('requestBody---> '+requestBody);
            String endpoint;
            if (isSandbox) {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/update';
            } else {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/listing/update';
            }
            
            Http h3 = new Http();
            HttpRequest req3 = new HttpRequest();
            
            req3.setClientCertificateName('zoopla_certificate');
            req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.0/schemas/listing/update.json');
            req3.setHeader('ZPG-Listing-ETag', '');
            req3.setBody(requestBody);
            req3.setMethod('POST');
            req3.setEndpoint(endpoint);
            
            HttpResponse res3 = h3.send(req3);
            
            System.debug('Response Status: ' + res3.getStatus());
            System.debug('Response Body: ' + res3.getBody());
            
            List<PortalListing__c> portalListing = [SELECT Id, Portal__c, Listing__c, SystemIsActive__c, API_Response__c FROM PortalListing__c WHERE SystemIsActive__c = true AND Portal__c =: portalId AND Listing__c =: listingId LIMIT 1];

            if (res3.getStatusCode() == 200) {
                String responseBody = res3.getBody();
                if (!portalListing.isEmpty()) {
                    portalListing[0].API_Response__c = responseBody;
                    update portalListing;
                }
            } else {
                System.debug('Request failed with status code: ' + res3.getStatusCode());
                System.debug('Error Response: ' + res3.getBody());
                String responseBody = res3.getBody();
                if (!portalListing.isEmpty()) {
                    portalListing[0].API_Response__c = responseBody;
                    update portalListing;
                }
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
    }

    public static void zooplaDeleteListing(String listingId) {
        try {

            List<Portal__c> portalZoopla = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c FROM Portal__c WHERE generator__c = 'Zoopla' AND Is_Active__c = true WITH SECURITY_ENFORCED LIMIT 1];

            if (!portalZoopla.isEmpty()) {
                Portal__c zooplaPortal = portalZoopla[0];

                Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Field_Mapping__c);
                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Portal_Configuration__c);
                Boolean isSandbox;
                String fieldName;

                if (configMap.containsKey('is_test_portal')) {
                    isSandbox = Boolean.valueOf(configMap.get('is_test_portal'));
                }
                
                if (jsonMap.containsKey('listing_reference') ) {
                    fieldName = ((String)jsonMap.get('listing_reference'));
                }

                String query = 'SELECT Id, Status__c, ' + fieldName + ' FROM Listing__c WHERE Id = :listingId';

                List<SObject> records = Database.query(query);

                if (!records.isEmpty()) {
                    SObject record = records[0];
                    String listingReference = (String) record.get(fieldName);
                    String status = (String) record.get('Status__c');

                    String endpoint;
                    if (isSandbox) {
                        endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/delete';
                    } else {
                        endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/listing/delete';
                    }

                    Http h3 = new Http();
                    HttpRequest req3 = new HttpRequest();
                    
                    req3.setClientCertificateName('zoopla_certificate');
                    req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.0/schemas/listing/delete.json');
                    req3.setBody('{ "listing_reference": "' + listingReference + '", "deletion_reason": "' + deletionreason(status) + '" }');
                    req3.setMethod('POST');
                    req3.setEndpoint(endpoint);
                    
                    HttpResponse res3 = h3.send(req3);
                    
                    System.debug('Response Status: ' + res3.getStatus());
                    System.debug('Response Body: ' + res3.getBody());
                    
                    if (res3.getStatusCode() == 200) {
                        String responseBody = res3.getBody();
                    } else {
                        System.debug('Request failed with status code: ' + res3.getStatusCode());
                        System.debug('Error Response: ' + res3.getBody());
                    }
                }
            }
            
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
    }

    public class PropertyPortalWrapper {
        public String branch_reference;
        public String branch_name;
        public String street_name;
        public String town_or_city;
        public String postal_code;
        public String country_code;
        public String locality;
        public String county;
        public String latitude;
        public String longitude;
        public String address_key;
        public String organisation_key;
        public String postcode_type;
        public String paf_udprn;
        public String telephone;
        public String email;
        public String website;
        public String is_test_portal;
    }

    @future(callout= true)
    public static void zooplaCreateAndUpdateBranch(String portalWrapper, String portalId) {
        try {
            PropertyPortalWrapper wrapper = (PropertyPortalWrapper)JSON.deserialize(portalWrapper, PropertyPortalWrapper.class);
            
            String requestBody = BranchCreationAndUpdateJSON.buildJSON(
                wrapper.branch_reference,
                wrapper.branch_name,
                wrapper.street_name,
                wrapper.locality,
                wrapper.town_or_city,
                wrapper.county,
                wrapper.postal_code,
                wrapper.country_code,
                wrapper.latitude,
                wrapper.longitude,
                wrapper.address_key,
                wrapper.organisation_key,
                wrapper.paf_udprn,
                wrapper.postcode_type,
                wrapper.telephone,
                wrapper.email,
                wrapper.website
            );
            System.debug('resultBody-->'+ requestBody);
            System.debug('wrapper.is_test_portal-->'+ wrapper.is_test_portal);
            Boolean isSandbox = Boolean.valueOf(wrapper.is_test_portal);

            String endpoint;
            if (isSandbox) {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/branch/update';
            } else {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/branch/update';
            }
            Http h3 = new Http();
            HttpRequest req3 = new HttpRequest();
            
            req3.setClientCertificateName('zoopla_certificate');
            req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.0/schemas/branch/update.json');
            req3.setBody(requestBody);
            req3.setMethod('POST');
            req3.setEndpoint(endpoint);
            
            HttpResponse res3 = h3.send(req3);
            
            System.debug('Response Status: ' + res3.getStatus());
            System.debug('Response Body: ' + res3.getBody());
            
            List<Portal__c> portalList = [SELECT Id, Is_Active__c, Response__c FROM Portal__c WHERE Is_Active__c = true AND Id =: portalId LIMIT 1];

            if (res3.getStatusCode() == 200) {
                String responseBody = res3.getBody();
                if (!portalList.isEmpty()) {
                    portalList[0].Response__c = responseBody;
                    update portalList;
                }
            } else {
                System.debug('Request failed with status code: ' + res3.getStatusCode());
                System.debug('Error Response: ' + res3.getBody());
                String responseBody = res3.getBody();
                if (!portalList.isEmpty()) {
                    portalList[0].Response__c = responseBody;
                    update portalList;
                }
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            System.debug('Exception Line: ' + e.getLineNumber());
        }
    }

    public static String deletionreason(String status) {
        switch on status {
            when 'Withdrawn' {
                return 'withdrawn';
            }
            when 'Sale Agreed' {
                return 'offer_accepted';
            }
            when 'Exchanged' {
                return 'exchanged';
            }
            when 'Sold' {
                return 'let';
            }
            when else {
                return 'completed';
            }
        }
    }
}