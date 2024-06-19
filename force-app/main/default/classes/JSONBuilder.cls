public with sharing class JSONBuilder {
    public static String createInputData(Map<String, Object> finalMapping, List<Property_File__c> mediaList) {
        Map<String, Object> inputData = new Map<String, Object>();
        
        for (String key : finalMapping.keySet()) {
            Object value = conditionallyDisplayOrChangeValue(key, finalMapping.get(key));
            processValue(inputData, key, value);
        }

        List<Map<String, Object>> content = new List<Map<String, Object>>();
        for (Property_File__c mediaItem : mediaList) {
            Map<String, Object> mediaMap = new Map<String, Object>();
            String mediaURL = String.isNotBlank(mediaItem.ExternalLink__c) ? mediaItem.ExternalLink__c : mediaItem.BaseUrl__c;
            mediaMap.put('url', mediaURL);
            mediaMap.put('type', urlType(mediaItem.Tags__c));
            content.add(mediaMap);
        }
        inputData.put('content', content);

        String jsonBODY = createJSON(inputData);

        return jsonBODY;
    }

    private static void processValue(Map<String, Object> parentMap, String key, Object value) {
        if (key.contains('.')) {
            String[] fieldNames = key.split('\\.');
            if ((fieldNames.size() == 2 || fieldNames.size() == 3) && isArrayField(fieldNames[0])) {
                String arrayField = fieldNames[0];
                if (!parentMap.containsKey(arrayField)) {
                    parentMap.put(arrayField, new List<Object>());
                }
                Map<String, Object> nestedMap = new Map<String, Object>();
                populateNestedMap(nestedMap, fieldNames, value);
                ((List<Object>) parentMap.get(arrayField)).add(nestedMap);
            } else {
                Map<String, Object> currentMap = parentMap;
                for (Integer i = 0; i < fieldNames.size(); i++) {
                    String field = fieldNames[i];
                    if (i == fieldNames.size() - 1) {
                        if (shouldSetField(fieldNames, currentMap, value)) {
                            currentMap.put(field, value);
                        }
                    } else {
                        if (!currentMap.containsKey(field) || !(currentMap.get(field) instanceof Map<String, Object>)) {
                            currentMap.put(field, new Map<String, Object>());
                        }
                        currentMap = (Map<String, Object>) currentMap.get(field);
                    }
                }
            }
        } else {
            if (shouldSetField(new String[] { key }, parentMap, value)) {
                parentMap.put(key, value);
            }
        }
    }

    private static void populateNestedMap(Map<String, Object> nestedMap, String[] fieldNames, Object value) {
        Map<String, Object> currentMap = nestedMap;
        for (Integer i = 1; i < fieldNames.size(); i++) {
            String field = fieldNames[i];
            if (i == fieldNames.size() - 1) {
                currentMap.put(field, value);
            } else {
                if (!currentMap.containsKey(field) || !(currentMap.get(field) instanceof Map<String, Object>)) {
                    currentMap.put(field, new Map<String, Object>());
                }
                currentMap = (Map<String, Object>) currentMap.get(field);
            }
        }
    }

    public static String urlType(String type) {
        switch on type {
            when '360tour' {
                return 'virtual_tour';
            }
            when 'Floorplan' {
                return 'floor_plan';
            }
            when 'Virtual Tour' {
                return 'virtual_tour';
            }
            when else {
                return 'image';
            }
        }
    }

    public static Object conditionallyDisplayOrChangeValue(String fieldName, Object value) {
        if ('pricing.transaction_type'.equals(fieldName)) {
            if ('Sale'.equals(value)) {
                return 'sale';
            } else if ('Rent'.equals(value)) {
                return 'rent';
            }
        } else if ('pricing.rent_frequency'.equals(fieldName)) {
            if ('Monthly'.equals(value)) {
                return 'per_month';
            } else if ('Weekly'.equals(value)) {
                return 'per_week';
            } else if ('Quarterly'.equals(value)) {
                return 'per_quarter';
            } else if ('Yearly'.equals(value)) {
                return 'per_year';
            }
        } else if ('property_type'.equals(fieldName)) {
            if ('Villa'.equals(value)) {
                return 'villa';
            }
        } else if ('life_cycle_status'.equals(fieldName)) {
            if ('Available'.equals(value)) {
                return 'available';
            } else if ('Under Offer'.equals(value)) {
                return 'under_offer';
            } else if ('Under Contract'.equals(value)) {
                return 'sold_subject_to_contract';
            } else if ('Sale Agreed'.equals(value)) {
                return 'let_agreed';
            } else if ('Reserved'.equals(value)) {
                return 'let';
            } else if ('Active'.equals(value)) {
                return 'available';
            }
        } else if ('category'.equals(fieldName)) {
            if ('Residential'.equals(value)) {
                return 'residential';
            } else if ('Commercial'.equals(value)) {
                return 'commercial';
            }
        }
        
        return value;
    }

    private static Boolean shouldSetField(String[] fieldNames, Map<String, Object> currentMap, Object value) {
        String topLevelField = fieldNames[0];
        if ('pricing'.equals(topLevelField)) {
            if ('transaction_type'.equals(fieldNames[1]) && 'rent'.equals(value)) {
                return true;
            } else if ('rent_frequency'.equals(fieldNames[1])) {
                return false;
            }
        }
        return true;
    }

    public static Boolean isArrayField(String fieldName) {
        switch on fieldName {
            when 'accessibility' {
                return true;
            }
            when 'bills_included' {
                return true;
            }
            when 'broadband_supply' {
                return true;
            }
            when 'building_safety_issues' {
                return true;
            }
            when 'buyer_incentives' {
                return true;
            }
            when 'commercial_use_classes' {
                return true;
            }
            when 'connected_utilities' {
                return true;
            }
            when 'construction_materials' {
                return true;
            }
            when 'detailed_description' {
                return true;
            }
            when 'electricity_supply' {
                return true;
            }
            when 'feature_list' {
                return true;
            }
            when 'floor_levels' {
                return true;
            }
            when 'heating_source' {
                return true;
            }
            when 'outside_space' {
                return true;
            }
            when 'parking' {
                return true;
            }
            when 'sewerage_supply' {
                return true;
            }
            when 'water_supply' {
                return true;
            }
            when 'sources_of_flooding' {
                return true;
            }
            when else {
                return false;
            }
        }
    }

    public static String createJSON(Map<String, Object> inputData) {
        JSONGenerator gen = JSON.createGenerator(false);
        gen.writeStartObject();
        
        for (String key : inputData.keySet()) {
            writeField(gen, key, inputData.get(key));
        }
        
        gen.writeEndObject();
        return gen.getAsString();
    }
    
    private static void writeField(JSONGenerator gen, String key, Object value) {
        if (value == null) {
            // Skip null values
            return;
        } else if (value instanceof Map<String, Object>) {
            gen.writeFieldName(key);
            gen.writeStartObject();
            Map<String, Object> mapValue = (Map<String, Object>) value;
            for (String subKey : mapValue.keySet()) {
                writeField(gen, subKey, mapValue.get(subKey));
            }
            gen.writeEndObject();
        } else if (value instanceof List<Object>) {
            gen.writeFieldName(key);
            gen.writeStartArray();
            for (Object item : (List<Object>) value) {
                if (item instanceof Map<String, Object>) {
                    gen.writeStartObject();
                    Map<String, Object> mapItem = (Map<String, Object>) item;
                    for (String subKey : mapItem.keySet()) {
                        writeField(gen, subKey, mapItem.get(subKey));
                    }
                    gen.writeEndObject();
                } else {
                    if (item != null) {
                        gen.writeObject(item);
                    }
                }
            }
            gen.writeEndArray();
        } else {
            gen.writeFieldName(key);
            gen.writeObject(value);
        }
    }
    
}