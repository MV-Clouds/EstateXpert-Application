public with sharing class PortalTriggerHandler {

    public void OnAfterInsert(Portal__c[] newPortal) {
        List<Portal__c> portalsToUpdate = new List<Portal__c>();
        ForceSiteURL__c forceSiteURL = ForceSiteURL__c.getOrgDefaults();
        
        for (Portal__c portal : newPortal) {
            Portal__c updatedPortal = new Portal__c();
            if (portal.generator__c == 'Propertyfinder') {
                updatedPortal.Id = portal.Id;
                updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForPF?Id=' + portal.Id; 
                portalsToUpdate.add(updatedPortal);
            } else if (portal.generator__c == 'Bayut') {
                updatedPortal.Id = portal.Id;
                updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForBayut?Id=' + portal.Id + '&isByt=true';
                portalsToUpdate.add(updatedPortal);
            } else if (portal.generator__c == 'Dubizzle') {
                updatedPortal.Id = portal.Id;
                updatedPortal.XML_Feed_URL__c = forceSiteURL.SiteUrl__c + 'XMLFeedForBayut?Id=' + portal.Id + '&isDbzl=true';
                portalsToUpdate.add(updatedPortal);
            }
        }
        
        if (!portalsToUpdate.isEmpty()) {
            update portalsToUpdate;
        }
    }
    
}