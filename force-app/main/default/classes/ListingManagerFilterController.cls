public with sharing class ListingManagerFilterController {
    @AuraEnabled
    public static List<Map<String, Object>> getListingFields(String objectApiName) {
        return getFieldsForObject(objectApiName, new Set<String>());
    }

    private static List<Map<String, Object>> getFieldsForObject(String objectApiName, Set<String> visitedObjects) {
        List<Map<String, Object>> fieldsList = new List<Map<String, Object>>();

        // Avoid circular references by checking if the object has already been visited
        if (visitedObjects.contains(objectApiName)) {
            return fieldsList;
        }

        // Mark the current object as visited
        visitedObjects.add(objectApiName);

        // Ensure the object is valid and fetch its describe result
        if (Schema.getGlobalDescribe().containsKey(objectApiName)) {
            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();

            for (String fieldName : fieldsMap.keySet()) {
                Map<String, Object> fieldDetails = new Map<String, Object>();
                Schema.SObjectField field = fieldsMap.get(fieldName);
                Schema.DescribeFieldResult fieldResult = field.getDescribe();
                fieldDetails.put('apiName', fieldName);
                fieldDetails.put('label', fieldResult.getLabel());
                fieldDetails.put('type', fieldResult.getType().name());

                // Handle reference fields
                if (fieldResult.getType() == Schema.DisplayType.REFERENCE) {
                    List<Map<String, Object>> referenceFieldsList = new List<Map<String, Object>>();
                    for (Schema.SObjectType referenceTo : fieldResult.getReferenceTo()) {
                        referenceFieldsList.addAll(getFieldsForReference(referenceTo.getDescribe().getName(), visitedObjects));
                    }
                    fieldDetails.put('referenceFields', referenceFieldsList);
                }

                fieldsList.add(fieldDetails);
            }
        } else {
            throw new AuraHandledException('Object ' + objectApiName + ' does not exist.');
        }

        return fieldsList;
    }

    // Separate method to fetch fields for reference objects
    private static List<Map<String, Object>> getFieldsForReference(String referenceApiName, Set<String> visitedObjects) {
        List<Map<String, Object>> referenceFieldsList = new List<Map<String, Object>>();
        
        // Ensure the reference object is valid and fetch its describe result
        if (Schema.getGlobalDescribe().containsKey(referenceApiName)) {
            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(referenceApiName).getDescribe();
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();

            for (String fieldName : fieldsMap.keySet()) {
                Map<String, Object> fieldDetails = new Map<String, Object>();
                Schema.SObjectField field = fieldsMap.get(fieldName);
                Schema.DescribeFieldResult fieldResult = field.getDescribe();
                fieldDetails.put('apiName', fieldName);
                fieldDetails.put('label', fieldResult.getLabel());
                fieldDetails.put('type', fieldResult.getType().name());

                // Avoid further recursion for nested references at this level
                if (fieldResult.getType() == Schema.DisplayType.REFERENCE) {
                    fieldDetails.put('referenceFields', new List<Map<String, Object>>());
                }

                referenceFieldsList.add(fieldDetails);
            }
        }

        return referenceFieldsList;
    }
}
