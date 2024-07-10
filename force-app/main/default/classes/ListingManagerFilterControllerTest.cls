/**
* Class Name : ListingManagerFilterControllerTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Test class for ListingManagerFilterController.
*/
@isTest
public class ListingManagerFilterControllerTest {

    /**
    * Method Name : testGetListingFields
    * @description : Used to test getListingFields method.
    */
    @isTest
    static void testGetListingFields() {
        try {
            Test.startTest();
            List<ListingManagerFilterController.FieldDetails> fields = ListingManagerFilterController.getListingFields('Account');
            Test.stopTest();

            // Assert that fields are returned
            System.assertNotEquals(null, fields);
            System.assert(fields.size() > 0, 'Field list should not be empty');

            // Check some field properties
            Boolean hasNameField = false;
            for (ListingManagerFilterController.FieldDetails field : fields) {
                if (field.fieldAPIName == 'Name') {
                    hasNameField = true;
                    break;
                }
            }
            System.assert(hasNameField, 'Field list should contain Name field');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerFilterControllerTest', 'testGetListingFields', 'Error while testing getListingFields method.');
        }
    }

    /**
    * Method Name : testGetPicklistValues
    * @description : Used to test getPicklistValues method.
    */
    @isTest
    static void testGetPicklistValues() {
        try {
            Account account = new Account(Name = 'Test Account');
            insert account;

            // Test the getPicklistValues method
            Test.startTest();
            List<Map<String, String>> picklistValues = ListingManagerFilterController.getPicklistValues('Industry', 'Account');
            Test.stopTest();

            // Assert that picklist values are returned
            System.assertNotEquals(null, picklistValues);
            System.assert(picklistValues.size() > 0, 'Picklist values should not be empty');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerFilterControllerTest', 'testGetPicklistValues', 'Error while testing getPicklistValues method.');
        }
    }

    /**
    * Method Name : testGetListingsWithRelatedRecords
    * @description : Used to test getListingsWithRelatedRecords method.
    */
    @isTest
    static void testGetListingsWithRelatedRecords() {
        try {
            // Create test data
            Account account = new Account(Name = 'Test Account');
            insert account;

            Contact contact = new Contact(LastName = 'Test Contact', AccountId = account.Id);
            insert contact;

            Property__c property = new Property__c(Name = 'Test Property', Account__c = account.Id);
            insert property;

            Listing__c listing = new Listing__c(Name = 'Test Listing', Contact__c = contact.Id, Property__c = property.Id, Account__c = account.Id);
            insert listing;

            // Test the getListingsWithRelatedRecords method
            Test.startTest();
            List<String> listingJsons = ListingManagerFilterController.getListingsWithRelatedRecords();
            Test.stopTest();

            // Assert that listing JSONs are returned
            System.assertNotEquals(null, listingJsons);
            System.assert(listingJsons.size() > 0, 'Listing JSONs should not be empty');

            // Deserialize JSON to verify its contents
            Map<String, Object> listingMap = (Map<String, Object>) JSON.deserializeUntyped(listingJsons[0]);
            System.assertEquals('Test Listing', listingMap.get('Name'));
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerFilterControllerTest', 'testGetListingsWithRelatedRecords', 'Error while testing getListingsWithRelatedRecords method.');
        }
    }

    /**
    * Method Name : testGetTheOfferRecords
    * @description : Used to test getTheOfferRecords method.
    */
    @isTest
    static void testGetTheOfferRecords() {
        try {
            Contact contact = new Contact(LastName = 'Dev Test');
            insert contact;

            Property__c property = new Property__c(Name = 'Dev Test');
            insert property;

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
            insert listing;

            Offer__c offer = new Offer__c(
                Listing__c = listing.Id,
                Buyer_Contact__c = contact.Id,
                Offer_made_by__c = 'Buyer',
                Seller_Contact__c = contact.Id,
                Offer_Amount__c = 1000000,
                Status__c = 'Active'
                );
            insert offer;

            // Test the getTheOfferRecords method
            Test.startTest();
            List<Offer__c> offers = ListingManagerFilterController.getTheOfferRecords();
            Test.stopTest();

            // Assert that offers are returned
            System.assertNotEquals(null, offers);
            System.assert(offers.size() > 0, 'Offers list should not be empty');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerFilterControllerTest', 'testGetTheOfferRecords', 'Error while testing getTheOfferRecords method.');
        }
    }
}