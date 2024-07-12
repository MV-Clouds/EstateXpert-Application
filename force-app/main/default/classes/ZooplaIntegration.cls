/**
* Class Name : ZooplaIntegration
* Created By : Karan Singh
* Last Modified Date : 25/06/2024
* Last Modified By : Karan Singh
* @description : Used to integrate Portal.
*/
public with sharing class ZooplaIntegration {
    
    /**
    * Method Name : getListingRecordForSync
    * @param listingId - String
    * @description : Used to get listing record for sync.
    */
    @AuraEnabled
    public static void getListingRecordForSync(String listingId) {
        try {
            List<Portal__c> portalZoopla = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c 
                                            FROM Portal__c 
                                            WHERE Generator__c = 'Zoopla' AND Is_Active__c = true WITH SECURITY_ENFORCED 
                                            LIMIT 1];

            if (!portalZoopla.isEmpty()) {
                Portal__c zooplaPortal = portalZoopla[0];

                Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Field_Mapping__c);
                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Portal_Configuration__c);
                Map<String, Object> finalMapping = new Map<String, Object>();
                Boolean isSandbox;
                String certificateName;

                if (configMap.containsKey('branch_reference') && configMap.containsKey('is_test_portal') && configMap.containsKey('certificate')) {
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    Object certi = configMap.get('certificate');
                    finalMapping.put('branch_reference', configMap.get('branch_reference'));
                    isSandbox = isTestPortalValue != null ? Boolean.valueOf((String) isTestPortalValue) : true;
                    certificateName = certi != null ? (String) certi : '';
                } else {
                    System.debug('Required field is Missing.');
                }

                List<String> fieldNames = new List<String>();
                for (String key : jsonMap.keySet()) {
                    fieldNames.add(key);
                }

                String query = 'SELECT Id, MVEX__Property__c';
                for (String fieldName : fieldNames) {
                    query += ', ' + fieldName;
                }
                query += ' FROM MVEX__Listing__c WHERE Id = :listingId';

                List<SObject> records = Database.query(query);

                if (!records.isEmpty()) {
                    SObject listingRecord = records[0];
                    String propertyId = (String) listingRecord.get('MVEX__Property__c');
                    List<Property_File__c> media = [SELECT Id, BaseUrl__c, ExternalLink__c, Tags__c FROM Property_File__c WHERE Property__c = :propertyId AND IsOnPortalFeed__c = true WITH SECURITY_ENFORCED ORDER BY Sort_on_Portal_Feed__c ASC NULLS LAST, Name ASC];
                    for (String key : jsonMap.keySet()) {
                        String label = (String) jsonMap.get(key);
                        finalMapping.put(label, listingRecord.get(key));
                    }

                    System.debug('finalMapping--> ' + finalMapping);

                    String requestBody = PortalIntegration.createInputData(finalMapping, media);
                    System.debug('requestBody---> '+requestBody);

                    zooplaCreateAndUpdateListing(requestBody, portalZoopla[0].Id, records[0].Id, isSandbox, certificateName);
                }
            }
        } catch (Exception e) {
            System.debug('error getListingRecordForSync -->' + e.getMessage());
            System.debug('error getListingRecordForSync -->' + e.getLineNumber());
            ErrorHandler.insert_errordata(e, 'ZooplaIntegration', 'getListingRecordForSync', 'Error while getting listing record.');
        }
    }

    /**
    * Method Name : zooplaGetListing
    * @description : Used to get listing from Zoopla.
    */
    @future(callout= true)
    public static void zooplaGetListing() {
        try {
            List<Portal__c> portalRightmove = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c FROM Portal__c WHERE Generator__c = 'Zoopla' AND Is_Active__c = true WITH SECURITY_ENFORCED LIMIT 1];
            String branchId;
            Boolean isSandbox;
            String certificateName;
            String endpoint;
            if (!portalRightmove.isEmpty()) {
                Portal__c rightmovePortal = portalRightmove[0];

                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(rightmovePortal.Portal_Configuration__c);

                if (configMap.containsKey('branch_reference') && configMap.containsKey('certificate') && configMap.containsKey('is_test_portal')) {
                    Object branchRef = configMap.get('branch_reference');
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    Object certi = configMap.get('certificate');
                    isSandbox = isTestPortalValue != null ? Boolean.valueOf((String) isTestPortalValue) : true;
                    certificateName = certi != null ? (String) certi : '';
                    branchId = branchRef != null ? (String) branchRef : '';
                } else {
                    System.debug('Required field is Missing.');
                }

                if (isSandbox) {
                    endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/list';
                } else {
                    endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/listing/list';
                }
                Http h3 = new Http();
                HttpRequest req3 = new HttpRequest();
                
                req3.setClientCertificateName(certificateName);
                req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/list.json');
                req3.setBody('{ "branch_reference": "' + branchId + '" }');
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
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            ErrorHandler.insert_errordata(e, 'ZooplaIntegration', 'zooplaGetListing', 'Error while getting listing list from Zoopla.');
        }
    }

    /**
    * Method Name : zooplaCreateAndUpdateListing
    * @param requestBody - String
    * @param portalId - String
    * @param listingId - String
    * @param isSandbox - Boolean
    * @param certificateName - String
    * @description : Used to create and update listing in Zoopla.
    */
    @future(callout= true)
    public static void zooplaCreateAndUpdateListing(String requestBody, String portalId, String listingId, Boolean isSandbox, String certificateName) {
        try {
            String endpoint;
            if (isSandbox) {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/update';
            } else {
                endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/listing/update';
            }
            
            Http h3 = new Http();
            HttpRequest req3 = new HttpRequest();
            
            req3.setClientCertificateName(certificateName);
            req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/update.json');
            req3.setHeader('ZPG-Listing-ETag', '');
            req3.setBody(requestBody);
            req3.setMethod('POST');
            req3.setEndpoint(endpoint);
            
            HttpResponse res3 = h3.send(req3);
            
            System.debug('Response Status: ' + res3.getStatus());
            System.debug('Response Body: ' + res3.getBody());
            
            List<PortalListing__c> portalListing = [SELECT Id, Portal__c, Listing__c, SystemIsActive__c, API_Response__c FROM PortalListing__c WHERE SystemIsActive__c = true AND Portal__c =: portalId AND Listing__c =: listingId WITH SECURITY_ENFORCED LIMIT 1];

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
            ErrorHandler.insert_errordata(e, 'ZooplaIntegration', 'zooplaCreateAndUpdateListing', 'Error while creating or updating listing in Zoopla.');
        }
    }

    /**
    * Method Name : zooplaDeleteListing
    * @param listingId - String
    * @description : Used to delete listing from Zoopla.
    */
    @future(callout= true)
    public static void zooplaDeleteListing(String listingId) {
        try {

            List<Portal__c> portalZoopla = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c FROM Portal__c WHERE Generator__c = 'Zoopla' AND Is_Active__c = true WITH SECURITY_ENFORCED LIMIT 1];

            if (!portalZoopla.isEmpty()) {
                Portal__c zooplaPortal = portalZoopla[0];

                Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Field_Mapping__c);
                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(zooplaPortal.Portal_Configuration__c);
                Boolean isSandbox;
                String fieldName;
                String certificateName;
                String query;

                if (configMap.containsKey('is_test_portal') && configMap.containsKey('certificate')) {
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    Object certi = configMap.get('certificate');
                    isSandbox = isTestPortalValue != null ? Boolean.valueOf((String) isTestPortalValue) : true;
                    certificateName = certi != null ? (String) certi : '';
                } else {
                    System.debug('Required field is missing.');
                }
                
                for (String key : jsonMap.keySet()) {
                    if (jsonMap.get(key) == 'listing_reference') {
                        fieldName = key;
                        break;
                    }
                }

                if (fieldName != null) {
                    query = 'SELECT Id, MVEX__Status__c, ' + fieldName + ' FROM MVEX__Listing__c WHERE Id =: listingId WITH SECURITY_ENFORCED';
                } else {
                    query = 'SELECT Id, MVEX__Status__c, MVEX__Broker_s_Listing_ID__c FROM MVEX__Listing__c WHERE Id = :listingId WITH SECURITY_ENFORCED';
                }

                List<SObject> records = Database.query(query);

                if (!records.isEmpty()) {
                    SObject record = records[0];
                    String listingReference = (String) record.get(fieldName);

                    String endpoint;
                    if (isSandbox) {
                        endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/delete';
                    } else {
                        endpoint = 'https://realtime-listings-api.webservices.zpg.co.uk/live/v2/listing/delete';
                    }

                    Http h3 = new Http();
                    HttpRequest req3 = new HttpRequest();
                    
                    req3.setClientCertificateName(certificateName);
                    req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/delete.json');
                    req3.setBody('{ "listing_reference": "' + listingReference + '" }');
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
            ErrorHandler.insert_errordata(e, 'ZooplaIntegration', 'zooplaDeleteListing', 'Error while deleting listing records on Zoopla.');
        }
    }

    /**
    * Class Name : PropertyPortalWrapper
    * @description : Used to create property portal wrapper.
    */
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

    /**
    * Method Name : zooplaCreateAndUpdateBranch
    * @param portalWrapper - String
    * @param portalId - String
    * @description : Used to create and update branch in Zoopla.
    */
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
            req3.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/branch/update.json');
            req3.setBody(requestBody);
            req3.setMethod('POST');
            req3.setEndpoint(endpoint);
            
            HttpResponse res3 = h3.send(req3);
            
            System.debug('Response Status: ' + res3.getStatus());
            System.debug('Response Body: ' + res3.getBody());
            
            List<Portal__c> portalList = [SELECT Id, Is_Active__c, Response__c FROM Portal__c WHERE Is_Active__c = true AND Id =: portalId WITH SECURITY_ENFORCED LIMIT 1];

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
            ErrorHandler.insert_errordata(e, 'ZooplaIntegration', 'zooplaCreateAndUpdateBranch', 'Error while creating or updating Branch in Zoopla.');
        }
    }
}