/**
 * Class Name : ImageAndMediaController
 * Test Class : ImageAndMediaControllerTest
 * Created By : Karan Singh
 * Last Modified Date : 24/06/2024
 * Last Modified By : Karan Singh
 * @description : Used to get, create and sort the images related to property.
 */
public with sharing class ImageAndMediaController {
  /**
   * Class Name : ListingWrapper
   * @description : Used to store the property id and images data.
   */
  public class ListingWrapper {
    @AuraEnabled
    public String propertyId { get; set; }
    @AuraEnabled
    public List<Property_File__c> listingImages { get; set; }
  }

  /**
   * Method Name : fetchListingAndImages
   * @param recordId to stored the Listing record Id
   * @return ListingWrapper that contains property id and images data.
   * @description : Used to get the listing and images data.
   */
  @AuraEnabled
  public static ListingWrapper fetchListingAndImages(String recordId) {
    try {
      ListingWrapper newWrap = new ListingWrapper();
      List<Listing__c> listingRecord = [
        SELECT Id, Property__c
        FROM Listing__c
        WHERE Id = :recordId
        WITH SECURITY_ENFORCED
        LIMIT 1
      ];
      if (!listingRecord.isEmpty()) {
        List<Property_File__c> listingImages = [
          SELECT
            Id,
            BaseUrl__c,
            Tags__c,
            Name,
            ExternalLink__c,
            Size__c,
            Property__c,
            IsOnPortalFeed__c,
            IsOnWebsite__c,
            IsOnExpose__c,
            Sort_on_Expose__c,
            Sort_on_Portal_Feed__c,
            Sort_on_Website__c
          FROM Property_File__c
          WHERE Property__c = :listingRecord[0].Property__c
          WITH SECURITY_ENFORCED
          ORDER BY Name
        ];
        listingImages.sort();

        newWrap.propertyId = listingRecord[0].Property__c;
        newWrap.listingImages = listingImages;

        return newWrap;
      } else {
        return null;
      }
    } catch (Exception e) {
      ErrorHandler.insert_errordata(
        e,
        'ImageAndMediaController',
        'fetchListingAndImages',
        'Error while getting listing record.'
      );
      return null;
    }
  }

  /**
   * Method Name : createmediaforlisting
   * @param recordId to stored the Listing record Id
   * @param mediaList to stored the images data
   * @return Boolean value
   * @description : Used to create new Property_File__c records.
   */
  @AuraEnabled
  public static Boolean createmediaforlisting(
    Id recordId,
    List<MediaData> mediaList
  ) {
    try {
      List<Property_File__c> mediaToInsert = new List<Property_File__c>();
      Listing__c listing;
      if (recordId != null) {
        listing = [
          SELECT Id, Property__c
          FROM Listing__c
          WHERE Id = :recordId
          WITH SECURITY_ENFORCED
          LIMIT 1
        ];
      }

      for (MediaData media : mediaList) {
        Property_File__c mediaRecord = new Property_File__c();
        mediaRecord.BaseUrl__c = media.externalUrl;
        if (media.name != '' && media.name != null) {
          if (media.name.length() > 80) {
            String truncatedName = media.name.substring(0, 80);
            mediaRecord.Name = truncatedName;
            mediaRecord.Filename__c = media.name;
          } else {
            mediaRecord.Name = media.name;
          }
        }
        mediaRecord.Size__c = media.size;
        mediaRecord.Property__c = listing.Property__c;
        mediaRecord.ExternalLink__c = media.externalVideoUrl;
        mediaRecord.IsOnExpose__c = media.IsOnExpose;
        mediaRecord.IsOnPortalFeed__c = media.IsOnPortalFeed;
        mediaRecord.IsOnWebsite__c = media.IsOnWebsite;
        mediaToInsert.add(mediaRecord);
      }

      if (
        !mediaToInsert.isEmpty() &&
        Property_File__c.SObjectType.getDescribe().isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.BaseUrl__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.Tags__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.Name.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.Filename__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.ExternalLink__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.Size__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.Property__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.IsOnExpose__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.IsOnPortalFeed__c.isCreateable() &&
        Schema.sObjectType.Property_File__c.fields.IsOnWebsite__c.isCreateable()
      ) {
        insert mediaToInsert;
        return true;
      } else {
        return false;
      }
    } catch (Exception e) {
      ErrorHandler.insert_errordata(
        e,
        'ImageAndMediaController',
        'createmediaforlisting',
        'Error while creating Property_File__c record.'
      );
      return false;
    }
  }

  /**
   * Class Name : MediaData
   * @description : Used to store the media data.
   */
  public class MediaData {
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public Decimal size { get; set; }
    @AuraEnabled
    public String externalUrl { get; set; }
    @AuraEnabled
    public String externalVideoUrl { get; set; }
    @AuraEnabled
    public Boolean isOnExpose { get; set; }
    @AuraEnabled
    public Boolean isOnPortalFeed { get; set; }
    @AuraEnabled
    public Boolean isOnWebsite { get; set; }
  }

  /**
   * Method Name : deletelistingmedia
   * @param id to stored the Property_File__c record Id
   * @param propertyId to stored the property Id
   * @return Boolean value
   * @description : Used to delete Property_File__c records.
   */
  @AuraEnabled
  public static Boolean deletelistingmedia(String id, String propertyId) {
    try {
      if (
        id != null && Property_File__c.SObjectType.getDescribe().isDeletable()
      ) {
        List<Property_File__c> record = [
          SELECT Id
          FROM Property_File__c
          WHERE Id = :id
          WITH SECURITY_ENFORCED
          LIMIT 1
        ];
        delete record;
      } else if (propertyId != null) {
        List<Listing__c> listing = [
          SELECT Id, Property__c
          FROM Listing__c
          WHERE Id = :propertyId
          WITH SECURITY_ENFORCED
          LIMIT 1
        ];
        if (
          !listing.isEmpty() &&
          Property_File__c.SObjectType.getDescribe().isDeletable()
        ) {
          List<Property_File__c> allMedia = [
            SELECT Id, Property__c
            FROM Property_File__c
            WHERE Property__c = :listing[0].Property__c
          ];
          delete allMedia;
        }
      }
      return true;
    } catch (Exception e) {
      ErrorHandler.insert_errordata(
        e,
        'ImageAndMediaController',
        'deletelistingmedia',
        'Error while deleting Property_File__c record.'
      );
      return false;
    }
  }

  /**
   * Method Name : getS3ConfigSettings
   * @return AWS_Config__c details
   * @description : Used to return the AWS_Config__c custom setting record.
   */
  @AuraEnabled(cacheable=true)
  public static AWS_Config__c getS3ConfigSettings() {
    try {
      return AWS_Config__c.getOrgDefaults();
    } catch (Exception e) {
      ErrorHandler.insert_errordata(
        e,
        'ImageAndMediaController',
        'getS3ConfigSettings',
        'Error while getting AWS_Config__c record.'
      );
      return null;
    }
  }

  /**
   * Method Name : updatePropertyFileRecords
   * @param itemsToUpdate to stored the Property_File__c records
   * @return String value
   * @description : Used to update the Property_File__c records.
   */
  @AuraEnabled
  public static String updatePropertyFileRecords(
    List<Map<String, Object>> itemsToUpdate
  ) {
    try {
      if (
        !Property_File__c.SObjectType.getDescribe().isAccessible() ||
        !Property_File__c.SObjectType.getDescribe().isUpdateable()
      ) {
        throw new AuraHandledException(
          'Property_File__c is not accessible, updateable.'
        );
      }

      List<Property_File__c> recordsToUpdate = new List<Property_File__c>();

      for (Map<String, Object> fields : itemsToUpdate) {
        Property_File__c existingRecord = new Property_File__c(
          Id = (String) fields.get('Id')
        );
        for (String fieldName : fields.keySet()) {
          if (fieldName != 'Id') {
            existingRecord.put(fieldName, fields.get(fieldName));
          }
        }
        recordsToUpdate.add(existingRecord);
      }

      if (!recordsToUpdate.isEmpty()) {
        update recordsToUpdate;
      }

      return 'success';
    } catch (Exception e) {
      ErrorHandler.insert_errordata(
        e,
        'ImageAndMediaController',
        'updatePropertyFileRecords',
        'Error while updating Property_File__c records.'
      );
      return 'error' + e.getMessage() + e.getLineNumber();
    }
  }
}
