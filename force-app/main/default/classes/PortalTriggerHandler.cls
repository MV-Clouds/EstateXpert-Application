/**
* Class Name : PortalTriggerHandler
* Test Class : PortalTriggerHandlerTest
* Created By : Karan Singh
* Last Modified Date : 30/06/2024
* Last Modified By : Karan Singh
* @description : Used to update the XML_Feed_URL__c field in Portal__c record.
*/
public with sharing class PortalTriggerHandler {

    /**
    * Method Name : onAfterInsert
    * @param newPortal to stored the Portal__c records
    * @description : Used to update the XML_Feed_URL__c field in Portal__c record.
    */
    public void onAfterInsert(Portal__c[] newPortal) {
        try {
            List<Portal__c> portalsToUpdate = new List<Portal__c>();
            ForceSiteURL__c forceSiteURL = ForceSiteURL__c.getOrgDefaults();
            
            for (Portal__c portal : newPortal) {
                Portal__c updatedPortal = new Portal__c();
                if (portal.Generator__c == 'Propertyfinder') {
                    updatedPortal.Id = portal.Id;
                    updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'MVEX__XMLFeedForPF?Id=' + portal.Id; 
                    portalsToUpdate.add(updatedPortal);
                } else if (portal.Generator__c == 'Bayut') {
                    updatedPortal.Id = portal.Id;
                    updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'MVEX__XMLFeedForBayut?Id=' + portal.Id + '&isByt=true';
                    portalsToUpdate.add(updatedPortal);
                } else if (portal.Generator__c == 'Dubizzle') {
                    updatedPortal.Id = portal.Id;
                    updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'MVEX__XMLFeedForBayut?Id=' + portal.Id + '&isDbzl=true';
                    portalsToUpdate.add(updatedPortal);
                }
            }
            
            if (!portalsToUpdate.isEmpty()) {
                if (Schema.sObjectType.Portal__c.isUpdateable()) {
                    update portalsToUpdate;
                } else {
                    throw new DmlException('Insufficient permissions to update Portal__c records.');
                }
            }
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'PortalTriggerHandler', 'onAfterInsert', 'Error while updating portal record.');
        }
    }
    
}