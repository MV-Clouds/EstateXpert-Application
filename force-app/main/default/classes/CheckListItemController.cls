/**
* Class Name : CheckListItemController
* Test Class : pending
* Created By : Karan Singh
* Last Modified Date : 09/07/2024
* Last Modified By : Karan Singh
* @description : Used to get object fields and name.
*/
public with sharing class CheckListItemController {

    /**
    * Class Name : FieldWrapper
    * @description : Used to get field label and value.
    */
    public class FieldWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    /**
    * Class Name : ObjectFieldsWrapper
    * @description : Used to get object fields and name.
    */
    public class ObjectFieldsWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public List<FieldWrapper> fields;
        @AuraEnabled public List<Checklist__c> checklist;
    }

    /**
    * Method Name : getObjectFields
    * @param objectName - String
    * @description : Used to get object fields and name.
    * @return ObjectFieldsWrapper having return type ObjectFieldsWrapper.
    */
    @AuraEnabled
    public static ObjectFieldsWrapper getObjectFields(String objectName){
        ObjectFieldsWrapper result = new ObjectFieldsWrapper();
        result.fields = new List<FieldWrapper>();
        result.checklist = new List<Checklist__c>();
        try {
            result.checklist = [SELECT Id, Name, Field_Name__c, Object_Name__c, Operator__c, Sequence__c, Value__c, Description__c FROM Checklist__c WHERE Object_Name__c = :objectName WITH SECURITY_ENFORCED ORDER BY Sequence__c NULLS LAST, Name];
            
            // Get the object's label
            Schema.DescribeSObjectResult describeSObjectResult = Schema.getGlobalDescribe().get(objectName).getDescribe();
            result.label = describeSObjectResult.getLabel();
            
            // Get the object's fields
            Map<String, Schema.SObjectField> fieldsMap = describeSObjectResult.fields.getMap();
            for (String fieldName : fieldsMap.keySet()) {
                FieldWrapper fieldInfo = new FieldWrapper();
                fieldInfo.label = fieldsMap.get(fieldName).getDescribe().getLabel();
                fieldInfo.value = fieldName;
                result.fields.add(fieldInfo);
            }
            
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'CheckListItemController', 'getObjectFields', 'Error while getting object fields.');
        }
        return result;
    }

    /**
    * Class Name : ChecklistWrapper
    * @description : Used to get checklist details.
    */
    public class ChecklistWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String fieldName;
        @AuraEnabled public String description;
        @AuraEnabled public String fieldLabel;
        @AuraEnabled public String objectName;
        @AuraEnabled public String operator;
        @AuraEnabled public String value;
        @AuraEnabled public Boolean completed;
        @AuraEnabled public Boolean showDropdown;
        @AuraEnabled public Boolean isDescription;
    }

    /**
    * Method Name : getCheckList
    * @param objectName - String
    * @param recordId - String
    * @description : Used to get checklist details.
    * @return List<ChecklistWrapper> having return type List<ChecklistWrapper>.
    */
    @AuraEnabled
    public static List<ChecklistWrapper> getCheckList(String objectName, String recordId) {
        try {
            List<Checklist__c> checkList = [
                SELECT Id, Name, Field_Name__c, Object_Name__c, Operator__c, Sequence__c, Value__c ,Description__c 
                FROM Checklist__c 
                WHERE Object_Name__c = :objectName 
                WITH SECURITY_ENFORCED 
                ORDER BY Sequence__c NULLS LAST, Name
            ];
            List<Checklist_Item__c> checklistItem = [
                SELECT Id, Checklist__c, Is_Checked__c, Record_Id__c 
                FROM Checklist_Item__c 
                WHERE Record_Id__c = :recordId 
                WITH SECURITY_ENFORCED
            ];

            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
            if (sObjectType == null) {
                throw new AuraHandledException('Invalid object name: ' + objectName);
            }
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
            List<String> fieldNames = new List<String>(fieldMap.keySet());

            // Build dynamic SOQL query
            String allFieldsName = String.join(fieldNames, ',');
            String queryFields = String.escapeSingleQuotes(allFieldsName);
            String sobjectName = String.escapeSingleQuotes(objectName);
            String query = 'SELECT ' + queryFields + ' FROM ' + sobjectName + ' WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1';
            SObject sObjectRecord = Database.query(query);

            List<ChecklistWrapper> wrapperList = new List<ChecklistWrapper>();
            for (Checklist__c item : checkList) {
                ChecklistWrapper wrapper = new ChecklistWrapper();
                wrapper.id = item.Id;
                wrapper.name = item.Name;
                wrapper.description = item.Description__c;
                wrapper.fieldName = item.Field_Name__c;
                wrapper.objectName = item.Object_Name__c;
                wrapper.operator = item.Operator__c;
                wrapper.value = item.Value__c;
                wrapper.completed = false;
                wrapper.showDropdown = false;
                wrapper.isDescription = item.Description__c != null && item.Description__c != '' ? true : false;

                // Set the field label
                if (item.Field_Name__c != null && fieldMap.containsKey(item.Field_Name__c)) {
                    wrapper.fieldLabel = fieldMap.get(item.Field_Name__c).getDescribe().getLabel();
                }

                // Check if Field_Name__c matches any field in the specified object and Value__c matches the value of that field
                if (sObjectRecord != null && item.Field_Name__c != null && item.Value__c != null) {
                    Object fieldValue = sObjectRecord.get(item.Field_Name__c);
                    if (fieldValue != null) {
                        if (item.Operator__c == 'Equals' && String.valueOf(fieldValue).equalsIgnoreCase(item.Value__c)) {
                            wrapper.completed = true;
                        } else if (item.Operator__c == 'Not Equals' && !String.valueOf(fieldValue).equalsIgnoreCase(item.Value__c)) {
                            wrapper.completed = true;
                        }
                    }
                }

                // Check if Checklist__c and checkList.id is same and Is_Checked__c is true
                for (Checklist_Item__c checklistItemRecord : checklistItem) {
                    if (checklistItemRecord.Checklist__c == item.Id && checklistItemRecord.Is_Checked__c == true && item.Field_Name__c == null) {
                        wrapper.completed = true;
                        break;
                    }
                }

                wrapperList.add(wrapper);
            }
            return wrapperList;
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'CheckListItemController', 'getCheckList', 'Error while getting checklist.');
            return null;
        }
    }

    /**
    * Method Name : createCheckListItem
    * @param recordId - String
    * @param checklistId - String
    * @param completed - Boolean
    * @description : Used to create checklist item.
    * @return String having return type String.
    */
    @AuraEnabled
    public static string createCheckListItem(String recordId, String checklistId, Boolean completed){
        try {
            if (!Checklist_Item__c.SObjectType.getDescribe().isAccessible() && 
                !Checklist_Item__c.SObjectType.getDescribe().isCreateable()) {
                throw new AuraHandledException('Checklist_Item__c is not accessible, createable and updateable.');
            }

            List<Checklist_Item__c> checklistItem = [SELECT Id, Checklist__c, Is_Checked__c, Record_Id__c FROM Checklist_Item__c WHERE Checklist__c = :checklistId AND Record_Id__c = :recordId WITH SECURITY_ENFORCED LIMIT 1];
            if(checklistItem.size() > 0){
                checklistItem[0].Is_Checked__c = completed;
                update checklistItem[0];
            } else {
                Checklist_Item__c newChecklistItem = new Checklist_Item__c();
                newChecklistItem.Checklist__c = checklistId;
                newChecklistItem.Is_Checked__c = completed;
                newChecklistItem.Record_Id__c = recordId;
                insert newChecklistItem;
            }
            return 'success';
        } catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'CheckListItemController', 'createCheckListItem', 'Error while creating checklist item.');
            return 'error' + e.getMessage() + e.getLineNumber();
        }
    }

    /**
    * Method Name : manageChecklistRecords
    * @param itemsToCreate - List<Map<String, Object>>
    * @param itemsToUpdate - List<Map<String, Object>>
    * @param itemsToDelete - List<String>
    * @description : Used to manage checklist records.
    * @return String having return type String.
    */
    @AuraEnabled
    public static String manageChecklistRecords(List<Map<String, Object>> itemsToCreate, List<Map<String, Object>> itemsToUpdate, List<String> itemsToDelete) {
        List<Checklist__c> recordsToCreate = new List<Checklist__c>();
        List<Checklist__c> recordsToUpdate = new List<Checklist__c>();
        List<Checklist__c> recordsToDelete = new List<Checklist__c>();

        try {
            if (!Checklist__c.SObjectType.getDescribe().isAccessible() || 
                !Checklist__c.SObjectType.getDescribe().isCreateable() ||
                !Checklist__c.SObjectType.getDescribe().isUpdateable() ||
                !Checklist__c.SObjectType.getDescribe().isDeletable()) {
                throw new AuraHandledException('Checklist__c is not accessible, createable, updateable and deleteable.');
            }

            // Process items to create
            for (Map<String, Object> fields : itemsToCreate) {
                Checklist__c newRecord = new Checklist__c();
                for (String fieldName : fields.keySet()) {
                    newRecord.put(fieldName, fields.get(fieldName));
                }
                recordsToCreate.add(newRecord);
            }

            // Process items to update
            for (Map<String, Object> fields : itemsToUpdate) {
                Checklist__c existingRecord = new Checklist__c(Id = (String) fields.get('Id'));
                for (String fieldName : fields.keySet()) {
                    if (fieldName != 'Id') {
                        existingRecord.put(fieldName, fields.get(fieldName));
                    }
                }
                recordsToUpdate.add(existingRecord);
            }

            // Process items to delete
            for (String id : itemsToDelete) {
                recordsToDelete.add(new Checklist__c(Id = id));
            }

            // Perform DML operations within a single transaction
            if (!recordsToCreate.isEmpty()) {
                insert recordsToCreate;
            }
            if (!recordsToUpdate.isEmpty()) {
                update recordsToUpdate;
            }
            if (!recordsToDelete.isEmpty()) {
                delete recordsToDelete;
            }

            return 'success';
        }catch (Exception e) {
            ErrorHandler.insert_errordata(e, 'CheckListItemController', 'manageChecklistRecords', 'Error while managing checklist records.');
            return 'error' + e.getMessage() + e.getLineNumber();
        }
    }
}