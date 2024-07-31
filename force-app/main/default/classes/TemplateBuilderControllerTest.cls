@isTest
public class TemplateBuilderControllerTest {
    
    @testSetup
    static void setupTestData() {
        List<Template__c> templates = new List<Template__c>();
        
        for (Integer i = 0; i < 5; i++) {
            Template__c template = new Template__c(
                Object_Name__c = 'Account',
                Label__c = 'Test Template ' + i,
                Template_Body__c = 'Body ' + i,
                Description__c = 'Description ' + i,
                Template_Type__c = 'Type ' + i,
                Status__c = true,
                Subject__c = 'Subject ' + i,
                Template_pattern__c = 'Pattern ' + i
            );
            templates.add(template);
        }
        
        insert templates;
    }
    
    @isTest
    static void testGetAllFieldNames() {
        Test.startTest();
        List<String> fieldNames = TemplateBuilderController.getAllFieldNames('Account');
        Test.stopTest();
        
        System.assertNotEquals(0, fieldNames.size(), 'Field names should be retrieved.');
    }
    
    @isTest
    static void testGetTemplateContentById() {
        Template__c template = [SELECT Id FROM Template__c LIMIT 1];
        
        Test.startTest();
        Template__c result = TemplateBuilderController.getTemplateContentById(template.Id);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Template should be retrieved by Id.');
    }
    
    @isTest
    static void testInsertTemplate() {
        Template__c newTemplate = new Template__c(
            Object_Name__c = 'Contact',
            Label__c = 'New Template',
            Template_Body__c = 'New Body',
            Description__c = 'New Description',
            Template_Type__c = 'New Type',
            Status__c = true,
            Subject__c = 'New Subject',
            Template_pattern__c = 'New Pattern'
        );
        
        Test.startTest();
        String templateId = TemplateBuilderController.insertTemplate(newTemplate);
        Test.stopTest();
        
        System.assertNotEquals(null, templateId, 'Template should be inserted.');
    }
    
    @isTest
    static void testSaveTemplate() {
        Template__c template = [SELECT Id , Label__c,Object_Name__c,Template_Body__c,Description__c,Template_Type__c,Status__c,Subject__c,Template_pattern__c FROM Template__c LIMIT 1];
        template.Label__c = 'Updated Label';
        
        Test.startTest();
        TemplateBuilderController.saveTemplate(template, template.Id);
        Test.stopTest();
        
        Template__c updatedTemplate = [SELECT Label__c FROM Template__c WHERE Id = :template.Id];
        System.debug('updatedTemplate => ' + updatedTemplate);
        System.assertEquals('Updated Label', updatedTemplate.Label__c, 'Template should be updated.');
    }
    
    @isTest
    static void testGetAllObjectNames() {
        Test.startTest();
        Map<String, String> objectNames = TemplateBuilderController.getAllObjectNames();
        Test.stopTest();
        
        System.assertNotEquals(0, objectNames.size(), 'Object names should be retrieved.');
    }
    
    @isTest
    static void testGetTemplateTypePicklistValues() {
        Test.startTest();
        List<String> picklistValues = TemplateBuilderController.getTemplateTypePicklistValues();
        Test.stopTest();
        
        System.assertNotEquals(0, picklistValues.size(), 'Picklist values should be retrieved.');
    }
    
    @isTest
    static void testDeleteTemplate() {
        Template__c template = [SELECT Id FROM Template__c LIMIT 1];
        
        Test.startTest();
        TemplateBuilderController.deleteTemplate(template.Id);
        Test.stopTest();
        
        Integer count = [SELECT COUNT() FROM Template__c WHERE Id = :template.Id];
        System.assertEquals(0, count, 'Template should be deleted.');
    }
    
    @isTest
    static void testGetTemplates() {
        Test.startTest();
        List<Template__c> templates = TemplateBuilderController.getTemplates();
        Test.stopTest();
        
        System.assertNotEquals(0, templates.size(), 'Templates should be retrieved.');
    }
    
    @isTest
    static void testGetRecordsByObject() {
        Test.startTest();
        List<Map<String, Object>> records = TemplateBuilderController.getRecordsByObject('Template__c');
        Test.stopTest();
        
        System.assertNotEquals(0, records.size(), 'Records should be retrieved.');
    }
    
    @isTest
    static void testUpdateTemplateStatus() {
        Template__c template = [SELECT Id FROM Template__c LIMIT 1];
        
        Test.startTest();
        TemplateBuilderController.updateTemplateStatus(template.Id, false);
        Test.stopTest();
        
        Template__c updatedTemplate = [SELECT Status__c FROM Template__c WHERE Id = :template.Id];
        System.assertEquals(false, updatedTemplate.Status__c, 'Template status should be updated.');
    }
}
