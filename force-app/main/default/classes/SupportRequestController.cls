public with sharing class SupportRequestController {

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