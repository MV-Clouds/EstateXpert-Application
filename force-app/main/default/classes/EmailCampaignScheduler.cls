public class EmailCampaignScheduler implements Schedulable {
    private Id emailCampaignId;
    private String primaryRecipientsJson;
    private String ccRecipientsJson;
    private String bccRecipientsJson;
    private List<Marketing_Email_Campaign__c> emails;

    public EmailCampaignScheduler(Id emailCampaignId, String primaryRecipients, String ccRecipients, String bccRecipients,List<Marketing_Email_Campaign__c> emailCampaigns) {
        this.emailCampaignId = emailCampaignId;
        this.primaryRecipientsJson = primaryRecipients;
        this.ccRecipientsJson = ccRecipients;
        this.bccRecipientsJson = bccRecipients;
        this.emails = emailCampaigns;
    }

    public void execute(SchedulableContext sc) {
        // Deserialize recipient lists
        List<Map<String, Object>> primaryRecipients = (List<Map<String, Object>>) JSON.deserializeUntyped(primaryRecipientsJson);
        List<Map<String, Object>> ccRecipients = (List<Map<String, Object>>) JSON.deserializeUntyped(ccRecipientsJson);
        List<Map<String, Object>> bccRecipients = (List<Map<String, Object>>) JSON.deserializeUntyped(bccRecipientsJson);

        System.debug('emailCampaigns in batch class==> ' + emails);

    }
}
