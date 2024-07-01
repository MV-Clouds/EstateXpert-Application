public class EmailCampaignScheduler implements Schedulable {
    private Id emailId;
    private String selectedPrimaryRecipientsJson;
    private String selectedCCRecipientsJson;
    private String selectedBCCRecipientsJson;

    public EmailCampaignScheduler(Id emailId, String selectedPrimaryRecipientsJson, String selectedCCRecipientsJson, String selectedBCCRecipientsJson) {
        this.emailId = emailId;
        this.selectedPrimaryRecipientsJson = selectedPrimaryRecipientsJson;
        this.selectedCCRecipientsJson = selectedCCRecipientsJson;
        this.selectedBCCRecipientsJson = selectedBCCRecipientsJson;
    }

    public void execute(SchedulableContext sc) {
        EmailBatchScheduler emailBatch = new EmailBatchScheduler(emailId, selectedPrimaryRecipientsJson, selectedCCRecipientsJson, selectedBCCRecipientsJson);
        Database.executeBatch(emailBatch);
    }
}
