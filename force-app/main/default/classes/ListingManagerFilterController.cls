public with sharing class ListingManagerFilterController {
    @AuraEnabled
    public static List<Map<String, String>> getObjectFields(String objectApiName) {
        List<Map<String, String>> fieldsList = new List<Map<String, String>>();
        Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
        
        for (String fieldName : fieldsMap.keySet()) {
            Map<String, String> fieldDetails = new Map<String, String>();
            Schema.SObjectField field = fieldsMap.get(fieldName);
            Schema.DescribeFieldResult fieldResult = field.getDescribe();
            fieldDetails.put('apiName', fieldName);
            fieldDetails.put('label', fieldResult.getLabel());
            fieldDetails.put('type', fieldResult.getType().name());
            fieldsList.add(fieldDetails);
        }
        
        return fieldsList;
    }
}