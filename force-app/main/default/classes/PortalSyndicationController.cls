/**
* Class Name : PortalSyndicationController
* Test Class : PortalSyndicationControllerTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Used to create and manage PortalListing__c records.
*/
public with sharing class PortalSyndicationController {

    /**
    * Method Name : createPortalListingRecord
    * @param listingId to stored the Listing record Id
    * @param portalId to stored the Portal record Id
    * @param actionType to stored the action type
    * @param portalName to stored the portal name
    * @return String value
    @description : Used to create and manage PortalListing__c records.
    */
    @AuraEnabled
    public static string createPortalListingRecord(String listingId, String portalId, String actionType, String portalName){
        try {
            List<PortalListing__c> portalListings = [SELECT Id, SystemIsActive__c FROM PortalListing__c WHERE Listing__c =: listingId AND Portal__c =: portalId AND SystemIsActive__c = true WITH SECURITY_ENFORCED];
            if (portalListings != null && portalListings.size() > 0 && PortalListing__c.SObjectType.getDescribe().isUpdateable()) {
                for (PortalListing__c portalListing : portalListings) {
                    portalListing.SystemIsActive__c = false;
                    portalListing.UnlistedDate__c = System.today();
                }
                update portalListings;

                if (portalName == 'Zoopla') {
                    ZooplaIntegration.zooplaDeleteListing(listingId);
                } else if (portalName == 'Rightmove') {
                    RightmoveIntegration.rightmoveDeleteListing(listingId);
                }
            }

            if (actionType == 'Publish' && PortalListing__c.SObjectType.getDescribe().isCreateable()) {
                PortalListing__c newPortalListing = new PortalListing__c();
                newPortalListing.Listing__c = listingId;
                newPortalListing.Portal__c = portalId;
                newPortalListing.SystemIsActive__c = true;
                newPortalListing.Listed_Date__c = System.today();
                insert newPortalListing;

                if (portalName == 'Zoopla') {
                    ZooplaIntegration.getListingRecordForSync(listingId);
                } else if (portalName == 'Rightmove') {
                    RightmoveIntegration.getListingRecordForSync(listingId);
                }
            }

            return 'Success';

        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationController', 'createPortalListingRecord', 'Error while updating or creating PortalListing__c record.');
            return e.getMessage();
        }
    }

    /**
    * Method Name : fetchPortals
    * @param listingId to stored the Listing record Id
    * @return List<PortalWrapper> that contains portal data.
    * @description : Used to fetch portal records.
    */
    @AuraEnabled
    public static List<PortalWrapper> fetchPortals(String listingId){
        try {
            List<PortalWrapper> portalWrpList = new List<PortalWrapper>();

            List<Portal__c> portalList = new List<Portal__c>([SELECT Id, Name, Status__c, Generator__c, (SELECT Id, SystemIsActive__c FROM Portals_Listing__r WHERE SystemIsActive__c = true and Listing__c =: listingId) FROM Portal__c WHERE Is_Active__c = TRUE WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC LIMIT 1000]);

            Map<String, List<PortalListing__c>> portalStatuCheck = new Map<String, List<PortalListing__c>>();

            for (Portal__c portal : portalList) {
                if (portal.Portals_Listing__r != null && portal.Portals_Listing__r.size() >0) {
                    portalStatuCheck.put(portal.Id, portal.Portals_Listing__r);
                } else {
                    portalStatuCheck.put(portal.Id, null);
                }
            }


            for (Portal__c portal : portalList) {
                PortalWrapper portalWrapper = new PortalWrapper();
                portalWrapper.id = portal.Id;
                portalWrapper.name = portal.Name;
                portalWrapper.pname = portal.Generator__c;
                portalWrapper.status = portalStatusCheck(portalStatuCheck.get(portal.Id));
                if (portalWrapper.status == 'active') {
                    portalWrapper.buttonColor = 'destructive';
                    portalWrapper.buttonLabel = 'Unpublish';
                    portalWrapper.badgeColor = 'slds-badge slds-theme_success';
                    portalWrapper.flag = true;
                } else {
                    portalWrapper.buttonColor = 'brand';
                    portalWrapper.buttonLabel = 'Publish';
                    portalWrapper.badgeColor = 'slds-badge';
                    portalWrapper.flag = false;

                }
                portalWrpList.add(portalWrapper);
            }

            return portalWrpList;
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalSyndicationController', 'fetchPortals', 'Error while fetching portal records.');
            return null;
        }
    }

    /**
    * Method Name : portalStatusCheck
    * @param portalListings to stored the PortalListing__c records
    * @return String value
    * @description : Used to check portal status.
    */
    public static String portalStatusCheck(List<PortalListing__c> portalListings) {
        if (portalListings != null && portalListings.size() > 0) {
            return 'active';
        } else {
            return 'inactive';
        }
    }

    /**
    * Method Name : PortalWrapper
    * @param Id to stored the Portal record Id
    * @param flag to stored the flag value
    * @param name to stored the portal name
    * @param pname to stored the portal generator name
    * @param status to stored the portal status
    * @param buttonColor to stored the button color
    * @param buttonLabel to stored the button label
    * @param badgeColor to stored the badge color
    * @description : Used to store portal data.
    */
    public class PortalWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public Boolean flag;
        @AuraEnabled public String name;
        @AuraEnabled public String pname;
        @AuraEnabled public String status;
        @AuraEnabled public String buttonColor;
        @AuraEnabled public String buttonLabel;
        @AuraEnabled public String badgeColor;
    }
}