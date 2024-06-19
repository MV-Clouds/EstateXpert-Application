trigger PropertyTrigger on Property__c (after insert, after update, after delete, after undelete, before insert,before update) {

    if(PropertyTriggerHandler.isFirstTime){

        PropertyTriggerHandler.isFirstTime = false;
        PropertyTriggerHandler handler = new PropertyTriggerHandler(trigger.new, trigger.old, trigger.newMap, trigger.oldMap, trigger.isInsert,trigger.isUpdate, trigger.isDelete, trigger.isUndelete);

        if (trigger.isAfter && trigger.isInsert) {
            handler.afterInsertEvent();
        }

        if(trigger.isAfter && trigger.isUpdate){
            handler.afterUpdateEvent();
        }
    }
}