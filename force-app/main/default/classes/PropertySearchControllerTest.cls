/**
* Class Name : PropertySearchControllerTest
* Created By : Karan Singh
* Last Modified Date : 08/07/2024
* Last Modified By : Karan Singh
* @description : Used to test PropertySearchController class.
*/
@isTest
public class PropertySearchControllerTest {
    /**
    * Method Name : testGetProperties
    * @description : Used to test getProperties method.
    */
    @isTest
    static void testGetProperties() {
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
            listing.Sq_Ft__c = 1500;
            listing.Rent_Frequency__c = 'Monthly';
            listing.Availability_Date__c = Date.today();
            insert listing;

            Property_File__c propertyFile = new Property_File__c(
                BaseUrl__c = 'http://test.url', 
                Property__c = property.Id
            );
            insert propertyFile;

            // Test the GetProperties method
            Test.startTest();
            PropertySearchController.WrapperClass result = PropertySearchController.GetProperties(null, 'MVEX__Listing__c');
            Test.stopTest();

            // Assert the returned wrapper class is not null
            System.assertNotEquals(null, result);

            // Assert the Listings are returned
            System.assertNotEquals(null, result.Listings);
            System.assert(result.Listings.size() > 0, 'Listings should not be empty');

            // Assert the Medias map is returned and contains the expected data
            System.assertNotEquals(null, result.Medias);
                System.assert(result.Medias.containsKey(property.Id), 'Medias map should contain the property Id');
                System.assertEquals('http://test.url', result.Medias.get(property.Id), 'The media URL should match the test data');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PropertySearchControllerTest', 'testGetProperties', 'Error while creating test data.');
        }
    }

    /**
    * Method Name : testGetListingTypes
    * @description : Used to test getListingTypes method.
    */
    @isTest
    static void testGetListingTypes() {
        try {
            Test.startTest();
            List<String> listingTypes = PropertySearchController.GetListingTypes();
            Test.stopTest();

            System.assertNotEquals(null, listingTypes);
            System.assert(listingTypes.size() > 0, 'Listing types should not be empty');
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PropertySearchControllerTest', 'testGetListingTypes', 'Error while creating test data.');
        }
    }
}