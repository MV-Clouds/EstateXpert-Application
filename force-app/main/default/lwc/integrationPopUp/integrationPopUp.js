import { LightningElement, track ,api} from 'lwc';
import saveSettings from '@salesforce/apex/IntegrationPopupController.saveSettings';
import getSettings from '@salesforce/apex/IntegrationPopupController.getSettings';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class IntegrationPopUp extends LightningElement {
    @api integrationname = '';
    @track isModalOpen = true;
    @track saveDisable = false;
    @track fieldsData = {};
    @track isLoading = true;

    get isAWS() {
        return this.integrationname === 'AWS';
    }

    get isGmail() {
        return this.integrationname === 'Gmail';
    }

    get isOutlook() {
        return this.integrationname === 'Outlook';
    }

    get isWhatsApp() {
        return this.integrationname === 'WhatsApp';
    }

    get isSocialMedia() {
        return this.integrationname === 'Social Media';
    }

    /**
    * Method Name : connectedCallback
    * @description : call the intializeValues method
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    connectedCallback(){
        this.intializeValues();
    }

    /**
    * Method Name : intializeValues
    * @description : get the record data from the custom settings
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    intializeValues() {
        getSettings({ integrationType: this.integrationname })
            .then(data => {
                this.isLoading = true;
                if (data) {
                    this.fieldsData = { ...data }; // Store retrieved data in fieldsData object
                } else {
                    this.fieldsData = {}; // Initialize fieldsData as empty if no data found
                }
                this.isLoading = false;
            })
            .catch(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading settings',
                        message: 'Error retrieving values',
                        variant: 'error',
                    })
                );
                this.isLoading = false;
            });
    }

    /**
    * Method Name : openModal
    * @description : show the pop-up modal
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    openModal() {
        this.isModalOpen = true;
    }

    /**
    * Method Name : closeModal
    * @description : close the pop-up modal
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    closeModal() {
        const customEvent = new CustomEvent('closemodal', {
            detail: false
        });
        
        // Dispatch the custom event
        this.dispatchEvent(customEvent);
    }

    /**
    * Method Name : handleInputChange
    * @description : validate the change object as per input values
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    handleInputChange(event) {
        const field = event.target.dataset.id;
        const value = event.target.value;

        this.saveDisable = false;

        // Update the fieldsData object dynamically
        this.fieldsData[field] = value;

        // Validate the input
        if (/\s/.test(value)) {
            event.target.setCustomValidity('Spaces are not allowed.');
        } else {
            event.target.setCustomValidity('');
        }

        event.target.reportValidity();
        this.checkValidity();
    }

    /**
    * Method Name : checkValidity
    * @description : check the validation for the all input fields.
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    checkValidity() {
        const inputs = this.template.querySelectorAll('lightning-input');
        let allValid = true;

        inputs.forEach(input => {
            // Trigger validation on each input
            input.reportValidity();

            // If any input is invalid, set allValid to false
            if (!input.checkValidity()) {
                allValid = false;
            }
    });

    // Disable the save button if any input is invalid
    this.saveDisable = !allValid;
    return allValid;
    }

    /**
    * Method Name : saveDetails
    * @description : save the input data in custom settigns
    * * Date: 6/08/2024
    * Created By:Vyom Soni
    */
    saveDetails() {
        if (this.checkValidity()) {
            // Serialize the fieldsData object to JSON
            const jsonData = JSON.stringify(this.fieldsData);

            saveSettings({ jsonData: jsonData, integrationType: this.integrationname })
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Credentials saved successfully',
                            variant: 'success',
                        })
                    );
                    this.closeModal();
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error saving settings',
                            message: error.body.message,
                            variant: 'error',
                        })
                    );
                });
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill out all required fields.',
                    variant: 'error',
                })
            );
        }
    }
}