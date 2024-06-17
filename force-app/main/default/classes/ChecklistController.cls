public with sharing class ChecklistController {
    public ChecklistController() {

    }
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAllObjectNames() {
        Map<String, String> objectNamesMap = new Map<String, String>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        for (String objectName : globalDescribe.keySet()) {
            Schema.SObjectType objectType = globalDescribe.get(objectName);
            if (objectType != null && !objectType.getDescribe().isDeprecatedAndHidden()) {
                Schema.DescribeSObjectResult objResult = objectType.getDescribe();
                
                if (objResult.isAccessible() && objResult.isUpdateable()) {
                    objectNamesMap.put(objResult.getName(), objResult.getLabel());
                }
            }
        }
        
        return objectNamesMap;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getAllFieldNames(String objectName) {
       // Describe the SObject
       Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
        
       // Check for object access
       if (!sObjectType.getDescribe().isAccessible()) {
           throw new AuraHandledException('No access to object: ' + objectName);
       }
       
       // Retrieve field descriptions
       Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
       List<String> fieldLabels = new List<String>();
       
       // Iterate through the fields and get the labels
       for (String fieldName : fields.keySet()) {
           Schema.DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();
           fieldLabels.add(fieldDescribe.getLabel());
       }
       
       // Sort the field labels
       fieldLabels.sort();
       
       return fieldLabels;

    }
}