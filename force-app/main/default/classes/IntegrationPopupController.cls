/**
* Class Name : IntegrationPopupController
* Date : 06-08-2024
* Created By : Vyom Soni
* Last Modified Date : 07-08-2024
* Last Modified By : Vyom Soni
* @description : Used in the integrationPopUp lwc component
*/
public with sharing class IntegrationPopupController {
    
    /**
    * Method Name : saveSettings
    * @description : save the updated values in custom settings.
    * @param jsonData String value.
    * @param integrationType String value.
    */
    @AuraEnabled
    public static void saveSettings(String jsonData, String integrationType) {
        // Deserialize JSON data into a Map<String, Object>
        Map<String, Object> fieldMap = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
        // Create a Map<String, String> to store the converted values
        Map<String, String> stringFieldMap = new Map<String, String>();
        // Iterate over the original map and cast values to String
        for (String key : fieldMap.keySet()) {
            if(key.endsWith('__c')){
                stringFieldMap.put(key, (String) fieldMap.get(key));
            }
        }

        // Now use the stringFieldMap to update the settings
        if (integrationType == 'AWS') {

            AWS_Config__c settings = AWS_Config__c.getOrgDefaults();
            if (settings == null) {
                settings = new AWS_Config__c();
                settings.SetupOwnerId = UserInfo.getOrganizationId();
            }
            // Dynamically set the fields based on the map keys
            for (String apiName : stringFieldMap.keySet()) {
                settings.put(apiName, stringFieldMap.get(apiName));
            }
            upsert settings;

        } else if (integrationType == 'Gmail') {

            GmailConfig__c settings = GmailConfig__c.getOrgDefaults();
            if (settings == null) {
                settings = new GmailConfig__c();
                settings.SetupOwnerId = UserInfo.getOrganizationId();
            }
            for (String apiName : stringFieldMap.keySet()) {
                settings.put(apiName, stringFieldMap.get(apiName));
            }
            upsert settings;

        } else if (integrationType == 'Outlook') {

            OutlookConfig__c settings = OutlookConfig__c.getOrgDefaults();
            if (settings == null) {
                settings = new OutlookConfig__c();
                settings.SetupOwnerId = UserInfo.getOrganizationId();
            }
            for (String apiName : stringFieldMap.keySet()) {
                settings.put(apiName, stringFieldMap.get(apiName));
            }
            upsert settings;

        } else if (integrationType == 'WhatsApp') {

            WhatsAppConfig__c settings = WhatsAppConfig__c.getOrgDefaults();
            if (settings == null) {
                settings = new WhatsAppConfig__c();
                settings.SetupOwnerId = UserInfo.getOrganizationId();
            }
            for (String apiName : stringFieldMap.keySet()) {
                settings.put(apiName, stringFieldMap.get(apiName));
            }
            upsert settings;

        } else if (integrationType == 'Social Media') {

            SocialmediaConfig__c settings = SocialmediaConfig__c.getOrgDefaults();
            if (settings == null) {
                settings = new SocialmediaConfig__c();
                settings.SetupOwnerId = UserInfo.getOrganizationId();
            }
            for (String apiName : stringFieldMap.keySet()) {
                settings.put(apiName, stringFieldMap.get(apiName));
            }
            upsert settings;

        }
    }
    
    /**
    * Method Name : getSettings
    * @description : retrieve the selected custom setting record.
    * @param integrationType String value.
    */
    @AuraEnabled
    public static Object getSettings(String integrationType) {

        if (integrationType == 'AWS') {
            return AWS_Config__c.getOrgDefaults();
        } else if (integrationType == 'Gmail') {
            return GmailConfig__c.getOrgDefaults();
        } else if (integrationType == 'Outlook') {
            return OutlookConfig__c.getOrgDefaults();
        } else if (integrationType == 'WhatsApp') {
            return WhatsAppConfig__c.getOrgDefaults();
        } else if (integrationType == 'Social Media') {
            return SocialmediaConfig__c.getOrgDefaults();
        }
        return null;

    }
}