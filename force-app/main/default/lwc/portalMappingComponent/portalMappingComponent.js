import { LightningElement, track } from 'lwc';
import iconimg from '@salesforce/resourceUrl/iconimg';
import { NavigationMixin } from 'lightning/navigation';
import getPortalRecords from '@salesforce/apex/PortalMappingController.getPortalRecords';
export default class PortalMapping extends NavigationMixin(LightningElement) {

    @track iconImg = iconimg;
    @track isInitalRender = true;
    @track clickedPortalName = '';
    @track clickedPortalIconURL = '';
    @track portalRecordList = [];
    @track isPortalData = true;
    @track showModal = false;
    @track portals = [
        { id: 1, name: 'Property Finder', logo: '/resource/propertyfinder' },
        { id: 2, name: 'Bayut', logo: '/resource/bayut' },
        { id: 3, name: 'Dubizzle', logo: '/resource/dubizzle' }
    ];

    /**
    * Method Name: connectedCallback
    * @description: Used to call getPortalRecord method.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    connectedCallback() {
        this.getPortalRecord();
    }

    /**
    * Method Name: renderedCallback
    * @description: Used to overwrite standard css.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    renderedCallback() {
        if (this.isInitalRender) {
            const body = document.querySelector("body");

            const style = document.createElement('style');
            style.innerText = `
                .tooltip_css lightning-helptext .slds-form-element__icon {
                    display: inline-block;
                    position: relative;
                    padding-top: unset;
                    vertical-align: top;
                    line-height: var(--lwc-lineHeightReset, 1);
                    z-index: 1;
                    top: -10px;
                }
            `;

            body.appendChild(style);
            this.isInitalRender = false;
        }

        this.template.querySelectorAll('.portal-box').forEach(box => {
            box.addEventListener('mouseover', this.handleMouseOver);
            box.addEventListener('mouseout', this.handleMouseOut);
        });

    }

    /**
    * Method Name: handleMouseOver
    * @description: Used to add a class on mouse over.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleMouseOver(event) {
        const portalBox = event.currentTarget;
        portalBox.classList.add('blackout');
    }

    /**
    * Method Name: handleMouseOut
    * @description: Used to remove a class on mouse out.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleMouseOut(event) {
        const portalBox = event.currentTarget;
        portalBox.classList.remove('blackout');
    }

    /**
    * Method Name: getPortalRecord
    * @description: Used to make an Apex callout to retrieve all records of the Portal__c object.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    getPortalRecord() {
        getPortalRecords()
            .then(result => {
                console.log('data--->', result);
                if (result.length > 0) {
                    this.portalRecordList = result.map((val, index) => ({
                        number: index + 1,
                        val: val
                    }));;
                } else {
                    this.isPortalData = false;
                }
            })
            .catch(error => {
                console.error('Error fetching Listing field data', error);
            });
    }

    /**
    * Method Name: handleHidePopup
    * @description: Used to close the new popup modal.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleHidePopup(event) {
        this.showModal = event.details;
    }

    /**
    * Method Name: handleHideAndRefreshPage
    * @description: Used to close the new popup modal and refresh the page.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleHideAndRefreshPage(event) {
        this.showModal = event.details;
        this.getPortalRecord()
    }

    /**
    * Method Name: handleClick
    * @description: Used to open portalMappingLandingPage LWC component.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleClick(event) {
        try {
            event.preventDefault();
            var portalId = event.currentTarget.dataset.portalid;
            var portalName = event.currentTarget.dataset.portalname;
            var portalIconURL = event.currentTarget.dataset.portaliconurl;
            var portalStatus = event.currentTarget.dataset.portalstatus;
            var portalGen = event.currentTarget.dataset.portalgen;
            var valuetopass;
            if (portalGen == 'Propertyfinder') {
                valuetopass = 'Property_Finder__mdt';
            } else if (portalGen == 'Bayut') {
                valuetopass = 'Bayut__mdt';
            } else if (portalGen == 'Dubizzle') {
                valuetopass = 'Dubizzle__mdt';
            }
            console.log(portalName, portalIconURL, portalStatus);
            let componentDef = {
                componentDef: "c:portalMappingLandingPage",
                attributes: {
                    portalId: portalId,
                    portalGen: valuetopass,
                    portalName: portalName,
                    portalIconUrl: portalIconURL,
                    portalStatus: portalStatus
                }
            };
            let encodedComponentDef = btoa(JSON.stringify(componentDef));
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/one/one.app#' + encodedComponentDef
                }
            });
        } catch (error) {
            console.log('error-->',error);
        }
    }

    /**
    * Method Name: handleNew
    * @description: Used to pass Portal name and Portal icon image URL to newPopUp lwc component.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    handleNew(event) {
        this.clickedPortalName = event.currentTarget.dataset.portalname;
        this.clickedPortalIconURL = event.currentTarget.dataset.portaliconurl;
        this.showModal = true;
    }

    /**
    * Method Name: backToControlCenter
    * @description: Used to Navigate to the main ControlCenter page.
    * Date: 04/06/2024
    * Created By: Karan Singh
    **/
    backToControlCenter(event) {
        event.preventDefault();
        let componentDef = {
            componentDef: "c:estateXpert_Control_Center",
        };

        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

}