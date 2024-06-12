public with sharing class PortalTriggerHandler {
    public void OnBeforeUpdate(Portal__c[] newPortal){
        ForceSiteURL__c forceSiteURL = ForceSiteURL__c.getOrgDefaults();
        System.debug('forceSiteURL---->'+forceSiteURL);
        for (Portal__c portal : newPortal) {
            if (portal.generator__c == 'Propertyfinder') {
                portal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForPF?Id=' + portal.ID; 
            } else if (portal.generator__c == 'Bayut') {
                portal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForBayut?Id=' + portal.ID + '&isByt=true';
            } else if (portal.generator__c == 'Dubizzle') {
                portal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForBayut?Id=' + portal.ID + '&isDbzl=true';
            } 
        }
    }

    public void OnAfterInsert(Portal__c[] newPortal) {
        List<Portal__c> portalsToUpdate = new List<Portal__c>();
        ForceSiteURL__c forceSiteURL = ForceSiteURL__c.getOrgDefaults();
        
        for (Portal__c portal : newPortal) {
            Portal__c updatedPortal = new Portal__c();
            if (portal.generator__c == 'Propertyfinder') {
                updatedPortal.Id = portal.Id;
                updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForPF?Id=' + portal.Id; 
            } else if (portal.generator__c == 'Bayut') {
                updatedPortal.Id = portal.Id;
                updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForBayut?Id=' + portal.Id + '&isByt=true';
            } else if (portal.generator__c == 'Dubizzle') {
                updatedPortal.Id = portal.Id;
                updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForBayut?Id=' + portal.Id + '&isDbzl=true';
            }
            portalsToUpdate.add(updatedPortal);
        }
        
        update portalsToUpdate;
    }
    
}