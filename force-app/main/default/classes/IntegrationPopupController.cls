public with sharing class IntegrationPopupController {
    @AuraEnabled
    public static void saveSettings(String secretAccessId, String accessId, String s3BucketNameId,String s3RegionNameId) {
        // Fetch current settings or create new if not exist
        MVEX__AWS_Config__c settings = MVEX__AWS_Config__c.getOrgDefaults();
        if (settings == null) {
            settings = new MVEX__AWS_Config__c();
            settings.SetupOwnerId = UserInfo.getOrganizationId();
        }
        // Set values
        settings.MVEX__AWS_Secret_Access_Key__c = secretAccessId;
        settings.MVEX__AWS_Access_Key__c = accessId;
        settings.MVEX__S3_Bucket_Name__c = s3BucketNameId;
        settings.MVEX__S3_Region_Name__c = s3RegionNameId;
        // Save settings
        upsert settings;
    }
    @AuraEnabled
    public static MVEX__AWS_Config__c getSettings() {
        return MVEX__AWS_Config__c.getOrgDefaults();
    }
}