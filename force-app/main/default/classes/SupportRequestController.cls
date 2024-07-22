/**
* Class Name : SupportRequestController
* Test Class : Pending
* Date : 22/07/2024
* Created By : Vyom Soni
* Last Modified Date : 22-07-2024
* Last Modified By : Vyom Soni
* @description : Used in MarektingListFilterCmp and MarketingListFilterAddCmp LWC components.
*/
public with sharing class SupportRequestController {
    /**
    * Method Name : sendemail
    * @description : this method send email with attachment using the single email message service.
    * @param name String value
    * @param email String value
    * @param subject String value
    * @param body String value
    * @param fname list of String value
    * @param fbase64 list of String value
    * @return string string message.
    */
    @AuraEnabled
    public static String sendemail(String name, String email, String subject, String body, List<String> fname, List<String> fbase64){
        try{
            List<Messaging.SingleEmailMessage> emailList = new List<Messaging.SingleEmailMessage>();
            String myCustomLabel = System.Label.supportEmail;
            List<String> toEmailAddress = new List<String>();
            if(myCustomLabel.contains(',')){
                toEmailAddress.addAll(myCustomLabel.split(','));
            }else{ 
                toEmailAddress.add(myCustomLabel); 
            }             

            List<Messaging.Emailfileattachment> fileAttachments = new List<Messaging.Emailfileattachment>();
            for (Integer i = 0; i < fname.size(); i++){

                Messaging.Emailfileattachment efat = new Messaging.Emailfileattachment();
                efat.setFileName(fname[i]);
                String fdata = fbase64[i];
                efat.setBody(EncodingUtil.base64Decode(fdata));
                fileAttachments.add(efat);
            }

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setSubject(subject);
            mail.setplaintextbody(body + '\n\n\nFrom ' + name + '\nEmail ' + email);
            mail.setToAddresses(toEmailAddress) ;
            if (fileAttachments != null && fileAttachments.size() > 0){
                mail.setFileAttachments(fileAttachments);
            }
            emailList.add(mail);
            Messaging.sendEmail(emailList);

            return 'success';
        } catch (Exception e){
            return 'fail';
        }
    }

}