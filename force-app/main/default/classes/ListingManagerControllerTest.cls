/**
* Class Name : ListingManagerControllerTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Test class for ListingManagerController.
*/
@isTest
public class ListingManagerControllerTest {
    
    /**
    * Method Name : testGetListingData
    * @description : Used to test getListingData method.
    */
    @isTest
    static void testGetListingData() {
        try {
            Account account = new Account(Name = 'Test Account');
            insert account;
            
            // Create Property
            Property__c property = new Property__c(Name = 'Test Property', Account__c = account.Id);
            insert property;

            // Create Listings
            Listing__c listing1 = new Listing__c(Name = 'Test Listing 1', Property__c = property.Id);
            Listing__c listing2 = new Listing__c(Name = 'Test Listing 2', Property__c = property.Id);
            insert new List<Listing__c>{ listing1, listing2 };

            // Create Property Files
            Property_File__c propertyFile1 = new Property_File__c(BaseUrl__c = 'https://example.com/file1.jpg', Property__c = property.Id);
            Property_File__c propertyFile2 = new Property_File__c(BaseUrl__c = 'https://example.com/file2.jpg', Property__c = property.Id);
            insert new List<Property_File__c>{ propertyFile1, propertyFile2 };

            // Test the getListingData method
            Test.startTest();
            ListingManagerController.WrapperClass result = ListingManagerController.getListingData();
            Test.stopTest();
            
            // Assert that listings are returned
            System.assertNotEquals(null, result);
            System.assertEquals(2, result.listings.size());
            
            // Assert that media URLs are returned correctly
            System.assertEquals(1, result.medias.size());
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerControllerTest', 'testGetListingData', 'Error while creating test data.');
        }
    }

    /**
    * Method Name : testGetFields
    * @description : Used to test getFields method.
    */
    @isTest
    static void testGetFields() {
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

            // Test the getFields method
            Test.startTest();
            ListingManagerController.FieldSetForm fields = ListingManagerController.getForm(listing.Id, 'MVEX__Listing__c', 'MVEX__ListingManagerFieldSet');
            ListingManagerController.FieldSetForm fields1 = ListingManagerController.getForm(null, 'MVEX__Listing__c', 'MVEX__ListingManagerFieldSet');
            Test.stopTest();

            // Assert that fields are returned
            System.assertNotEquals(null, fields);
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerControllerTest', 'testGetFields', 'Error while creating test data.');
        }
    }
    
    /**
    * Method Name : testGetAllFields
    * @description : Used to test getAllFields method.
    */
    @isTest
    static void testGetAllFields() {
        try {
            // Test the getAllFields method
            Test.startTest();
            String allFields = ListingManagerController.getAllFields('MVEX__Listing__c');
            Test.stopTest();

            // Assert that all fields are returned
            System.assertNotEquals(null, allFields);
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'ListingManagerControllerTest', 'testGetAllFields', 'Error while creating test data.');
        }
    }
}