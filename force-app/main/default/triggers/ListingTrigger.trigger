trigger ListingTrigger on Listing__c (after insert, after update, after delete, after undelete, before insert,before update) {

    
    if(ListingTriggerHandler.isFirstTime){

        ListingTriggerHandler handler = new ListingTriggerHandler(trigger.new, trigger.old, trigger.newMap, trigger.oldMap, trigger.isInsert,trigger.isUpdate, trigger.isDelete, trigger.isUndelete);

        if (trigger.isAfter && trigger.isInsert) {
            handler.afterInsertEvent();
        }
    
        if(trigger.isAfter && trigger.isUpdate){
            handler.afterUpdateEvent();
        }
        
        if(trigger.isBefore && trigger.isUpdate){
            handler.beforeUpdateEvent();
        }
    
    }

}