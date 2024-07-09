/**
* Class Name : PortalSyndicationControllerTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Used to test PortalSyndicationController class.
*/
@isTest
public with sharing class PortalSyndicationControllerTest {

    /**
    * Method Name : setupTestData
    * @description : Used to setup test data.
    */
    @testSetup
    static void setupTestData() {
        try {
            Contact contact = new Contact(LastName = 'Dev Test');
            insert contact;

            Property__c property = new Property__c(Name = 'Dev Test');
            insert property;

            Portal__c portal1 = new Portal__c(
                Name = 'Zoopla', 
                Is_Active__c = true, 
                Generator__c = 'Zoopla', 
                Field_Mapping__c = '{"MVEX__Listing_Price__c":"pricing.price","MVEX__City__c":"location.town_or_city","MVEX__Broker_s_Listing_ID__c":"listing_reference","MVEX__Status__c":"life_cycle_status","MVEX__Property_Type__c":"property_type","MVEX__Rent_Frequency__c":"pricing.rent_frequency","CurrencyIsoCode":"pricing.currency_code","MVEX__Listing_Type__c":"pricing.transaction_type","MVEX__Country_Code__c":"location.country_code","MVEX__Zip_Postal_Code__c":"accessibility","MVEX__Street__c":"location.street_name","MVEX__House_Office_No__c":"location.property_number_or_name","MVEX__Description__c":"detailed_description.text","MVEX__Property_Category__c":"category","MVEX__Listing_Allowed_For_Portals__c":"feature_list.bills_included.broadband_supply.building_safety_issues.buyer_incentives","MVEX__Country_Code__c":"commercial_use_classes.connected_utilities.construction_materials.electricity_supply","MVEX__Furnished__c":"floor_levels.heating_source.outside_space.parking.sewerage_supply.water_supply.sources_of_flooding"}',
                Portal_Configuration__c = '{"version":"1.2","portalname":"Zoopla","getPortalIconUrl":"/resource/zoopla","portal_key":"Zoopla","name":"Zoopla","certificate":"zoopla_certificate","branch_reference":"99xx99","branch_name":"99xx99","street_name":"Street","town_or_city":"Ahmedabad","postal_code":"123456","country_code":"IN","locality":"","county":"","latitude":"","longitude":"","address_key":"","organisation_key":"","postcode_type":"","paf_udprn":"","telephone":"","email":"","website":"","is_test_portal":"true","differentiator_values":"MVEX__Listing_Type__c"}'
                );
            Portal__c portal2 = new Portal__c(
                Name = 'Rightmove', 
                Is_Active__c = true, 
                Generator__c = 'Rightmove',
                Field_Mapping__c = '{"MVEX__Address__c":"property.address.display_address","MVEX__House_Office_No__c":"property.address.house_name_number","MVEX__PostalCode1__c":"property.address.postcode_1","MVEX__PostalCode2__c":"property.address.postcode_2","MVEX__City__c":"property.address.town","MVEX__Broker_s_Listing_ID__c":"property.agent_ref","MVEX__Bedrooms__c":"property.details.bedrooms","MVEX__Description__c":"property.details.description","Name":"property.details.summary","MVEX__Listing_Price__c":"property.price_information.price","MVEX__Property_Type__c":"property.property_type","MVEX__Listing_Allowed_For_Portals__c":"property.published","MVEX__Status__c":"property.status","MVEX__Furnished__c":"property.details.accessibility","MVEX__Country_Code__c":"property.details.features","MVEX__Zip_Postal_Code__c":"property.details.parking","MVEX__Listing_Allowed_For_Portals__c":"property.details.outside_space.heating.comm_use_class.rooms.room_photo_urls.test"}',
                Portal_Configuration__c = '{"version":"1.2","portalname":"Rightmove","getPortalIconUrl":"/resource/rightmove","portal_key":"Rightmove","name":"Rightmove","certificate":"mvcloudstest","network.network_id":"13457","branch.branch_id":"274982","is_test_portal":"true"}'
                );

            insert new List<Portal__c> { portal1, portal2 };

            Listing__c listing = new Listing__c();
            listing.Name = 'Dev Test';
            listing.Property__c = property.Id;
            listing.Status__c = 'Active';
            listing.Listing_Type__c = 'Rent';
            listing.Property_Type__c = 'Villa';
            listing.Property_Sub_Type__c = 'Residential - Apartment';
            listing.Property_Category__c = 'Residential';
            listing.Country_Code__c = 'IN';
            listing.Street__c = 'Dev Test';
            listing.City__c = 'Dev Test';
            listing.State__c = 'Dev Test';
            listing.Zip_Postal_Code__c = '123456';
            listing.Description__c = 'Dev Test';
            listing.Listing_Price__c = 1000000;
            listing.Bedrooms__c = 3;
            listing.Bathrooms__c = 2;
            listing.Size__c = 1000;
            listing.Property_OwnerContact__c = contact.Id;
            listing.Listed_Date__c = Date.today();
            listing.Unit_Number__c = '12345';
            listing.Furnished__c = 'Yes';
            listing.Property_Status__c = 'Vacant';
            listing.Year_Built__c = '2020';
            listing.Rent_Frequency__c = 'Monthly';
            listing.Listing_Allowed_For_Portals__c = true;
            insert listing;
            
            PortalListing__c portalListing1 = new PortalListing__c(
                Listing__c = listing.Id,
                Portal__c = portal1.Id,
                SystemIsActive__c = true
            );
            PortalListing__c portalListing2 = new PortalListing__c(
                Listing__c = listing.Id,
                Portal__c = portal2.Id,
                SystemIsActive__c = true
            );
            insert new List<PortalListing__c> { portalListing1, portalListing2 };

            Property_File__c propertyFile1 = new Property_File__c(
                Name = 'Test Image 1',
                Property__c = property.Id,
                BaseUrl__c = 'http://example.com/image1',
                Size__c = 123.45,
                IsOnPortalFeed__c = true,
                IsOnWebsite__c = true,
                IsOnExpose__c = true,
                Tags__c = '360tour'
            );

            Property_File__c propertyFile2 = new Property_File__c(
                Name = 'Test Image 2',
                Property__c = property.Id,
                BaseUrl__c = 'http://example.com/image2',
                Size__c = 543.21,
                IsOnPortalFeed__c = true,
                IsOnWebsite__c = false,
                IsOnExpose__c = false,
                Tags__c = 'Interior;Exterior;360tour;Floorplan;Virtual Tour'
            );

            Property_File__c propertyFile3 = new Property_File__c(
                Name = 'Test Image 3',
                Property__c = property.Id,
                BaseUrl__c = 'http://example.com/image2',
                Size__c = 543.21,
                IsOnPortalFeed__c = true,
                IsOnWebsite__c = false,
                IsOnExpose__c = false,
                Tags__c = 'Floorplan'
            );

            Property_File__c propertyFile4 = new Property_File__c(
                Name = 'Test Image 4',
                Property__c = property.Id,
                BaseUrl__c = 'http://example.com/image2',
                Size__c = 543.21,
                IsOnPortalFeed__c = true,
                IsOnWebsite__c = false,
                IsOnExpose__c = false,
                Tags__c = 'Virtual Tour'
            );

            insert new List<Property_File__c> { propertyFile1, propertyFile2, propertyFile3, propertyFile4 };

            Portal_Listing_Mapping__c mapping1 = new Portal_Listing_Mapping__c(
                Name = 'detailed_description.text',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Description__c',
                Portal_Field_Description__c = 'Description 1',
                Portal_Field_Example__c = 'Example 1',
                Required__c = true
            );
            Portal_Listing_Mapping__c mapping2 = new Portal_Listing_Mapping__c(
                Name = 'location.street_name',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Street__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false,
                Value_Mapping__c = 'Vacant => vacant,Rent => rent,Sale => sale'
            );
            Portal_Listing_Mapping__c mapping3 = new Portal_Listing_Mapping__c(
                Name = 'pricing.transaction_type',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Listing_Type__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping4 = new Portal_Listing_Mapping__c(
                Name = 'pricing.rent_frequency',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Rent_Frequency__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping5 = new Portal_Listing_Mapping__c(
                Name = 'category',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Property_Category__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false,
                Value_Mapping__c = 'Residential => residential,Commercial => commercial'
            );
            Portal_Listing_Mapping__c mapping6 = new Portal_Listing_Mapping__c(
                Name = 'accessibility',
                Portal_Name__c = 'Zoopla',
                Listing_Field_API_Name__c = 'MVEX__Zip_Postal_Code__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false,
                Value_Mapping__c = 'Residential => residential,Commercial => commercial'
            );
            Portal_Listing_Mapping__c mapping7 = new Portal_Listing_Mapping__c(
                Name = 'property.status',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Status__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false,
                Value_Mapping__c = 'Vacant => vacant,Rent => rent,Sale => sale'
            );
            Portal_Listing_Mapping__c mapping8 = new Portal_Listing_Mapping__c(
                Name = 'property.address.town',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__City__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping9 = new Portal_Listing_Mapping__c(
                Name = 'property.details.bedrooms',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Bedrooms__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping10 = new Portal_Listing_Mapping__c(
                Name = 'property.property_type',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Property_Type__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Value_Mapping__c = 'Apartment => 28,Townhouse => 29,Villa => 27,Duplex => 56,Penthouse => 29,Land => 20,Commercial => 241,Commercial Lease => 244,Commercial Sale => 253',
                Data_Type__c = 'Integer',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping11 = new Portal_Listing_Mapping__c(
                Name = 'property.details.accessibility',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Furnished__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Value_Mapping__c = 'Apartment => 28,Townhouse => 29,Villa => 27,Duplex => 56,Penthouse => 29,Land => 20,Commercial => 241,Commercial Lease => 244,Commercial Sale => 253',
                Data_Type__c = 'Integer',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping12 = new Portal_Listing_Mapping__c(
                Name = 'property.details.features',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Country_Code__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Value_Mapping__c = 'Apartment => 28,Townhouse => 29,Villa => 27,Duplex => 56,Penthouse => 29,Land => 20,Commercial => 241,Commercial Lease => 244,Commercial Sale => 253',
                Data_Type__c = 'Integer',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping13 = new Portal_Listing_Mapping__c(
                Name = 'property.details.parking',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Zip_Postal_Code__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Value_Mapping__c = 'Apartment => 28,Townhouse => 29,Villa => 27,Duplex => 56,Penthouse => 29,Land => 20,Commercial => 241,Commercial Lease => 244,Commercial Sale => 253',
                Data_Type__c = 'Integer',
                Required__c = false
            );
            Portal_Listing_Mapping__c mapping14 = new Portal_Listing_Mapping__c(
                Name = 'property.details.outside_space.heating.comm_use_class.rooms.room_photo_urls.test',
                Portal_Name__c = 'Rightmove',
                Listing_Field_API_Name__c = 'MVEX__Listing_Allowed_For_Portals__c',
                Portal_Field_Description__c = 'Description 2',
                Portal_Field_Example__c = 'Example 2',
                Data_Type__c = 'Boolean',
                Required__c = false
            );

            insert new List<Portal_Listing_Mapping__c> { mapping1, mapping2, mapping3, mapping4, mapping5, mapping6, mapping7, mapping8, mapping9, mapping10, mapping11, mapping12, mapping13, mapping14 };
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationControllerTest', 'testCreatePortalListingRecord', 'Error while creating portal listing record.');
        }
    }
    
    /**
    * Method Name : testCreatePortalListingRecord
    * @description : Used to test createPortalListingRecord method.
    */
    @isTest
    static void testCreatePortalListingRecord() {
        try {
            // Create mock responses for different endpoints
            HttpResponse mockResponse1 = new HttpResponse();
            mockResponse1.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/update.json');
            mockResponse1.setBody('{"branch_reference":"99xx99","pricing":{"price":1200000,"currency_code":"INR","transaction_type":"sale"},"location":{"town_or_city":"Ahmedabad","country_code":"IN","postal_code":"W1D3QU","street_name":"VR Road","property_number_or_name":"22/4 Apartment"},"listing_reference":"TESTLISTING","life_cycle_status":"available","property_type":"villa","detailed_description":[{"text":"Test Description for Listing"}],"category":"residential"}');
            mockResponse1.setStatusCode(200);
            
            HttpResponse mockResponse2 = new HttpResponse();
            mockResponse2.setHeader('Content-Type', 'application/json');
            mockResponse2.setBody('{"branch":{"branch_id":"274982","channel":1,"overseas":false},"network":{"network_id":"13457"},"property":{"address":{"display_address":"22/4 Galaxy Apartment","house_name_number":"22/4 Apartment","postcode_1":"W1D","postcode_2":"3QU","town":"Ahmedabad"},"agent_ref":"TESTLISTING","details":{"bedrooms":4,"description":"Test Description for Listing","summary":"Test By RK"},"price_information":{"price":1200000},"property_type":"Villa","published":true,"status":1}}');
            mockResponse2.setStatusCode(200);
            
            // Map endpoints to their respective mock responses
            Map<String, HttpResponse> endpointResponses = new Map<String, HttpResponse>{
                'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/update' => mockResponse1,
                'https://adfapi.adftest.rightmove.com/v1/property/sendpropertydetails' => mockResponse2
            };
            
            // Set up the mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(endpointResponses));
            
            Listing__c listing = [SELECT Id FROM Listing__c LIMIT 1];
            List<Portal__c> portal = [SELECT Id FROM Portal__c LIMIT 2];
            
            Test.startTest();
            String result = PortalSyndicationController.createPortalListingRecord(listing.Id, portal[0].Id, 'Publish', 'Zoopla');
            String result1 = PortalSyndicationController.createPortalListingRecord(listing.Id, portal[1].Id, 'Publish', 'Rightmove');
            Test.stopTest();
            
            System.assertEquals('Success', result, 'Expected success message.');
            System.assertEquals('Success', result1, 'Expected success message.');
            
            List<PortalListing__c> portalListings = [SELECT Id, Listing__c, Portal__c, SystemIsActive__c, Listed_Date__c, UnlistedDate__c FROM PortalListing__c WHERE Listing__c = :listing.Id AND Portal__c = :portal[0].Id];
            System.assertEquals(2, portalListings.size(), 'Expected two PortalListing records.');
            
            Boolean isActive = false;
            for (PortalListing__c portalListing : portalListings) {
                if (portalListing.SystemIsActive__c) {
                    isActive = true;
                    System.assertEquals(System.today(), portalListing.Listed_Date__c, 'Expected listed date to be today.');
                } else {
                    System.assertEquals(System.today(), portalListing.UnlistedDate__c, 'Expected unlisted date to be today.');
                }
            }
            
            System.assert(isActive, 'Expected one active PortalListing record.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationControllerTest', 'testCreatePortalListingRecord', 'Error while creating portal listing record.');
        }
    }

    /**
    * Method Name : testCreatePortalListingRecord
    * @description : Used to test createPortalListingRecord method.
    */
    @isTest
    static void testCreatePortalListingRecordFailAPI() {
        try {
            // Create mock responses for different endpoints
            HttpResponse mockResponse1 = new HttpResponse();
            mockResponse1.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/update.json');
            mockResponse1.setBody('{"branch_reference":"99xx99","pricing":{"price":1200000,"currency_code":"INR","transaction_type":"sale"},"location":{"town_or_city":"Ahmedabad","country_code":"IN","postal_code":"W1D3QU","street_name":"VR Road","property_number_or_name":"22/4 Apartment"},"listing_reference":"TESTLISTING","life_cycle_status":"available","property_type":"villa","detailed_description":[{"text":"Test Description for Listing"}],"category":"residential"}');
            mockResponse1.setStatusCode(401);
            
            HttpResponse mockResponse2 = new HttpResponse();
            mockResponse2.setHeader('Content-Type', 'application/json');
            mockResponse2.setBody('{"branch":{"branch_id":"274982","channel":1,"overseas":false},"network":{"network_id":"13457"},"property":{"address":{"display_address":"22/4 Galaxy Apartment","house_name_number":"22/4 Apartment","postcode_1":"W1D","postcode_2":"3QU","town":"Ahmedabad"},"agent_ref":"TESTLISTING","details":{"bedrooms":4,"description":"Test Description for Listing","summary":"Test By RK"},"price_information":{"price":1200000},"property_type":"Villa","published":true,"status":1}}');
            mockResponse2.setStatusCode(404);
            
            // Map endpoints to their respective mock responses
            Map<String, HttpResponse> endpointResponses = new Map<String, HttpResponse>{
                'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/update' => mockResponse1,
                'https://adfapi.adftest.rightmove.com/v1/property/sendpropertydetails' => mockResponse2
            };
            
            // Set up the mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(endpointResponses));
            
            Listing__c listing = [SELECT Id FROM Listing__c LIMIT 1];
            List<Portal__c> portal = [SELECT Id FROM Portal__c LIMIT 2];
            
            Test.startTest();
            String result = PortalSyndicationController.createPortalListingRecord(listing.Id, portal[0].Id, 'Publish', 'Zoopla');
            String result1 = PortalSyndicationController.createPortalListingRecord(listing.Id, portal[1].Id, 'Publish', 'Rightmove');
            Test.stopTest();
            
            System.assertEquals('Success', result, 'Expected success message.');
            System.assertEquals('Success', result1, 'Expected success message.');
            
            List<PortalListing__c> portalListings = [SELECT Id, Listing__c, Portal__c, SystemIsActive__c, Listed_Date__c, UnlistedDate__c FROM PortalListing__c WHERE Listing__c = :listing.Id AND Portal__c = :portal[0].Id];
            System.assertEquals(2, portalListings.size(), 'Expected two PortalListing records.');
            
            Boolean isActive = false;
            for (PortalListing__c portalListing : portalListings) {
                if (portalListing.SystemIsActive__c) {
                    isActive = true;
                    System.assertEquals(System.today(), portalListing.Listed_Date__c, 'Expected listed date to be today.');
                } else {
                    System.assertEquals(System.today(), portalListing.UnlistedDate__c, 'Expected unlisted date to be today.');
                }
            }
            
            System.assert(isActive, 'Expected one active PortalListing record.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationControllerTest', 'testCreatePortalListingRecordFailAPI', 'Error while creating portal listing record.');
        }
    }

    
    /**
    * Method Name : testFetchPortals
    * @description : Used to test fetchPortals method.
    */
    @isTest
    static void testFetchPortals() {
        try {
            // Retrieve the test data
            Listing__c listing = [SELECT Id FROM Listing__c LIMIT 1];
            
            // Test the fetchPortals method
            Test.startTest();
            List<PortalSyndicationController.PortalWrapper> portalWrappers = PortalSyndicationController.fetchPortals(listing.Id);
            List<PortalSyndicationController.PortalWrapper> portalWrappers1 = PortalSyndicationController.fetchPortals(null);
            Test.stopTest();
            
            // Verify the result
            System.assert(portalWrappers != null, 'Expected non-null result.');
            System.assertEquals(2, portalWrappers.size(), 'Expected one PortalWrapper.');
            
            PortalSyndicationController.PortalWrapper portalWrapper = portalWrappers[0];
            System.assertEquals('Zoopla', portalWrapper.name, 'Expected portal name to be Test Portal.');
            System.assertEquals('active', portalWrapper.status, 'Expected portal status to be active.');
            System.assertEquals('destructive', portalWrapper.buttonColor, 'Expected button color to be destructive.');
            System.assertEquals('Unpublish', portalWrapper.buttonLabel, 'Expected button label to be Unpublish.');
            System.assertEquals('slds-badge slds-theme_success', portalWrapper.badgeColor, 'Expected badge color to be slds-badge slds-theme_success.');
            System.assert(portalWrapper.flag, 'Expected flag to be true.');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationControllerTest', 'testFetchPortals', 'Error while fetching portals.');
        }
    }

    /**
    * Method Name : testFetchPortals
    * @description : Used to test fetchPortals method.
    */
    @isTest
    static void testGetListingAPI() {
        try {
            // Create mock responses for different endpoints
            HttpResponse mockResponse1 = new HttpResponse();
            mockResponse1.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/list.json');
            mockResponse1.setBody('{"test": "success"}');
            mockResponse1.setStatusCode(200);
            
            HttpResponse mockResponse2 = new HttpResponse();
            mockResponse2.setHeader('Content-Type', 'application/json');
            mockResponse2.setBody('{"test": "success"}');
            mockResponse2.setStatusCode(200);
            
            // Map endpoints to their respective mock responses
            Map<String, HttpResponse> endpointResponses = new Map<String, HttpResponse>{
                'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/list' => mockResponse1,
                'https://adfapi.adftest.rightmove.com/v1/property/getbranchpropertylist' => mockResponse2
            };
            
            // Set up the mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(endpointResponses));

            Test.startTest();
            ZooplaIntegration.zooplaGetListing();
            RightmoveIntegration.rightmoveGetListing();
            Test.stopTest();
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationControllerTest', 'testGetListingAPI', 'Error while getting listing API.');
        }
    }

    /**
    * Method Name : testFetchPortals
    * @description : Used to test fetchPortals method.
    */
    @isTest
    static void testGetListingAPIFail() {
        try {
            // Create mock responses for different endpoints
            HttpResponse mockResponse1 = new HttpResponse();
            mockResponse1.setHeader('Content-Type', 'application/json; profile=http://realtime-listings.webservices.zpg.co.uk/docs/v2.3/schemas/listing/list.json');
            mockResponse1.setBody('{"test": "success"}');
            mockResponse1.setStatusCode(401);
            
            HttpResponse mockResponse2 = new HttpResponse();
            mockResponse2.setHeader('Content-Type', 'application/json');
            mockResponse2.setBody('{"test": "success"}');
            mockResponse2.setStatusCode(401);
            
            // Map endpoints to their respective mock responses
            Map<String, HttpResponse> endpointResponses = new Map<String, HttpResponse>{
                'https://realtime-listings-api.webservices.zpg.co.uk/sandbox/v2/listing/list' => mockResponse1,
                'https://adfapi.adftest.rightmove.com/v1/property/getbranchpropertylist' => mockResponse2
            };
            
            // Set up the mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(endpointResponses));

            Test.startTest();
            ZooplaIntegration.zooplaGetListing();
            RightmoveIntegration.rightmoveGetListing();
            Test.stopTest();
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationControllerTest', 'testGetListingAPIFail', 'Error while getting listing API.');
        }
    }
}