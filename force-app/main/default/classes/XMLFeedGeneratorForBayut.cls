/**
* Class Name : XMLFeedGeneratorForBayut
* Test Class : Pending
* Created By : Karan Singh
* Last Modified Date : 07/06/2024
* Last Modified By : Karan Singh
* @description : Used to generate XML Feed for Bayut and Dubizzle portal.
*/
public with sharing class XMLFeedGeneratorForBayut {
    public String recordID;
    public Boolean isForBayut;
    public Boolean isForDubizzle;
    public String xmlstring { get; set; }
    public List<Portal_Listing_Mapping__c> getPortalRecordLabels;

    /**
    * Method Name : XMLFeedGeneratorForBayut
    * @description : Used to generate XML data using listing records.
    * @return Listing Details in XML format having return type String..
    */
    public XMLFeedGeneratorForBayut() {
        
        if(!Test.isRunningTest()){
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
            if (propertyId != null) {
                propertyIds.add(propertyId);
            }
        }

        // Map to store Property_File__c records related to each Property__c
        Map<Id, List<Property_File__c>> propertyMediaUrlsMap = new Map<Id, List<Property_File__c>>();
        for (Property_File__c media : [SELECT BaseUrl__c, ExternalLink__c, Sort_on_Portal_Feed__c, Property__c, LastModifiedDate, Tags__c FROM Property_File__c WHERE Property__c IN :propertyIds AND IsOnPortalFeed__c = true WITH SECURITY_ENFORCED Order BY Sort_on_Portal_Feed__c ASC NULLS LAST, Name ASC]) {
            if (!propertyMediaUrlsMap.containsKey(media.Property__c)) {
                propertyMediaUrlsMap.put(media.Property__c, new List<Property_File__c>());
            }
            propertyMediaUrlsMap.get(media.Property__c).add(media);
        }

        DOM.Document doc = new DOM.Document();
        dom.XmlNode rootNode = doc.createRootElement('Properties', null, null);

        for (SObject record : records) {

            boolean hasFeatureValues = false;
            for (String fieldName : fieldNames) {
                if (fieldName.startsWith('Feature_')) {
                    Object fieldValue = record.get(fieldName);
                    if (fieldValue != null) {
                        hasFeatureValues = true;
                        break;
                    }
                }
            }

            dom.XmlNode propertyNode = rootNode.addChildElement('Property', null, null);
            
            for (String fieldName : fieldNames) {
                if(fieldName != 'Feature_1__c' && 
                   fieldName != 'Feature_2__c' && 
                   fieldName != 'Feature_3__c' && 
                   fieldName != 'Feature_4__c' && 
                   fieldName != 'Feature_5__c' && 
                   fieldName != 'Feature_6__c'){
                    Object fieldValue = record.get(fieldName);
    
                    if (fieldValue != null) {
                        dom.XmlNode fieldNode = propertyNode.addChildElement(fieldName, null, null);
                        fieldNode.addTextNode(String.valueOf(fieldValue));
                    }
                }
            }

            if (hasFeatureValues) {
                dom.XmlNode feature = propertyNode.addChildElement('Features', null, null);
                
                for (String fieldName : fieldNames) {
                    if(fieldName == 'Feature_1__c' || 
                    fieldName == 'Feature_2__c' || 
                    fieldName == 'Feature_3__c' || 
                    fieldName == 'Feature_4__c' || 
                    fieldName == 'Feature_5__c' || 
                    fieldName == 'Feature_6__c'){
                        Object fieldValue = record.get(fieldName);
        
                        // Check for null before adding text node
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

            if (propertyMediaUrlsMap.containsKey((Id)record.get('Property__c'))) {
                dom.XmlNode imageNode = propertyNode.addChildElement('Images', null, null);
                dom.XmlNode floorNode = null;
                dom.XmlNode videoNode = null;
                for (Property_File__c media : propertyMediaUrlsMap.get((Id)record.get('Property__c'))) {
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

        xmlstring = escapeXml(doc.toXmlString());
        System.debug('xmlstring-->' + xmlstring);
    }

    /**
    * Method Name : getFieldNames
    * @description : Used to all fields of listing and portal listing field mapping.
    * @return List of String that contains the field names of Listing.
    */
    public List<String> getFieldNames() {
        List<String> fieldNames = new List<String>();
        try {
            String picklistValue;
            if (isForBayut == true && isForDubizzle == true) {
                picklistValue = 'Bayut';
            } else if (isForDubizzle == true) {
                picklistValue = 'Dubizzle';
            } else if (isForBayut == true) {
                picklistValue = 'Bayut';
            }
            getPortalRecordLabels = [SELECT Name, Listing_Field_API_Name__c FROM Portal_Listing_Mapping__c WHERE Portal_Name__c =: picklistValue AND Listing_Field_API_Name__c != null WITH SECURITY_ENFORCED];
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
        String query = 'SELECT Id, Property__c, LastModifiedDate';

        for (String fieldName : fieldNames) {
            query += ', ' + fieldName;
        }

        query += ' FROM Listing__c WHERE Id IN :listingIds';

        return query;
    }
    
    /**
    * Method Name : escapeXml
    * @description : Used to replace listing field api anem with portal field label.
    * @param input of type String
    * @return xml string with replaced value.
    */
    private String escapeXml(String input) {

        for (Portal_Listing_Mapping__c getPropertyFinderLabel : getPortalRecordLabels) {
            input = input.replace(getPropertyFinderLabel.Listing_Field_API_Name__c, getPropertyFinderLabel.Name);
        }
    
        return input;
    }
}