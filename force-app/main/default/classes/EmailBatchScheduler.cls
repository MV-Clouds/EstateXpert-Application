public class EmailBatchScheduler implements Database.Batchable<SObject>, Database.AllowsCallouts {
    private Id campaignId;
    private String selectedPrimaryRecipientsJson;
    private String selectedCCRecipientsJson;
    private String selectedBCCRecipientsJson;

    public EmailBatchScheduler(Id campaignId, String primaryRecipients, String ccRecipients, String bccRecipients) {
        this.campaignId = campaignId;
        this.selectedPrimaryRecipientsJson = primaryRecipients;
        this.selectedCCRecipientsJson = ccRecipients;
        this.selectedBCCRecipientsJson = bccRecipients;
    }

    public Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id, Name, Days_After_Start_Date__c, TimeToSend__c
            FROM Marketing_Email_Campaign__c
            WHERE Marketing_Campaign__c = :campaignId
        ]);
    }

    public void execute(Database.BatchableContext context, List<Marketing_Email_Campaign__c> emailCampaigns) {
        for (Marketing_Email_Campaign__c emailCampaign : emailCampaigns) {
            DateTime scheduleDateTime = calculateScheduleTime(emailCampaign);
            System.schedule(
                'EmailJob_' + emailCampaign.Id,
                getCronExpression(scheduleDateTime),
                new EmailCampaignScheduler(emailCampaign.Id, selectedPrimaryRecipientsJson, selectedCCRecipientsJson, selectedBCCRecipientsJson,emailCampaigns)
            );
        }
    }

    public void finish(Database.BatchableContext context) {
        // Handle any post-processing logic if needed
    }

    // Helper method to calculate scheduled time
    private DateTime calculateScheduleTime(Marketing_Email_Campaign__c emailCampaign) {
        Date startDate = [SELECT Start_Date__c FROM Marketing_Campaign__c WHERE Id = :campaignId].Start_Date__c;
        Integer daysAfterStart = emailCampaign.Days_After_Start_Date__c != null ? Integer.valueOf(emailCampaign.Days_After_Start_Date__c) : 0;
        Time timeToSend = emailCampaign.TimeToSend__c;

        return DateTime.newInstance(startDate.addDays(daysAfterStart), timeToSend);
    }

    // Helper method to generate a cron expression from a DateTime
    private String getCronExpression(DateTime scheduleTime) {
        String seconds = String.valueOf(scheduleTime.second());
        String minutes = String.valueOf(scheduleTime.minute());
        String hours = String.valueOf(scheduleTime.hour());
        String dayOfMonth = String.valueOf(scheduleTime.day());
        String month = String.valueOf(scheduleTime.month());
        String dayOfWeek = '?';
        String year = String.valueOf(scheduleTime.year());

        return String.format('{0} {1} {2} {3} {4} {5} {6}', 
                             new List<String>{seconds, minutes, hours, dayOfMonth, month, dayOfWeek, year});
    }
}
