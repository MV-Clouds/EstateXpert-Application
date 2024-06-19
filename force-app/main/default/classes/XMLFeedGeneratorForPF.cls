/**
* Class Name : XMLFeedGeneratorForPF
* Test Class : Pending
* Created By : Karan Singh
* Last Modified Date : 07/06/2024
* Last Modified By : Karan Singh
* @description : Used to generate XML Feed for Property Finder portal.
*/
public with sharing class XMLFeedGeneratorForPF {
    public String recordID;
    public String xmlstring { get; set; }
    public List<Portal_Listing_Mapping__c> getPortalRecordLabels;

    /**
    * Method Name : XMLFeedGeneratorForPF
    * @description : Used to generate XML data using listing records.
    * @return Listing Details in XML format having return type String..
    */
    public XMLFeedGeneratorForPF() {
        
        if(!Test.isRunningTest()){
        	recordID = ApexPages.currentPage().getParameters().get('Id').escapeHtml4();
        }
    
        Set<Id> listingIds = new Set<Id>();
        List<PortalListing__c> portalListings;
    
        if(!Test.isRunningTest()){
            portalListings = [SELECT Id, Listing__c, Portal__c, Portal__r.LastModifiedDate FROM PortalListing__c WHERE Portal__c =: recordID AND SystemIsActive__c = True WITH SECURITY_ENFORCED];
        }
        else {
            portalListings = [SELECT Id, Listing__c, Portal__c, Portal__r.LastModifiedDate FROM PortalListing__c WITH SECURITY_ENFORCED LIMIT 10];
        }
    
        for (PortalListing__c portalList : portalListings) {
            if (portalList.Listing__c != null) {
                listingIds.add(portalList.Listing__c);
            }
        }

        List<String> fieldNames = getFieldNames();
        System.debug('Field Names: ' + fieldNames);
        String query = generateDynamicQuery(fieldNames, listingIds);
    
        List<SObject> records = Database.query(query);
    
        Set<Id> propertyIds = new Set<Id>();
        for (SObject record : records) {
            Id propertyId = (Id)record.get('Property__c');
            if (propertyId != null) { propertyIds.add(propertyId);
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
        writer.writeAttribute(null, null, 'last_update', portalListings[0].Portal__r.LastModifiedDate.format('yyyy-MM-dd HH:mm:ss')); //Listing Node Attribute
        writer.writeAttribute(null, null, 'listing_count', String.valueOf(records.size())); //Listing Node Attribute
        
    
        for (SObject record : records) {
            writer.writeStartElement(null, 'property', null); //Start of Property Node
            String listingType = (String)record.get('Listing_Type__c');
            String rentFrequency = (String)record.get('Rent_Frequency__c');
            String lastModifiedDate = '';
            if (record.get('LastModifiedDate') != null) {
                Datetime lastModifiedDatetime = (Datetime)record.get('LastModifiedDate');
                lastModifiedDate = lastModifiedDatetime.format('yyyy-MM-dd HH:mm:ss');
            }
            writer.writeAttribute(null, null, 'last_update', lastModifiedDate); //Property Node Attribute
            
            for (String fieldName : fieldNames) {
                if (!isAgentField(fieldName)) {
                    if (fieldName == 'ShortformOfPrivateAmenities__c') {
                        Object fieldValue = record.get(fieldName);
            
                        if (fieldValue != null) {
                            String amenities = (String) fieldValue;
                            amenities = amenities.replaceAll(' ', ','); // Replace spaces with commas
                            writer.writeStartElement(null, fieldName, null);
                            writer.writeCharacters(amenities);
                            writer.writeEndElement();
                        }
                    }   else if (fieldName == 'ListingPrice_hz__c') {
                        Object fieldValue = record.get(fieldName);
            
                        if (fieldValue != null) {
                            XmlWrapper newWrap = new XmlWrapper();
                            newWrap.listingType = listingType;
                            newWrap.rentFrequency = rentFrequency;
                            newWrap.fieldName = fieldName;
                            newWrap.fieldValue = String.valueOf(fieldValue);

                            forRentAndSalePrice(writer, newWrap);
                        }
                    }   else if (fieldName == 'Completion_Status__c') {
                        Object fieldValue = record.get(fieldName);
            
                        if (fieldValue != null) {
                            forCompletionStatus(writer, fieldName, String.valueOf(fieldValue));
                        }
                    }else {
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
            for (String fieldName : fieldNames) {
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
            
            propertyMediaMethod(writer, propertyMediaUrlsMap, record);
            
            writer.writeEndElement(); // End of property node
        }
        
        // End writing XML
        writer.writeEndElement(); // End of list node
        writer.writeEndDocument();
    
        // Get the XML string
        xmlstring = escapeXml(writer.getXmlString());
    }

    /**
    * Wrapper Class Name : XmlWrapper
    * @description : This Wrapper class used for constructor to pass data to different methods.
    */
    public class XmlWrapper{
        public String fieldName { get; set; }
        public String fieldValue { get; set; }
        public String listingType { get; set; }
        public String rentFrequency { get; set; }
        public SObject record { get; set; }
        public Map<Id, List<Property_File__c>> propertyMediaUrlsMap { get; set; }
    }

    /**
    * Method Name : forRentAndSalePrice
    * @description : Used to generate XML data for node price with conditional based.
    * @param writer of type XmlStreamWriter.
    * @param newWrap of type XmlWrapper.
    */
    private void forRentAndSalePrice(XmlStreamWriter writer, XmlWrapper newWrap) {
        if (newWrap.listingType == 'Rent' && newWrap.rentFrequency != null) {
            writer.writeStartElement(null, newWrap.fieldName, null);
            writer.writeStartElement(null, newWrap.rentFrequency.toLowerCase(), null);
            writer.writeCharacters(String.valueOf(newWrap.fieldValue));
            writer.writeEndElement();
            writer.writeEndElement();
        } else {
            writer.writeStartElement(null, newWrap.fieldName, null);
            writer.writeCharacters(String.valueOf(newWrap.fieldValue));
            writer.writeEndElement();
        }
    }

    /**
    * Method Name : forCompletionStatus
    * @description : Used to generate XML data for node completion status with conditional based.
    * @param writer of type XmlStreamWriter.
    * @param fieldName of type String.
    * @param fieldValue of type String.
    */
    private void forCompletionStatus(XmlStreamWriter writer, String fieldName, String fieldValue) {
        if (fieldValue == 'Completed') {
            writer.writeStartElement(null, fieldName, null);
            writer.writeCharacters('completed');
            writer.writeEndElement();
        } else if(fieldValue == 'Off Plan'){
            writer.writeStartElement(null, fieldName, null);
            writer.writeCharacters('off_plan');
            writer.writeEndElement();
        }
    }

    /**
    * Method Name : propertyMediaMethod
    * @description : Used to generate XML data for media nodes like photos, floor, video and 360view.
    * @param writer of type XmlStreamWriter.
    * @param propertyMediaUrlsMap of type Map<Id, List<Property_File__c>>.
    * @param record of type SObject.
    */
    private void propertyMediaMethod(XmlStreamWriter writer, Map<Id, List<Property_File__c>> propertyMediaUrlsMap, SObject record) {
        if (propertyMediaUrlsMap.containsKey((Id)record.get('Property__c'))) {
                
            // Start video_tour_url, image and floor plan view360 nodes
            Set<String> videoUrls = new Set<String>();
            Set<String> view360Urls = new Set<String>();
            Set<String> floorPlanUrls = new Set<String>();
            Map<String, Datetime> noTagUrls = new Map<String, Datetime>();
            for (Property_File__c media : propertyMediaUrlsMap.get((Id)record.get('Property__c'))) {
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
    }

    /**
    * Method Name : isAgentField
    * @description : Used to filter agents field.
    * @param fieldName of type String.
    * @return true or false based on fieldName passed.
    */
    private Boolean isAgentField(String fieldName) {
        return fieldName == 'Listing_Agent_Full_Name__c' || 
               fieldName == 'Listing_Agent_Email__c' || 
               fieldName == 'Listing_Agent_Phone__c' || 
               fieldName == 'Agents_Unique_Id__c';
    }

    /**
    * Method Name : getFieldNames
    * @description : Used to all fields of listing and portal listing field mapping.
    * @return List of String that contains the field names of Listing.
    */
    public List<String> getFieldNames() {
        List<String> fieldNames = new List<String>();
        try {
            getPortalRecordLabels = [SELECT Name, Listing_Field_API_Name__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: 'Propertyfinder' AND Listing_Field_API_Name__c != null WITH SECURITY_ENFORCED];
            for (Portal_Listing_Mapping__c getPortalRecord : getPortalRecordLabels) {
                fieldNames.add(getPortalRecord.Listing_Field_API_Name__c);
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
        }
        return fieldNames;
    }

    /**
    * Method Name : generateDynamicQuery
    * @description : Used to make a string of all fields that needs to be query.
    * @param fieldNames of type List of String that contains the list of fields api name that need to be query.
    * @param listingIds of type Set of Id that contains the listing Ids to get.
    * @return Query String.
    */
    public String generateDynamicQuery(List<String> fieldNames, Set<Id> listingIds) {
        String query = 'SELECT Id, Property__c, LastModifiedDate, Listing_Type__c, Rent_Frequency__c';

        for (String fieldName : fieldNames) {
            query += ', ' + fieldName;
        }

        query += ' FROM Listing__c WHERE Id IN :listingIds';

        return query;
    }

    /**
    * Method Name : escapeXml
    * @description : Used to replace listing field api anem with portal field label.
    * @param input of type String.
    * @return xml string with replaced value.
    */
    private String escapeXml(String input) {

        for (Portal_Listing_Mapping__c getPropertyFinderLabel : getPortalRecordLabels) {
            input = input.replace(getPropertyFinderLabel.Listing_Field_API_Name__c, getPropertyFinderLabel.Name);
        }

        return input;
    }
}