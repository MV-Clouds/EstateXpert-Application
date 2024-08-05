/**
* Class Name : XMLFeedGeneratorForBayut
* Test Class : XMLFeedPortalTest
* Created By : Karan Singh
* Last Modified Date : 08/08/2024
* Last Modified By : Karan Singh
* @description : Used to generate XML Feed for Bayut and Dubizzle portal.
*/
public with sharing class XMLFeedGeneratorForBayut {
    public String recordID;
    public Boolean isForBayut;
    public Boolean isForDubizzle;
    public String xmlstring { get; set; }

    /**
    * Method Name : XMLFeedGeneratorForBayut
    * @description : Used to generate XML data using listing records.
    * @return Listing Details in XML format having return type String..
    */
    public XMLFeedGeneratorForBayut() {
        try {
            recordID = ApexPages.currentPage().getParameters().get('Id').escapeHtml4();
            String forBayut = ApexPages.currentPage().getParameters().get('isByt');
            if (forBayut != null) {
                isForBayut = Boolean.valueOf(forBayut);
            } else {
                isForBayut = false;
            }
            String forDubizzle = ApexPages.currentPage().getParameters().get('isDbzl');
            if (forDubizzle != null) {
                isForDubizzle = Boolean.valueOf(forDubizzle);
            } else {
                isForDubizzle = false;
            }

            Set<Id> listingIds = new Set<Id>();
            List<PortalListing__c> portalListings;
            
            if (recordId != null && recordId != '') {
                portalListings = [SELECT Id, Listing__c, Portal__c, Portal__r.LastModifiedDate FROM PortalListing__c WHERE Portal__c =: recordID AND SystemIsActive__c = True WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];
            }
            
            for (PortalListing__c portalList : portalListings) {
                if (portalList.Listing__c != null) {
                    listingIds.add(portalList.Listing__c);
                }
            }

            List<String> fieldNames = new List<String>();
            List<String> portalFieldNames = new List<String>();
            Map<String, Map<String, String>> fieldApiNameToLabelMap = getFieldNames();

            for (String fieldName : fieldApiNameToLabelMap.keySet()) {
                fieldNames.add(fieldName);
                portalFieldNames.add(fieldApiNameToLabelMap.get(fieldName).get('Label'));
            }

            String query = generateDynamicQuery(fieldNames, listingIds);
        
            List<SObject> records = Database.query(query);
        
            List<Map<String, Object>> modifiedRecords = replaceFieldApiNamesWithMapping(records, fieldApiNameToLabelMap);
            System.debug('Modified Records: ' + modifiedRecords);

            Set<Id> propertyIds = new Set<Id>();
            for (SObject record : records) {
                Id propertyId = (Id)record.get('MVEX__Property__c');
                if (propertyId != null) { 
                    propertyIds.add(propertyId);
                }
            }

            Map<Id, List<Property_File__c>> propertyMediaUrlsMap = new Map<Id, List<Property_File__c>>();
            for (Property_File__c media : [SELECT BaseUrl__c, ExternalLink__c, Sort_on_Portal_Feed__c, Property__c, LastModifiedDate, Tags__c FROM Property_File__c WHERE Property__c IN :propertyIds AND IsOnPortalFeed__c = true WITH SECURITY_ENFORCED Order BY Sort_on_Portal_Feed__c ASC NULLS LAST, Name ASC]) {
                if (!propertyMediaUrlsMap.containsKey(media.Property__c)) {
                    propertyMediaUrlsMap.put(media.Property__c, new List<Property_File__c>());
                }
                propertyMediaUrlsMap.get(media.Property__c).add(media);
            }

            DOM.Document doc = new DOM.Document();
            dom.XmlNode rootNode = doc.createRootElement('Properties', null, null);

            for (Map<String,Object> record : modifiedRecords) {

                boolean hasFeatureValues = false;
                for (String fieldName : portalFieldNames) {
                    if (fieldName.equalsIgnoreCase('Feature')) {
                        Object fieldValue = record.get(fieldName);
                        if (fieldValue != null) {
                            hasFeatureValues = true;
                            break;
                        }
                    }
                }

                dom.XmlNode propertyNode = rootNode.addChildElement('Property', null, null);
                
                for (String fieldName : portalFieldNames) {
                    if (fieldName != 'Feature') {
                        Object fieldValue = record.get(fieldName);

                        if (fieldValue != null) {
                            dom.XmlNode fieldNode = propertyNode.addChildElement(fieldName, null, null);
                            fieldNode.addTextNode(String.valueOf(fieldValue));
                        }
                    }
                }

                if (hasFeatureValues) {
                    dom.XmlNode feature = propertyNode.addChildElement('Features', null, null);
                    
                    for (String fieldName : portalFieldNames) {
                        if(fieldName == 'Feature'){
                            Object fieldValue = record.get(fieldName);

                            if (fieldValue != null) {
                                dom.XmlNode fieldNode = feature.addChildElement(fieldName, null, null);
                                fieldNode.addTextNode(String.valueOf(fieldValue));
                            }
                        }
                    }
                }

                String lastModifiedDate = '';
                if (record.get('LastModifiedDate') != null) {
                    Datetime lastModifiedDatetime = (Datetime)record.get('LastModifiedDate');
                    lastModifiedDate = lastModifiedDatetime.format('yyyy-MM-dd HH:mm:ss');
                }
                
                dom.XmlNode lastupdate = propertyNode.addChildElement('Last_Updated', null, null);
                lastupdate.addTextNode(lastModifiedDate);

                if (propertyMediaUrlsMap.containsKey((Id)record.get('MVEX__Property__c'))) {
                    dom.XmlNode imageNode = propertyNode.addChildElement('Images', null, null);
                    dom.XmlNode floorNode = null;
                    dom.XmlNode videoNode = null;
                    for (Property_File__c media : propertyMediaUrlsMap.get((Id)record.get('MVEX__Property__c'))) {
                        String imageUrl = String.isNotBlank(media.ExternalLink__c) ? media.ExternalLink__c : media.BaseUrl__c;
                        if (media.Tags__c != null) {
                            List<String> tagsList = media.Tags__c.split(';');
                            for (String tag : tagsList) {
                                if (tag == 'Floorplan') {
                                    if (floorNode == null) {
                                        floorNode = propertyNode.addChildElement('Floor_Plans', null, null);
                                    }
                                    dom.XmlNode fieldNodeImage = floorNode.addChildElement('Floor_Plan', null, null);
                                    fieldNodeImage.addTextNode(imageUrl);
                                } else if (tag == 'Virtual Tour' || tag == '360tour') {
                                    if (videoNode == null) {
                                        videoNode = propertyNode.addChildElement('Videos', null, null);
                                    }
                                    dom.XmlNode fieldNodeImage = videoNode.addChildElement('Video', null, null);
                                    fieldNodeImage.addTextNode(imageUrl);
                                }
                            }
                        }   else {
                            dom.XmlNode fieldNodeImage = imageNode.addChildElement('Image', null, null);
                            fieldNodeImage.addTextNode(imageUrl);
                        }
                    }
                }
                
                dom.XmlNode portal = propertyNode.addChildElement('Portals', null, null);
                if (isForBayut == true) {
                    dom.XmlNode portalValue1 = portal.addChildElement('portal', null, null);
                    portalValue1.addTextNode('Bayut');
                }

                if (isForDubizzle == true) {
                    dom.XmlNode portalValue1 = portal.addChildElement('portal', null, null);
                    portalValue1.addTextNode('Dubizzle');
                }
                
            }

            xmlstring = doc.toXmlString();

        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            System.debug('Exception: ' + e.getLineNumber());
            xmlstring = '<?xml version="1.0" encoding="UTF-8"?><Failed><Error>' + e.getMessage() + '</Error><Line>' + e.getLineNumber() + '</Line></Failed>';
        }

        System.debug('xmlstring-->' + xmlstring);
    }

    /**
    * Method Name : getFieldNames
    * @description : Used to all fields of listing and portal listing field mapping.
    * @return List of String that contains the field names of Listing.
    */
    public Map<String, Map<String, String>> getFieldNames() {
        Map<String, Map<String, String>> fieldApiNameToLabelMap = new Map<String, Map<String, String>>();
        try {
            String picklistValue;
            if ((isForBayut == true && isForDubizzle == true) || isForBayut == true) {
                picklistValue = 'Bayut';
            } else if (isForDubizzle == true) {
                picklistValue = 'Dubizzle';
            }
            List<Portal_Listing_Mapping__c> getPortalRecordLabels = [SELECT Name, Listing_Field_API_Name__c, MVEX__Value_Mapping__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: picklistValue AND Listing_Field_API_Name__c != null WITH SECURITY_ENFORCED];
            
            for (Portal_Listing_Mapping__c getPortalRecord : getPortalRecordLabels) {
                Map<String, String> detailsMap = new Map<String, String>();
                detailsMap.put('Label', getPortalRecord.Name);
                detailsMap.put('ValueMapping', getPortalRecord.MVEX__Value_Mapping__c);
                fieldApiNameToLabelMap.put(getPortalRecord.Listing_Field_API_Name__c, detailsMap);
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        return fieldApiNameToLabelMap;
    }

    /**
    * Method Name : generateDynamicQuery
    * @description : Used to make a string of all fields that needs to be query.
    * @param fieldNames of type List of String that contains the list of fields api name that need to be query.
    * @param listingIds of type Set of Id that contains the listing Ids to get.
    * @return Query String.
    */
    public String generateDynamicQuery(List<String> fieldNames, Set<Id> listingIds) {
        try {
            String query = 'SELECT Id, MVEX__Property__c, LastModifiedDate';

            for (String fieldName : fieldNames) {
                query += ', ' + fieldName;
            }

            query += ' FROM MVEX__Listing__c WHERE Id IN :listingIds';

            return query;
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            return 'SELECT Id, MVEX__Property__c, LastModifiedDate FROM MVEX__Listing__c WHERE Id IN :listingIds';
        }
    }
    
    /**
    * Method Name : replaceFieldApiNamesWithMapping
    * @description : Used to replace listing field api anem with portal field label.
    * @param records of type List of SObject.
    * @return List of Map of String and Object.
    */
    private List<Map<String, Object>> replaceFieldApiNamesWithMapping(List<SObject> records, Map<String, Map<String, String>> fieldApiNameToLabelMap) {
        List<Map<String, Object>> modifiedRecords = new List<Map<String, Object>>();
        try {
            for (SObject record : records) {
                Map<String, Object> recordMap = record.getPopulatedFieldsAsMap();
                Map<String, Object> modifiedRecordMap = new Map<String, Object>();
        
                for (String fieldApiName : recordMap.keySet()) {
                    if (fieldApiNameToLabelMap.containsKey(fieldApiName)) {
                        String mappedLabel = fieldApiNameToLabelMap.get(fieldApiName).get('Label');
                        String valueMapping = fieldApiNameToLabelMap.get(fieldApiName).get('ValueMapping');
                        Object fieldValue = recordMap.get(fieldApiName);
        
                        if (String.isNotBlank(valueMapping)) {
                            fieldValue = applyValueMapping(fieldValue, valueMapping);
                        }
        
                        modifiedRecordMap.put(mappedLabel, fieldValue);
                    } else {
                        modifiedRecordMap.put(fieldApiName, recordMap.get(fieldApiName));
                    }
                }
        
                modifiedRecords.add(modifiedRecordMap);
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }

        return modifiedRecords;
    }
    
    /**
    * Method Name : applyValueMapping
    * @description : Used to apply value mapping.
    * @param fieldValue of type Object.
    * @param valueMapping of type String.
    * @return Object.
    */
    private Object applyValueMapping(Object fieldValue, String valueMapping) {
        try {
            Map<String, String> valueMap = new Map<String, String>();
            if (String.isNotBlank(valueMapping)) {
                valueMapping = valueMapping.replaceAll('\\r\\n|\\r|\\n', '');
                for (String mapping : valueMapping.split(',')) {
                    List<String> keyValue = mapping.split('=>');
                    if (keyValue.size() == 2) {
                        valueMap.put(keyValue[0].trim(), keyValue[1].trim());
                    }
                }
            }
        
            if (fieldValue != null) {
                List<String> values = String.valueOf(fieldValue).split(';');
                List<String> mappedValues = new List<String>();
                for (String value : values) {
                    if (valueMap.containsKey(value.trim())) {
                        mappedValues.add(valueMap.get(value.trim()));
                    } else {
                        mappedValues.add(value.trim());
                    }
                }
                return String.join(mappedValues, ',');
            }
        
            return fieldValue;
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            return fieldValue;
        }
    }
}