/**
* Class Name : PortalMappingControllerTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Test class for PortalMappingController.
*/
@isTest
public with sharing class PortalMappingControllerTest {

    /**
    * Method Name : setupTestData
    * @description : Used to setup test data.
    */
    @testSetup
    static void setupTestData() {
        try {
            Portal__c portal = new Portal__c(Name = 'Zoopla', Is_Active__c = true, Generator__c = 'Zoopla');
            insert portal;

            Portal_Listing_Mapping__c mapping1 = new Portal_Listing_Mapping__c(
                Name = 'detailed_description.text',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Property_Category__c',
                Portal_Field_Description__c = 'Description 1',
                Portal_Field_Example__c = 'Example 1',
                Required__c = true
            );
            Portal_Listing_Mapping__c mapping2 = new Portal_Listing_Mapping__c(
                Name = 'property.agent_ref',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Property_Status__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false
            );
            insert new List<Portal_Listing_Mapping__c> { mapping1, mapping2 };

            Blocked_Fields__c blockFields = new Blocked_Fields__c(Fields_Name__c = 'SystemModstamp;OwnerId');
            insert blockFields;

            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get('MVEX__Listing__c').getDescribe();
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
            if (!fieldsMap.containsKey('Name')) {
                fieldsMap.put('Name', fieldsMap.get('Id'));
            }
            if (!fieldsMap.containsKey('MVEX__Broker_s_Listing_ID__c')) {
                fieldsMap.put('MVEX__Broker_s_Listing_ID__c', fieldsMap.get('Id'));
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'setupTestData', 'Error while setting up test data.');
        }
    }

    /**
    * Method Name : testGetPortalRecords
    * @description : Used to test getPortalRecords method.
    */
    @isTest
    static void testGetPortalRecords() {
        try {
            Test.startTest();
            List<Portal__c> portals = PortalMappingController.getPortalRecords();
            Test.stopTest();

            System.assertNotEquals(null, portals, 'Expected non-null result.');
            System.assertEquals(1, portals.size(), 'Expected one Portal__c record.');
            System.assertEquals('Zoopla', portals[0].Name, 'Expected portal name to be Test Portal.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testGetPortalRecords', 'Error while getting portal records.');
        }
    }

    /**
    * Method Name : testGetObjectFields
    * @description : Used to test getObjectFields method.
    */
    @isTest
    static void testGetObjectFields() {
        try {
            Test.startTest();
            List<PortalMappingController.FieldWrapper> fieldWrappers = PortalMappingController.getObjectFields('Zoopla');
            List<PortalMappingController.FieldWrapper> fieldWrappers1 = PortalMappingController.getObjectFields(null);
            Test.stopTest();

            PortalMappingController.FieldWrapper fieldWrapper = fieldWrappers[0];
            System.assert(fieldWrapper.blockfields.contains('SystemModstamp'), 'Expected blocked field SystemModstamp.');
            System.assert(fieldWrapper.blockfields.contains('OwnerId'), 'Expected blocked field OwnerId.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testGetObjectFields', 'Error while getting object fields.');
        }
    }

    /**
    * Method Name : testSaveChangedFields
    * @description : Used to test saveChangedFields method.
    */
    @isTest
    static void testSaveChangedFields() {
        try {
            List<Portal_Listing_Mapping__c> listName = [SELECT Id, Listing_Field_API_Name__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c = 'Zoopla' AND Listing_Field_API_Name__c != null LIMIT 2];
            List<Map<String, String>> changedFields = new List<Map<String, String>>();
            Map<String, String> changedField = new Map<String, String>();
            changedField.put('Id', listName[0].Id);
            changedField.put('MVEX__Listing_Field_API_Name__c', 'MVEX__Description__c');
            changedFields.add(changedField);

            Test.startTest();
            String result = PortalMappingController.saveChangedFields(changedFields, '[{"key":"value"}]', 'Zoopla');
            String result1 = PortalMappingController.saveChangedFields(null, null, null);
            Test.stopTest();

            System.assertEquals('Success', result, 'Expected success message.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testSaveChangedFields', 'Error while saving changed fields.');
        }
    }

    /**
    * Method Name : testPortalAction
    * @description : Used to test portalAction method.
    */
    @isTest
    static void testPortalAction() {
        try {
            Portal__c portal = [SELECT Id FROM Portal__c LIMIT 1];

            Test.startTest();
            String deactivateResult = PortalMappingController.portalAction(portal.Id, 'deactivate');
            String activateResult = PortalMappingController.portalAction(portal.Id, 'activate');
            String deleteResult = PortalMappingController.portalAction(portal.Id, 'delete');
            String result1 = PortalMappingController.portalAction(null, null);
            Test.stopTest();

            System.assertEquals('deactivated', deactivateResult, 'Expected deactivated status.');
            System.assertEquals('activated', activateResult, 'Expected activated status.');
            System.assertEquals('deleted', deleteResult, 'Expected deleted status.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testPortalAction', 'Error while performing portal action.');
        }
    }

    /**
    * Method Name : testSavePropertyPortalRecord
    * @description : Used to test savePropertyPortalRecord method.
    */
    @isTest
    static void testSavePropertyPortalRecord() {
        try {
            // Create mock responses for different endpoints
            HttpResponse mockResponse1 = new HttpResponse();
            mockResponse1.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/branch/update.json');
            mockResponse1.setBody('{"location":{"country_code":"IN","postal_code":"123456","town_or_city":"Ahmedabad","street_name":"Test"},"branch_name":"99xx99","branch_reference":"99xx99"}');
            mockResponse1.setStatusCode(200);
            
            // Map endpoints to their respective mock responses
            Map<String, HttpResponse> endpointResponses = new Map<String, HttpResponse>{
                'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/branch/update' => mockResponse1
            };
            
            // Set up the mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(endpointResponses));

            PortalMappingController.PropertyPortalWrapper wrapper = new PortalMappingController.PropertyPortalWrapper();
            wrapper.name = 'Zoopla';
            wrapper.portalname = 'Zoopla';
            wrapper.getPortalIconUrl = 'http://example.com/icon.png';
            wrapper.certificate = 'zoopla_certificate';
            wrapper.branch_reference = '99xx99';
            wrapper.branch_name = '99xx99';
            wrapper.street_name = 'test';
            wrapper.town_or_city = 'test1';
            wrapper.postal_code = '122344';
            wrapper.country_code = 'IN';
            wrapper.is_test_portal = 'true';
            wrapper.differentiator_values = 'MVEX__Listing_Type__c';
            String wrapperJson = JSON.serialize(wrapper);

            Test.startTest();
            PortalMappingController.savePropertyPortalRecord(wrapperJson, 'Zoopla');
            PortalMappingController.savePropertyPortalRecord(null, null);
            Test.stopTest();

            Portal__c newPortal = [SELECT Id, Name, Endpoint__c FROM Portal__c WHERE Name = 'Zoopla' LIMIT 1];
            System.assertNotEquals(null, newPortal, 'Expected new Portal__c record.');
            System.assertEquals('Zoopla', newPortal.Name, 'Expected portal name to be Zoopla.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testSavePropertyPortalRecord', 'Error while saving property portal record.');
        }
        
    }

    @isTest
    static void testSavePropertyPortalRecordfailapi() {
        try {
            // Create mock responses for different endpoints
            HttpResponse mockResponse1 = new HttpResponse();
            mockResponse1.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/branch/update.json');
            mockResponse1.setBody('{"location":{"country_code":"IN","postal_code":"123456","town_or_city":"Ahmedabad","street_name":"Test"},"branch_name":"99xx99","branch_reference":"99xx99"}');
            mockResponse1.setStatusCode(404);
            
            // Map endpoints to their respective mock responses
            Map<String, HttpResponse> endpointResponses = new Map<String, HttpResponse>{
                'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/branch/update' => mockResponse1
            };
            
            // Set up the mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(endpointResponses));

            PortalMappingController.PropertyPortalWrapper wrapper = new PortalMappingController.PropertyPortalWrapper();
            wrapper.name = 'Zoopla';
            wrapper.portalname = 'Zoopla';
            wrapper.getPortalIconUrl = 'http://example.com/icon.png';
            wrapper.certificate = 'zoopla_certificate';
            wrapper.branch_reference = '99xx99';
            wrapper.branch_name = '99xx99';
            wrapper.street_name = 'test';
            wrapper.town_or_city = 'test1';
            wrapper.postal_code = '122344';
            wrapper.country_code = 'IN';
            wrapper.is_test_portal = 'true';
            wrapper.differentiator_values = 'MVEX__Listing_Type__c';
            String wrapperJson = JSON.serialize(wrapper);

            Test.startTest();
            PortalMappingController.savePropertyPortalRecord(wrapperJson, 'Zoopla');
            PortalMappingController.savePropertyPortalRecord(null, null);
            Test.stopTest();

            Portal__c newPortal = [SELECT Id, Name, Endpoint__c FROM Portal__c WHERE Name = 'Zoopla' LIMIT 1];
            System.assertNotEquals(null, newPortal, 'Expected new Portal__c record.');
            System.assertEquals('Zoopla', newPortal.Name, 'Expected portal name to be Zoopla.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testSavePropertyPortalRecord', 'Error while saving property portal record.');
        }
    }

    /**
    * Method Name : testGetAllCustomFields
    * @description : Used to test getAllCustomFields method.
    */
    @isTest
    static void testGetAllCustomFields() {
        try {
            Test.startTest();
            List<PortalMappingController.FieldList> customFields = PortalMappingController.getAllCustomFields();
            Test.stopTest();
    
            System.assertNotEquals(null, customFields, 'Expected non-null result.'); 
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalMappingControllerTest', 'testGetAllCustomFields', 'Error while getting all custom fields.');
        }
    }
}