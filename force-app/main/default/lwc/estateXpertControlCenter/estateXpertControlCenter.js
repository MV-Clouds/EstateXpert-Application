import { LightningElement,track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EstateXpert_Control_Center extends NavigationMixin(LightningElement) {

    @track showIntegrationModal=false;
    @track integrationName = '';
    @track integrationLabel = '';
    @track isWaterMarkUploader = false;

    openSelectionModel1(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:mapFields",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    openSelectionModel2(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:portalMappingComponent",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    openSelectionModel3(){
        this.showtoastMessage();
    }

    openSelectionModel4(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:supportRequestCmp",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    openSelectionModel5(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:listingManager",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    openSelectionModel6(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:listingTemplate",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    openSelectionModel7(){
        this.isWaterMarkUploader = true;
    }

    closeWaterMarkModal(){
        this.isWaterMarkUploader = false;
    }

    openSelectionModel8(){
        this.integrationLabel = 'Gmail';
        this.integrationName = 'Gmail';
        // this.showtoastMessage();
        this.showIntegrationModal = true;
    }

    openSelectionModel9(){
        this.integrationLabel = 'Outlook';
        this.integrationName = 'Outlook';
        // this.showtoastMessage();
        this.showIntegrationModal = true;
    }

    openSelectionModel10(){
         this.integrationLabel = 'WhatsApp';
        this.integrationName = 'WhatsApp';
        // this.showtoastMessage();
        this.showIntegrationModal = true;
    }

    openSelectionModel11(){
        this.integrationLabel = 'AWS';
        this.integrationName = 'AWS';
        this.showIntegrationModal = true;
    }

    openSelectionModel12(){
         this.integrationLabel = 'Social Media';
        this.integrationName = 'Social Media';
        this.showIntegrationModal = true;
    }

    openSelectionModel13(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:templateBuilder",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    openSelectionModel14(){
        this.showtoastMessage();
    }

    openSelectionModel15(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "MVEX:marketingListCmp",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    showtoastMessage() {
        if (!import.meta.env.SSR) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Work is not completed. Please wait for the support team to complete the work.',
                variant: 'error'
            }));
        }
    }

    handleModalSelect(event){
        this.showIntegrationModal = false;
    }

}