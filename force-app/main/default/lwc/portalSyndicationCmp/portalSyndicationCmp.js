import { LightningElement, track, api } from "lwc";
import fetchPortals from "@salesforce/apex/PortalSyndicationController.fetchPortals";
import createPortalListingRecord from "@salesforce/apex/PortalSyndicationController.createPortalListingRecord";
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

const columns = [
  { label: "Portal Name", fieldName: "name", hideDefaultActions: true },
  {
    label: "Portal Status",
    type: "customName",
    typeAttributes: {
      status: { fieldName: "status" },
      class: { fieldName: "badgeColor" }
    },
    hideDefaultActions: true
  },
  {
    type: "button",
    typeAttributes: {
      label: { fieldName: "buttonLabel" },
      name: "publish",
      variant: { fieldName: "buttonColor" }
    }
  }
];

export default class PortalSyndicationCmp extends LightningElement {
  @track isInitalRender = true;
  @api recordId;
  @track portalId;
  @track data = [];
  @track showSpinner = true;
  @track columns = columns;
  @track status;
  @track responseBody;
  @track errorBody;
  @track portalName;
  @track isErrorPopup = false;
  @track subscription = {};
  @api channelName = '/event/ResponseEvent__e';

  /**
  * Method Name: connectedCallback
  * @description: Used to call fetchPortals method.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  connectedCallback() {
    try {
      this.fetchPortalDatas();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  /**
  * Method Name: disconnectedCallback
  * @description: Used to unsubscribe from the platform event channel.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  disconnectedCallback() {
    unsubscribe(this.subscription, response => {
      console.log('Unsubscribed from platform event channel', response);
    });
  }

  /**
  * Method Name: fetchPortalDatas
  * @description: Used to fetch the portal datas.
  * Date: 12/07/2024
  * Created By: Karan Singh
  **/
  fetchPortalDatas(){
    fetchPortals({ listingId: this.recordId })
      .then(data => {
        this.data = data;
        this.showSpinner = this.data.length > 0 ? false : true;
        let isPortal = this.checkPortals();
        if (isPortal) {
          this.registerErrorListener();
          this.handleSubscribe();
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        this.showSpinner = false;
      });
  }

  /**
  * Method Name: handleSubscribe
  * @description: Used to subscribe to the platform event channel.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  handleSubscribe() {
    const self = this;
    const messageCallback = function (response) {
      let obj = JSON.parse(JSON.stringify(response));
      console.log('obj', obj);
      let objData = obj.data.payload;
      self.status = objData.MVEX__Status__c;
      self.responseBody = objData.MVEX__JSONBody__c;
      self.portalName = objData.MVEX__PortalName__c;
      console.log('response', self.responseBody);
      console.log('self.status', self.status);
      if (self.status === 'Failed') {
        console.log('status', self.status);
        let errorDetails = [];
        let responseBodyParsed = JSON.parse(self.responseBody);
        if (self.portalName === 'Zoopla' && responseBodyParsed.errors) {
          errorDetails.push(...responseBodyParsed.errors.map(error => ({
            message: error.message,
            path: error.path
          })));
          errorDetails = JSON.stringify(errorDetails);
        } else if (self.portalName === 'Rightmove') {
          if (responseBodyParsed.errors) {
            errorDetails.push(...responseBodyParsed.errors.map(error => ({
              message: error.error_description,
              path: error.error_value != null ? error.error_value : ''
            })));
          }
          if (responseBodyParsed.warnings) {
            errorDetails.push(...responseBodyParsed.warnings.map(warning => ({
              message: warning.warning_description,
              path: warning.warning_value != null ? warning.warning_value : ''
            })));
          }
          errorDetails = JSON.stringify(errorDetails);
        }

        console.log('Extracted error details (JSON):', errorDetails);

        self.errorBody = errorDetails;
        self.isErrorPopup = true;
        self.refreshComponent();
      } else {
        self.showSpinner = false;
      }
    };

    subscribe(this.channelName, -1, messageCallback).then(response => {
      console.log('Subscription request sent to: ', JSON.stringify(response.channel));
      this.subscription = response;
    });
  }

  /**
  * Method Name: refreshComponent
  * @description: Used to refresh the component.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  refreshComponent() {
    this.showSpinner = true;
    fetchPortals({ listingId: this.recordId })
      .then(data => {
        this.data = data;
        this.showSpinner = false;
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        this.showSpinner = false;
      });
  }

  /**
  * Method Name: registerErrorListener
  * @description: Used to register the error listener.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  registerErrorListener() {
    onError(error => {
      console.log('Received error from server: ', JSON.stringify(error));
    });
  }

  /**
  * Method Name: checkPortals
  * @description: Used to check if the portals are present.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  checkPortals() {
    return this.data.some(record => record.pname === 'Rightmove' || record.pname === 'Zoopla');
  }

  /**
  * Method Name: handleRowAction
  * @description: Used to handle the row action.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  handleRowAction(event) {
    try {
      let portalName = event.detail.row.pname;
      let rowId = event.detail.row.id;
      let actionType = event.detail.row.buttonLabel;
      if (event.detail.action.name === "publish") {
        this.handleButtonClick(this.data, rowId, actionType, portalName);
      }
    } catch (error) {
      console.error('Error handling row action:', error);
    }
  }

  /**
  * Method Name: handleButtonClick
  * @description: Used to handle the button click.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  async handleButtonClick(data, rowId, actionType, portalName) {
    this.showSpinner = true;
    data.forEach((element) => {
      if (rowId === element.id) {
        if (element.flag === true) {
          console.log('if block');
          element.flag = false;
          element.buttonColor = "brand";
          element.buttonLabel = "Publish";
          element.status = "inactive";
          element.badgeColor = "slds-badge";
        } else {
          console.log('else block');
          element.flag = true;
          element.buttonColor = "destructive";
          element.buttonLabel = "Unpublish";
          element.status = "active";
          element.badgeColor = "slds-badge slds-theme_success";
        }
      }
    });

    console.log("rowId", rowId);
    let response = await createPortalListingRecord({ portalId: rowId, listingId: this.recordId, actionType: actionType, portalName: portalName });
    console.log("response", response);
    let newList = [...data];
    console.log('newList', newList);
    this.data = newList;
    this.showSpinner = this.isSpinnerVisible(portalName, actionType);
  }

  /**
  * Method Name: isSpinnerVisible
  * @description: Used to check if the spinner is visible.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  isSpinnerVisible(portalName, actionType) {
    if (portalName === 'Zoopla' && actionType === 'Publish') {
      return true;
    } else if (portalName === 'Rightmove' && actionType === 'Publish') {
      return true;
    } 

    return false;
  }

  /**
  * Method Name: handleHidePopup
  * @description: Used to hide the popup.
  * Date: 09/07/2024
  * Created By: Karan Singh
  **/
  handleHidePopup(event) {
    this.isErrorPopup = event.details;
  }

}