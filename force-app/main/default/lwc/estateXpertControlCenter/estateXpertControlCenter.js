import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EstateXpert_Control_Center extends NavigationMixin(LightningElement) {

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

    openSelectionModel4(){
        this.showtoastMessage();
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

    openSelectionModel6(){
        this.showtoastMessage();
    }

    openSelectionModel7(){
        this.showtoastMessage();
    }

    openSelectionModel8(){
        this.showtoastMessage();
    }

    openSelectionModel9(){
        this.showtoastMessage();
    }

    openSelectionModel10(){
        this.showtoastMessage();
    }

    openSelectionModel11(){
        this.showtoastMessage();
    }

    openSelectionModel12(event){
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

    openSelectionModel13(){
        this.showtoastMessage();
    }

    openSelectionModel14(event){
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

}