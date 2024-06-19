import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class EstateXpert_Control_Center extends NavigationMixin(LightningElement) {

    openSelectionModel1(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "c:portalMappingComponent",
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