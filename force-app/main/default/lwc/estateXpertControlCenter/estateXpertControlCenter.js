import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class EstateXpert_Control_Center extends NavigationMixin(LightningElement) {

    /**
    * Method Name: openSelectionModel1
    * @description: Used to open selection model 1.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    openSelectionModel1(event){
        event.preventDefault();
        let componentDef = {
            componentDef: "c:mapFields",
        };
        
        let encodedComponentDef = btoa(JSON.stringify(componentDef));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedComponentDef
            }
        });
    }

    /**
    * Method Name: openSelectionModel2
    * @description: Used to open selection model 2.
    * Date: 27/06/2024
    * Created By: Karan Singh
    **/
    openSelectionModel2(event){
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