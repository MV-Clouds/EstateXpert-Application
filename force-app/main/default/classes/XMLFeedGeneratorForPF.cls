/**
* Class Name : XMLFeedGeneratorForPF
* Test Class : XMLFeedPortalTest
* Created By : Karan Singh
* Last Modified Date : 24/06/2024
* Last Modified By : Karan Singh
* @description : Used to generate XML Feed for Property Finder portal.
*/
public class XMLFeedGeneratorForPF {
    public String recordID;
    public String xmlstring { get; set; }

    /**
    * Method Name : XMLFeedGeneratorForPF
    * @description : Used to generate XML data using listing records.
    * @return Listing Details in XML format having return type String..
    */
    public XMLFeedGeneratorForPF() {
        try {
            recordID = ApexPages.currentPage().getParameters().get('Id').escapeHtml4();
    
            Set<Id> listingIds = new Set<Id>();

            List<PortalListing__c> portalListings = [SELECT Id, Listing__c, Portal__c, Portal__r.LastModifiedDate FROM PortalListing__c WHERE Portal__c =: recordID AND SystemIsActive__c = True WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];

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
        
            // Create XMLStreamWriter instance
            XmlStreamWriter writer = new XmlStreamWriter();
        
            // Start writing XML
            writer.writeStartDocument('utf-8', '1.0');
            writer.writeStartElement(null, 'list', null); //Start of List Node
            writer.writeAttribute(null, null, 'last_update', portalListings[0].MVEX__Portal__r.LastModifiedDate.format('yyyy-MM-dd HH:mm:ss')); //Listing Node Attribute
            writer.writeAttribute(null, null, 'listing_count', String.valueOf(records.size())); //Listing Node Attribute
            
        
            for (Map<String,Object> record : modifiedRecords) {
                writer.writeStartElement(null, 'property', null); //Start of Property Node
                String listingType = (String)record.get('MVEX__Listing_Type__c');
                String rentFrequency = (String)record.get('MVEX__Rent_Frequency__c');
                String lastModifiedDate = '';
                if (record.get('LastModifiedDate') != null) {
                    Datetime lastModifiedDatetime = (Datetime)record.get('LastModifiedDate');
                    lastModifiedDate = lastModifiedDatetime.format('yyyy-MM-dd HH:mm:ss');
                }
                writer.writeAttribute(null, null, 'last_update', lastModifiedDate); //Property Node Attribute
                
                for (String fieldName : portalFieldNames) {
                    if (!isAgentField(fieldName)) {
                        if (fieldName == 'price') {
                            Object fieldValue = record.get(fieldName);
                
                            if (fieldValue != null) {
                                if (listingType == 'Rent' && rentFrequency != null) {
                                    writer.writeStartElement(null, fieldName, null);
                                    writer.writeStartElement(null, rentFrequency.toLowerCase(), null);
                                    writer.writeCharacters(String.valueOf(fieldValue));
                                    writer.writeEndElement();
                                    writer.writeEndElement();
                                } else {
                                    writer.writeStartElement(null, fieldName, null);
                                    writer.writeCharacters(String.valueOf(fieldValue));
                                    writer.writeEndElement();
                                }
                            }
                        }   else {
                            Object fieldValue = record.get(fieldName);
        
                            if (fieldValue != null) {
                                writer.writeStartElement(null, fieldName, null);
                                writer.writeCharacters(String.valueOf(fieldValue));
                                writer.writeEndElement();
                            }
                        }
                    }
                }
                
                writer.writeStartElement(null, 'agent', null);
                for (String fieldName : portalFieldNames) {
                    if (isAgentField(fieldName)) {
                        Object fieldValue = record.get(fieldName);
                        if (fieldValue != null) {
                            writer.writeStartElement(null, fieldName, null);
                            writer.writeCharacters(String.valueOf(fieldValue));
                            writer.writeEndElement();
                        }
                    }
                }
                writer.writeEndElement();
                
                if (propertyMediaUrlsMap.containsKey((Id)record.get('MVEX__Property__c'))) {
                    
                    // Start video_tour_url, image and floor plan view360 nodes
                    Set<String> videoUrls = new Set<String>();
                    Set<String> view360Urls = new Set<String>();
                    Set<String> floorPlanUrls = new Set<String>();
                    Map<String, Datetime> noTagUrls = new Map<String, Datetime>();
                    for (Property_File__c media : propertyMediaUrlsMap.get((Id)record.get('MVEX__Property__c'))) {
                        String imageUrl = String.isNotBlank(media.ExternalLink__c) ? media.ExternalLink__c : media.BaseUrl__c;
                        Datetime lastModifiedDateofMedia = media.LastModifiedDate;
                        if (media.Tags__c != null) {
                            List<String> tagsList = media.Tags__c.split(';');
                            for (String tag : tagsList) {
                                if (tag == 'Virtual Tour') {
                                    videoUrls.add(imageUrl);
                                } else if (tag == '360tour') {
                                    view360Urls.add(imageUrl);
                                } else if (tag == 'Floorplan'){
                                    floorPlanUrls.add(imageUrl);
                                } else {
                                    noTagUrls.put(imageUrl, lastModifiedDateofMedia);
                                }
                            }
                        } else {
                            noTagUrls.put(imageUrl, lastModifiedDateofMedia);
                        }
                    }

                    // Write photo nodes
                    if (!noTagUrls.isEmpty()) {
                        writer.writeStartElement(null, 'photo', null);
                        for (String url : noTagUrls.keySet()) {
                            writer.writeStartElement(null, 'url', null);
                            writer.writeAttribute(null, null, 'last_update', noTagUrls.get(url).format('yyyy-MM-dd HH:mm:ss'));
                            writer.writeAttribute(null, null, 'watermark', 'yes');
                            writer.writeCharacters(url);
                            writer.writeEndElement();
                        }
                        writer.writeEndElement();
                    }

                    // Write floor_plan nodes
                    if (!floorPlanUrls.isEmpty()) {
                        writer.writeStartElement(null, 'floor_plan', null);
                        for (String url : floorPlanUrls) {
                            writer.writeStartElement(null, 'url', null);
                            writer.writeCharacters(url);
                            writer.writeEndElement();
                        }
                        writer.writeEndElement();
                    }

                    // Write video_tour_url nodes
                    if (!videoUrls.isEmpty()) {
                        writer.writeStartElement(null, 'video_tour_url', null);
                        for (String url : videoUrls) {
                            writer.writeCData(url);
                        }
                        writer.writeEndElement();
                    }

                    // Write video_tour_url nodes
                    if (!view360Urls.isEmpty()) {
                        writer.writeStartElement(null, 'view360', null);
                        for (String url : view360Urls) {
                            writer.writeCData(url);
                        }
                        writer.writeEndElement();
                    }
            
                }
                
                writer.writeEndElement(); // End of property node
            }
            
            // End writing XML
            writer.writeEndElement(); // End of list node
            writer.writeEndDocument();
        
            // Get the XML string
            xmlstring = writer.getXmlString();

        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            System.debug('Exception: ' + e.getLineNumber());
            xmlstring = '<?xml version="1.0" encoding="UTF-8"?><Failed><Error>' + e.getMessage() + '</Error><Line>' + e.getLineNumber() + '</Line></Failed>';
        }
        System.debug('xmlstring: ' + xmlstring);
    }

