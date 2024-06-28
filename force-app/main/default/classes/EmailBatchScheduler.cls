public class EmailBatchScheduler implements Database.Batchable<SObject>, Database.AllowsCallouts {
    private Id campaignId;

    public EmailBatchScheduler(Id campaignId) {
        this.campaignId = campaignId;
    }

    public Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id, Name, Days_After_Start_Date__c, TimeToSend__c
            FROM Marketing_Email_Campaign__c
            WHERE Marketing_Campaign__c = :campaignId
        ]);
    }

    public void execute(Database.BatchableContext context, List<Marketing_Email_Campaign__c> emailCampaigns) {
        List<AsyncApexJob> jobList = new List<AsyncApexJob>();

        for (Marketing_Email_Campaign__c emailCampaign : emailCampaigns) {
            DateTime scheduleDateTime = calculateScheduleTime(emailCampaign);

            System.ScheduleJob(emailCampaign.Name, scheduleDateTime, new ScheduledEmailJob(emailCampaign.Id));
        }

        // Insert scheduled jobs
        if (!jobList.isEmpty()) {
            insert jobList;
        }
    }

    public void finish(Database.BatchableContext context) {
        // Handle any post-processing logic if needed
    }

    // Helper method to calculate scheduled time
    private DateTime calculateScheduleTime(Marketing_Email_Campaign__c emailCampaign) {
        Date startDate = [SELECT Start_Date__c FROM Marketing_Campaign__c WHERE Id = :campaignId].Start_Date__c;
        Integer daysAfterStart = emailCampaign.Days_After_Start_Date__c != null ? emailCampaign.Days_After_Start_Date__c : 0;
        Time timeToSend = emailCampaign.TimeToSend__c;

        return DateTime.newInstance(startDate.addDays(daysAfterStart), timeToSend);
    }
}
