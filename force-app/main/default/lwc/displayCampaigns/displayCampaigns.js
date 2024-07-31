/*
*Method Name: displayCampaigns
* @description: lwc to display component
* Date: 23/06/2024
* Created By: Rachit Shah
*/
import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import deleteCampaign from '@salesforce/apex/EmailCampaignController.deleteCampaign';
import getCampaigns from '@salesforce/apex/EmailCampaignController.getCampaigns';
import filterIcon from '@salesforce/resourceUrl/FilterIcon';

export default class DisplayCampaigns extends NavigationMixin(LightningElement) {
    @track campaigns = [];
    @track visibleCampaigns = [];
    @track filteredCampaigns = [];
    @track isLoading = false;
    @track isModalOpen = false;
    @track currentRecId = '';
    @track currentPage = 1;
    @track totalRecodslength = 0;
    @track totalPages = 0;
    @track isPreviousDisabled = true;
    @track isNextDisabled = false;
    @track isFilterModalOpen = false;
    @track filterIconUrl = filterIcon;
    @track statusFilter = '';
    @track statusFilterList = [];
    @track createdDateStart = '';
    @track createdDateEnd = '';

    @track statusOptions = [
        {label: 'None' , value: ''},
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
    ];

    /*
    * Method Name: connectedCallback
    * @description: Method to load all the data initially
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    connectedCallback() {
        this.loadCampaigns();
    }

    /*
    * Method Name: loadCampaigns
    * @description: Method to load data from apex and sort it based on date
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    loadCampaigns() {
        this.isLoading = true;
        getCampaigns()
            .then(result => {
                result.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));
                this.processTemplates(result);
                this.updatePagination();
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error:', error);
                this.isLoading = false;
            });
    }

    /*
    * Method Name: processTemplates
    * @description: Method to add custom column in the value
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    processTemplates(data) {
        this.campaigns = data.map((campaign, index) => {
            const total = campaign.Total_Emails__c;
            const remaining = campaign.Remaining_Emails__c;
            const completed = total - remaining;
            const progressPercentage = total > 0 ? `${(completed / total) * 100}` : '0';
    
            return {
                ...campaign,
                rowIndex: index + 1,
                StartDateformatted: this.formatDate(campaign.Campaign_Start_Date__c),
                CreatedDateformatted: this.formatDate(campaign.CreatedDate),
                statusClass: this.getStatusClass(campaign.Status__c),
                canDelete: campaign.Status__c !== 'Pending',
                canEdit : campaign.Status__c == 'Completed' ? true : false, 
                IsCampaignTemplate: campaign.Is_Marketing_Campaign_Template__c ? 'Yes' : 'No',
                progressPercentage: progressPercentage,
            };
        });

        this.filteredCampaigns = this.campaigns;
    }

    /*
    * Method Name: getStatusClass
    * @description: Method to give dynamic class to the status
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    getStatusClass(status) {
        switch (status) {
            case 'Pending':
                return 'pending-class';
            case 'In Progress':
                return 'in-progress-class';
            case 'Completed':
                return 'completed-class';
            default:
                return '';
        }
    }

    
    /*
    * Method Name: formatDate
    * @description: Method to customize date string
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    formatDate(dateStr) {
        var formatdate = new Date(dateStr);
        formatdate.setDate(formatdate.getDate());
        var formattedDate = new Date(formatdate.getFullYear(), formatdate.getMonth(), formatdate.getDate(), 0, 0, 0);
        const day = formattedDate.getDate();
        const month = formattedDate.getMonth() + 1; // Month is zero-based, so we add 1
        const year = formattedDate.getFullYear();
        const paddedDay = day < 10 ? `0${day}` : day;
        const paddedMonth = month < 10 ? `0${month}` : month;
        const formattedDateStr = `${paddedDay}/${paddedMonth}/${year}`;
        return formattedDateStr;
    }

    /*
    * Method Name: updatePagination
    * @description: Method to update current and total page
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    updatePagination() {
        this.totalRecodslength = this.filteredCampaigns.length;
        this.totalPages = Math.ceil(this.totalRecodslength / 10);

        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        };
        this.visibleCampaigns = this.filteredCampaigns.slice((this.currentPage - 1) * 10, this.currentPage * 10);

        this.visibleCampaigns = this.visibleCampaigns.map((campaign, index) => ({
            ...campaign,
            rowIndex: (this.currentPage - 1) * 10 + index + 1
        }));

        this.isPreviousDisabled = this.currentPage === 1;
        this.isNextDisabled = this.currentPage === this.totalPages;
    }


    /*
    * Method Name: handleSearch
    * @description: Method to search record based on the name
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        this.filteredCampaigns = this.campaigns.filter(campaign => 
            campaign.Label__c.toLowerCase().includes(searchKey)
        );
        this.currentPage = 1;
        this.updatePagination();
    }
    
    /*
    * Method Name: handleAdd
    * @description: Method to open popup to create camapaign
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleAdd() {
        this.isModalOpen = true;
    }

    /*
    * Method Name: handleEdit
    * @description: Method to pass data and redirect to component
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleEdit(event) {
        this.currentRecId = event.target.dataset.id;

        const navigationState = {
            campaign : this.currentRecId
        };

        const serializedState = JSON.stringify(navigationState);

        let cmpDef;                
        cmpDef = {
            componentDef: 'c:emailCampaignTemplateForm',
            attributes: {                    
                c__navigationState: serializedState,
                c__recordId : this.currentRecId
            }                
            };

        let encodedDef = btoa(JSON.stringify(cmpDef));
            this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url:  "/one/one.app#" + encodedDef                                                         
            }
        });

    }

    /*
    * Method Name: handleDelete
    * @description: Method to delete record and update page
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleDelete(event) {
        const campaignId = event.target.dataset.id;
        this.isLoading = true;
        deleteCampaign({ campaignId })
            .then(() => {

                this.campaigns = this.campaigns.filter(campaign => campaign.Id != campaignId);
                this.filteredCampaigns = this.filteredCampaigns.filter(campaign => campaign.Id !==campaignId);
                this.updatePagination();
                this.isLoading = false;
                this.showToast('Success', 'Campaign deleted successfully', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
                this.isLoading = false;
            });
    }

    /*
    * Method Name: handleModalClose
    * @description: Method to close modal
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleModalClose() {
        this.isModalOpen = false;
    }

    /*
    * Method Name: handleFilterClick
    * @description: Method to open filter modal
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleFilterClick() {
        this.isFilterModalOpen = true;
    }

    /*
    * Method Name: clearFilterModal
    * @description: Method to clear filter modal
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    clearFilterModal() {
        this.isFilterModalOpen = false;
        this.statusFilterList = [];
        this.statusFilter = '';
        this.createdDateStart = '';
        this.createdDateEnd = '';
        this.filteredCampaigns = this.campaigns;
        this.currentPage = 1;
        this.updatePagination();
    }

    /*
    * Method Name: closeFilterModal
    * @description: Method to close modal
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    closeFilterModal(){
        this.isFilterModalOpen = false;
    }

    /*
    * Method Name: handleFilterChange
    * @description: Method to  handle changes in filter
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleFilterChange(event) {

        try {
            const filterId = event.target.dataset.id;
            if (filterId === 'statusFilter') {
                this.statusFilter = event.target.value;
    
                if(!this.statusFilterList.includes(this.statusFilter) && this.statusFilter != ''){
                    this.statusFilterList.push(this.statusFilter);
                }
    
            } else if (filterId === 'createdDateStart') {
                this.createdDateStart = event.target.value;
            } else if (filterId === 'createdDateEnd') {
                this.createdDateEnd = event.target.value;
            }
        } catch (error) {
            console.log('error ==> ' , error);
        }

    }

    /*
    * Method Name: handleRemove
    * @description: Method to remove filter status
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    handleRemove(event){
        const valueRemoved = event.target.name;

        if(this.statusFilter == valueRemoved){
            this.statusFilter = '';
        }
        
        const index = this.statusFilterList.indexOf(valueRemoved);
        if (index > -1) {
            this.statusFilterList.splice(index, 1);
        }
    }
    
    /*
    * Method Name: applyFilter
    * @description: Method to apply filter
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    applyFilter() {
        
        if (this.createdDateStart && this.createdDateEnd) {
            const startDate = new Date(this.createdDateStart);
            const endDate = new Date(this.createdDateEnd);
    
            if (endDate < startDate) {
                this.showToast('Error', 'End Date should be the same or later than Start Date.', 'error');
                return;
            }
        }

        this.filteredCampaigns = this.campaigns.filter(campaign => {
            const createdDate = new Date(campaign.CreatedDate);
            const startDate = this.createdDateStart ? new Date(this.createdDateStart) : null;
            const endDate = this.createdDateEnd ? new Date(this.createdDateEnd) : null;

            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
            }
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
            }    

            const isStatusMatch = this.statusFilterList.length === 0 || this.statusFilterList.includes(campaign.Status__c);
            const isDateMatch = (!startDate || createdDate >= startDate) && (!endDate || createdDate <= endDate);
    
            return isStatusMatch && isDateMatch;
    
        });
        this.currentPage = 1;
        this.isFilterModalOpen = false;
        this.updatePagination();
    }
    
    /*
    * Method Name: previousPage
    * @description: Method to go previous page
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    /*
    * Method Name: previousPage
    * @description: Method to go next page
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    /*
    * Method Name: previousPage
    * @description: Method to show toast message
    * Date: 23/06/2024
    * Created By: Rachit Shah
    */
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}