    /**
    * Method Name : isAgentField
    * @description : Used to filter agents field.
    * @param fieldName of type String.
    * @return true or false based on fieldName passed.
    */
    private Boolean isAgentField(String fieldName) {
        return fieldName == 'id' || 
               fieldName == 'name' || 
               fieldName == 'email' || 
               fieldName == 'phone';
    }

    /**
    * Method Name : getFieldNames
    * @description : Used to all fields of listing and portal listing field mapping.
    * @return List of String that contains the field names of Listing.
    */
    private Map<String, Map<String, String>> getFieldNames() {
        Map<String, Map<String, String>> fieldApiNameToDetailsMap = new Map<String, Map<String, String>>();
        try {
            List<Portal_Listing_Mapping__c> getPortalRecordLabels = [SELECT Name, Listing_Field_API_Name__c, MVEX__Value_Mapping__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: 'Propertyfinder' AND Listing_Field_API_Name__c != null WITH SECURITY_ENFORCED];
            
            for (Portal_Listing_Mapping__c getPortalRecord : getPortalRecordLabels) {
                Map<String, String> detailsMap = new Map<String, String>();
                detailsMap.put('Label', getPortalRecord.Name);
                detailsMap.put('ValueMapping', getPortalRecord.MVEX__Value_Mapping__c);
                fieldApiNameToDetailsMap.put(getPortalRecord.Listing_Field_API_Name__c, detailsMap);
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        return fieldApiNameToDetailsMap;
    }    

    /**
    * Method Name : generateDynamicQuery
    * @description : Used to make a string of all fields that needs to be query.
    * @param fieldNames of type List of String that contains the list of fields api name that need to be query.
    * @param listingIds of type Set of Id that contains the listing Ids to get.
    * @return Query String.
    */
    public String generateDynamicQuery(List<String> fieldNames, Set<Id> listingIds) {
        String query = 'SELECT MVEX__Property__c, LastModifiedDate, MVEX__Listing_Type__c, MVEX__Rent_Frequency__c';

        for (String fieldName : fieldNames) {
            query += ', ' + fieldName;
        }

        query += ' FROM MVEX__Listing__c WHERE Id IN :listingIds';

        return query;
    }

    /**
    * Method Name : replaceFieldApiNamesWithMapping
    * @description : Used to replace listing field api anem with portal field label.
    * @param records of type List of SObject.
    * @return List of Map of String and Object.
    */
    private List<Map<String, Object>> replaceFieldApiNamesWithMapping(List<SObject> records, Map<String, Map<String, String>> fieldApiNameToLabelMap) {

        List<Map<String, Object>> modifiedRecords = new List<Map<String, Object>>();
        for (SObject record : records) {
            Map<String, Object> recordMap = record.getPopulatedFieldsAsMap();
            Map<String, Object> modifiedRecordMap = new Map<String, Object>();
    
            for (String fieldApiName : recordMap.keySet()) {
                if (fieldApiNameToLabelMap.containsKey(fieldApiName)) {
                    String mappedLabel = fieldApiNameToLabelMap.get(fieldApiName).get('Label');
                    String valueMapping = fieldApiNameToLabelMap.get(fieldApiName).get('ValueMapping');
                    Object fieldValue = recordMap.get(fieldApiName);
    
                    if (valueMapping != null && valueMapping != '') {
                        fieldValue = applyValueMapping(fieldValue, valueMapping);
                    }
    
                    modifiedRecordMap.put(mappedLabel, fieldValue);
                } else {
                    modifiedRecordMap.put(fieldApiName, recordMap.get(fieldApiName));
                }
            }
    
            modifiedRecords.add(modifiedRecordMap);
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
        Map<String, String> valueMap = new Map<String, String>();
        if (valueMapping != null && valueMapping != '') {
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
    }
    
}