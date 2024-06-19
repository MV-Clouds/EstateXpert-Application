public with sharing class BranchCreationAndUpdateJSON {

    public class BranchInfo {
        public String branch_reference;
        public String branch_name;
        public Location location;
        public String telephone;
        public String email;
        public String website;
    }

    public class Location {
        public String street_name;
        public String locality;
        public String town_or_city;
        public String county;
        public String postal_code;
        public String country_code;
        public Coordinates coordinates;
        public PAFAddress paf_address;
        public String paf_udprn;
    }

    public class Coordinates {
        public Decimal latitude;
        public Decimal longitude;
    }

    public class PAFAddress {
        public String address_key;
        public String organisation_key;
        public String postcode_type;
    }

    private static Boolean isNullOrEmpty(Object value) {
        if (value == null) return true;
        if (value instanceof String && ((String)value).trim() == '') return true;
        return false;
    }

    private static void removeNullValues(Map<String, Object> mapping) {
        List<String> keysToRemove = new List<String>();
        for (String key : mapping.keySet()) {
            Object value = mapping.get(key);
            if (isNullOrEmpty(value)) {
                keysToRemove.add(key);
            } else if (value instanceof Map<String, Object>) {
                removeNullValues((Map<String, Object>)value);
                if (((Map<String, Object>)value).isEmpty()) {
                    keysToRemove.add(key);
                }
            }
        }
        for (String key : keysToRemove) {
            mapping.remove(key);
        }
    }

    public static String buildJSON(
        String branchReference,
        String branchname,
        String streetname,
        String localitytext,
        String townorcity,
        String countytext,
        String postalcode,
        String countrycode,
        String latitudedec,
        String longitudedec,
        String addresskey,
        String organisationkey,
        String pafudprn,
        String postcodetype,
        String telephonetext,
        String email,
        String websitetext
    ) {
        Map<String, Object> branchInfo = new Map<String, Object>();
        branchInfo.put('branch_reference', branchReference);
        branchInfo.put('branch_name', branchname);

        Map<String, Object> location = new Map<String, Object>();
        location.put('street_name', streetname);
        location.put('locality', localitytext);
        location.put('town_or_city', townorcity);
        location.put('county', countytext);
        location.put('postal_code', postalcode);
        location.put('country_code', countrycode);

        Map<String, Object> coordinates = new Map<String, Object>();
        if (!isNullOrEmpty(latitudedec)) {
            coordinates.put('latitude', Decimal.valueOf(latitudedec));
        }
        if (!isNullOrEmpty(longitudedec)) {
            coordinates.put('longitude', Decimal.valueOf(longitudedec));
        }
        if (!coordinates.isEmpty()) {
            location.put('coordinates', coordinates);
        }

        Map<String, Object> paf_address = new Map<String, Object>();
        paf_address.put('address_key', addresskey);
        paf_address.put('organisation_key', organisationkey);
        paf_address.put('postcode_type', postcodetype);
        if (!paf_address.isEmpty()) {
            location.put('paf_address', paf_address);
        }

        location.put('paf_udprn', pafudprn);
        if (!location.isEmpty()) {
            branchInfo.put('location', location);
        }

        branchInfo.put('telephone', telephonetext);
        branchInfo.put('email', email);
        branchInfo.put('website', websitetext);

        removeNullValues(branchInfo);

        String requestBody = JSON.serialize(branchInfo);
        
        return requestBody;
    }
}