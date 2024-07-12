/**
* Class Name : RightmoveIntegration
* Created By : Karan Singh
* Last Modified Date : 25/06/2024
* Last Modified By : Karan Singh
* @description : Used to integrate Rightmove.
*/
public with sharing class RightmoveIntegration {

    /**
    * Method Name : getListingRecordForSync
    * @param listingId - String
    * @description : Used to get listing record for sync.
    */
    @AuraEnabled
    public static void getListingRecordForSync(String listingId){
        try {
            List<Portal__c> portalRightmove = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c FROM Portal__c WHERE Generator__c = 'Rightmove' AND Is_Active__c = true WITH SECURITY_ENFORCED LIMIT 1];

            if (!portalRightmove.isEmpty()) {
                Portal__c rightmovePortal = portalRightmove[0];

                Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(rightmovePortal.Field_Mapping__c);
                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(rightmovePortal.Portal_Configuration__c);
                Map<String, Object> finalMapping = new Map<String, Object>();
                Boolean isSandbox;
                String certificateName;

                if (configMap.containsKey('branch.branch_id') && configMap.containsKey('network.network_id') && configMap.containsKey('certificate') && configMap.containsKey('is_test_portal')) {
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    Object certi = configMap.get('certificate');
                    finalMapping.put('branch.branch_id', configMap.get('branch.branch_id'));
                    finalMapping.put('network.network_id', configMap.get('network.network_id'));
                    isSandbox = isTestPortalValue != null ? Boolean.valueOf((String) isTestPortalValue) : true;
                    certificateName = certi != null ? (String) certi : '';
                } else {
                    System.debug('Required fields are missing.');
                }

                List<String> fieldNames = new List<String>();
                for (String key : jsonMap.keySet()) {
                    fieldNames.add(key);
                }

                String query = 'SELECT Id, MVEX__Property__c, MVEX__Listing_Type__c';
                for (String fieldName : fieldNames) {
                    query += ', ' + fieldName;
                }
                query += ' FROM MVEX__Listing__c WHERE Id = :listingId';

                List<SObject> records = Database.query(query);

                if (!records.isEmpty()) {
                    SObject listingRecord = records[0];
                    String propertyId = (String) listingRecord.get('MVEX__Property__c');
                    String listingType = (String) listingRecord.get('MVEX__Listing_Type__c');
                    finalMapping.put('branch.channel', listingType == 'Sale' ? 1 : 2);
                    finalMapping.put('branch.overseas', false);
                    List<Property_File__c> media = [SELECT Id, BaseUrl__c, ExternalLink__c, Tags__c, LastModifiedDate FROM Property_File__c WHERE Property__c = :propertyId AND IsOnPortalFeed__c = true WITH SECURITY_ENFORCED Order BY Sort_on_Portal_Feed__c ASC NULLS LAST, Name ASC];
                    for (String key : jsonMap.keySet()) {
                        String label = (String) jsonMap.get(key);
                        finalMapping.put(label, listingRecord.get(key));
                    }
                    System.debug('finalMapping--> ' + finalMapping);
                    String resultBody = PropertyInfoBuilder.buildJSON(finalMapping, media);
                    System.debug('resultbody--> '+resultBody);
                    rightmoveCreateAndUpdateListing(resultBody, listingId, rightmovePortal.Id, certificateName, isSandbox);
                }
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            System.debug('Exception line: ' + e.getlinenumber());
            ErrorHandler.insert_errordata(e, 'RightmoveIntegration', 'getListingRecordForSync', 'Error while getting listing record.');
        }
    }

    /**
    * Method Name : rightmoveGetListing
    * @description : Used to get listing from Rightmove.
    */
    @future(callout= true)
    public static void rightmoveGetListing() {
        try {
            List<Portal__c> portalRightmove = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c FROM Portal__c WHERE Generator__c = 'Rightmove' AND Is_Active__c = true WITH SECURITY_ENFORCED LIMIT 1];
            Integer branchId;
            Integer networkId;
            Boolean isSandbox;
            String certificateName;
            String endpoint;
            if (!portalRightmove.isEmpty()) {
                Portal__c rightmovePortal = portalRightmove[0];

                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(rightmovePortal.Portal_Configuration__c);

                if (configMap.containsKey('branch.branch_id') && configMap.containsKey('network.network_id') && configMap.containsKey('certificate') && configMap.containsKey('is_test_portal')) {
                    branchId = Integer.valueOf((String) configMap.get('branch.branch_id'));
                    networkId = Integer.valueOf((String) configMap.get('network.network_id'));
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    Object certi = configMap.get('certificate');
                    isSandbox = isTestPortalValue != null ? Boolean.valueOf((String) isTestPortalValue) : true;
                    certificateName = certi != null ? (String) certi : '';
                }

                if (isSandbox) {
                    endpoint = 'https://adfapi.adftest.rightmove.com/v1/property/getbranchpropertylist';
                } else {
                    endpoint = 'https://adfapi.rightmove.co.uk/v1/property/getbranchpropertylist';
                }

                Http h3 = new Http();
                HttpRequest req3 = new HttpRequest();
                
                req3.setClientCertificateName(certificateName);
                req3.setHeader('Content-Type', 'application/json;');
                req3.setBody('{ "network": { "network_id": ' + networkId + ' }, "branch": { "branch_id": ' + branchId + ' }}');
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
            System.debug('Exception line: ' + e.getlinenumber());
            ErrorHandler.insert_errordata(e, 'RightmoveIntegration', 'rightmoveGetListing', 'Error while getting listing list from Rightmove.');
        }
    }

    /**
    * Method Name : rightmoveCreateAndUpdateListing
    * @param resultBody - String
    * @param listingId - String
    * @param portalId - String
    * @param certificateName - String
    * @param isSandbox - Boolean
    * @description : Used to create and update listing in Rightmove.
    */
    @future(callout= true)
    public static void rightmoveCreateAndUpdateListing(String resultBody, String listingId, String portalId, String certificateName, Boolean isSandbox) {
        try {
            String endpoint;
            if (isSandbox) {
                endpoint = 'https://adfapi.adftest.rightmove.com/v1/property/sendpropertydetails';
            } else {
                endpoint = 'https://adfapi.rightmove.co.uk/v1/property/sendpropertydetails';
            }
            Http h3 = new Http();
            HttpRequest req3 = new HttpRequest();
            
            req3.setClientCertificateName(certificateName);
            req3.setHeader('Content-Type', 'application/json;');
            req3.setBody(resultBody);
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
            ErrorHandler.insert_errordata(e, 'RightmoveIntegration', 'rightmoveCreateAndUpdateListing', 'Error while creating or updating listing in Rightmove.');
        }
    }

    /**
    * Method Name : rightmoveDeleteListing
    * @param listingId - String
    * @description : Used to delete listing from Rightmove.
    */
    @future(callout= true)
    public static void rightmoveDeleteListing(String listingId) {
        try {

            List<Portal__c> portalRightmove = [SELECT Id, Field_Mapping__c, Portal_Configuration__c, Is_Active__c FROM Portal__c WHERE Generator__c = 'Rightmove' AND Is_Active__c = true WITH SECURITY_ENFORCED LIMIT 1];
            Integer branchId;
            Integer networkId;
            String fieldName;
            Boolean isSandbox;
            String certificateName;
            String endpoint;
            if (!portalRightmove.isEmpty()) {
                Portal__c rightmovePortal = portalRightmove[0];

                Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(rightmovePortal.Field_Mapping__c);
                Map<String, Object> configMap = (Map<String, Object>) JSON.deserializeUntyped(rightmovePortal.Portal_Configuration__c);

                if (configMap.containsKey('branch.branch_id') && configMap.containsKey('network.network_id') && configMap.containsKey('certificate') && configMap.containsKey('is_test_portal')) {
                    branchId = Integer.valueOf((String) configMap.get('branch.branch_id'));
                    networkId = Integer.valueOf((String) configMap.get('network.network_id'));
                    Object isTestPortalValue = configMap.get('is_test_portal');
                    Object certi = configMap.get('certificate');
                    isSandbox = isTestPortalValue != null ? Boolean.valueOf((String) isTestPortalValue) : true;
                    certificateName = certi != null ? (String) certi : '';
                }

                for (String key : jsonMap.keySet()) {
                    if (jsonMap.get(key) == 'property.agent_ref') {
                        fieldName = key;
                        break;
                    }
                }
                String query;
                if (fieldName != null) {
                    query = 'SELECT Id, MVEX__Status__c, ' + fieldName + ' FROM MVEX__Listing__c WHERE Id =: listingId';
                } else {
                    query = 'SELECT Id, MVEX__Status__c, MVEX__Broker_s_Listing_ID__c FROM MVEX__Listing__c WHERE Id =: listingId';
                }
                

                System.debug('query-->'+query);
                List<SObject> records = Database.query(query);
                System.debug('records-->'+records);
                if (!records.isEmpty()) {
                    SObject record = records[0];
                    String listingReference = (String) record.get(fieldName);
                    String status = (String) record.get('MVEX__Status__c');
                    String body = '{ "network": { "network_id": ' + networkId + '}, "branch": { "branch_id": ' + branchId + ' }, "property": { "agent_ref": "' + listingReference + '" }}';

                    if (isSandbox) {
                        endpoint = 'https://adfapi.adftest.rightmove.com/v1/property/removeproperty';
                    } else {
                        endpoint = 'https://adfapi.rightmove.co.uk/v1/property/removeproperty';
                    }

                    Http h3 = new Http();
                    HttpRequest req3 = new HttpRequest();
                    
                    req3.setClientCertificateName(certificateName);
                    req3.setHeader('Content-Type', 'application/json;');
                    req3.setBody(body);
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
            System.debug('Exception: ' + e.getLineNumber());
            ErrorHandler.insert_errordata(e, 'RightmoveIntegration', 'rightmoveDeleteListing', 'Error while deleting listing records on Rightmove.');
        }
    }
}