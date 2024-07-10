/**
* Class Name : MockHttpResponseGenerator
* Created By : Karan Singh
* Last Modified Date : 25/06/2024
* Last Modified By : Karan Singh
* @description : Used to generate mock http response.
*/
@isTest
public class MockHttpResponseGenerator implements HttpCalloutMock {
    private Map<String, HttpResponse> endpointResponses;
    protected Integer code;

    /**
    * Method Name : MockHttpResponseGenerator
    * @param endpointResponses - Map<String, HttpResponse>
    * @return String
    * @description : Used to generate mock http response.
    */
    public MockHttpResponseGenerator(Map<String, HttpResponse> endpointResponses) {
        this.endpointResponses = endpointResponses;
    }

    /**
    * Method Name : respond
    * @param req - HTTPRequest
    * @return String
    * @description : Used to generate mock http response.
    */
    public HTTPResponse respond(HTTPRequest req) {
        String endpoint = req.getEndpoint();
        System.debug('Mock endpoint: ' + endpoint);

        // Default response setup
        HttpResponse resp = new HttpResponse();
        resp.setHeader('Content-Type', 'application/json');
        
        // Check if the endpoint is mocked
        if (endpointResponses.containsKey(endpoint)) {
            HttpResponse mockResponse = endpointResponses.get(endpoint);
            
            // Set status code and body from mock response
            resp.setStatusCode(mockResponse.getStatusCode());
            resp.setBody(mockResponse.getBody());
        } else {
            // Endpoint not mocked scenario
            resp.setStatusCode(404);
            resp.setBody('{"error": "Endpoint not mocked"}');
        }
        
        return resp;
    }
}