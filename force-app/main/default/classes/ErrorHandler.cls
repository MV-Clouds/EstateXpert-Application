/**
 * Class Name : ErrorHandler
 * Test Class : Pending
 * Created By : Mitrajsinh Gohil
 * Date : 12/06/2024
 * @description : Used to create Error log records for Error_Handling__c Object for both Aexp methods and JS methods
 */
public with sharing class ErrorHandler{
    /**
     Method Name : insert_errordata
     @param e to stored the Exception
     @param classname to stored the class name
     @param methodname to stored the method name
     @param ErrorBody to stored the Error Body
     @param Source to stored the Source of Error ex:- Apex or JS
     @return Error_Handling__c - reocrd of Error_Handling__c object
     @description insert error data into the obeject as record
     */
    public static Error_Handling__c insert_errordata(Exception e, String classname, String methodname, String ErrorBody){
        try{

            String class_name = classname;
            String method_name = methodname;
            String Error_Body = ErrorBody;

            Error_Handling__c error = new Error_Handling__c();

            error.Error_Message__c = e.getMessage();
            error.Error_Type__c = e.getTypeName();
            error.Line_Number__c = String.valueOf(e.getLineNumber());
            // error.More_Details__c = e.getStackTraceString();
            error.Label__c = e.getTypeName() + ' In ' + class_name + ' Of ' + method_name;
            error.Class_Name__c = class_name;
            error.Method_Name__c = method_name;
            error.Error_Body__c = Error_Body;
            error.Source_of_Error__c = 'Apex';
            if (Schema.sObjectType.Error_Handling__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Error_Message__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Error_Type__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Line_Number__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Label__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Method_Name__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Class_Name__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Error_Body__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Source_of_Error__c.isCreateable()){
                insert error;
                return error;
            }
            return null;

        } catch (Exception error){
            return null;
        }
    }

    @AuraEnabled
    public static Error_Handling__c insert_JSErrorData(String name, String message ,String stack, String componentName, String methodName){
        try{

            String class_name = componentName;
            String method_name = methodName;
            String Error_Body = message;
            String ErrorName = name;
            String ErrorMessage = stack;

            Error_Handling__c error = new Error_Handling__c();

            error.Error_Message__c = ErrorMessage;
            error.Error_Type__c = ErrorName;
            // error.Line_Number__c = String.valueOf(e.getLineNumber());
            // error.More_Details__c = e.getStackTraceString();
            error.Label__c = ErrorName + ' In ' + class_name + ' Of ' + method_name;
            error.Class_Name__c = class_name;
            error.Method_Name__c = method_name;
            error.Error_Body__c = Error_Body;
            error.Source_of_Error__c = 'JavaScript';
            if (Schema.sObjectType.Error_Handling__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Error_Message__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Error_Type__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Line_Number__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Label__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Method_Name__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Class_Name__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Error_Body__c.isCreateable() && Schema.sObjectType.Error_Handling__c.fields.Source_of_Error__c.isCreateable()){
                insert error;
            }
            return error;

        } catch (Exception error){
            return null;
        }
    }
}