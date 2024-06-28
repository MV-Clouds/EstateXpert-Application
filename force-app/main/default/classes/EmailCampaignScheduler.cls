public class EmailCampaignScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        System.debug('In the execute method:::');
    }
    
    public static void scheduleEmail(String emailId, DateTime scheduleTime) {
        String cronExp = getCronExpression(scheduleTime);
        String jobName = 'EmailJob_' + emailId;
        System.schedule(jobName, cronExp, new EmailCampaignScheduler());
    }
    
    private static String getCronExpression(DateTime scheduleTime) {
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
