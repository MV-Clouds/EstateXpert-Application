import { LightningElement, track, api} from 'lwc';

export default class ChecklistTable extends LightningElement {

    @track myVariable;

  
    @track checklistItems = [
        { id: 1, checklistName: 'Name', fieldName: 'City', operator: 'Equals', value: 'Vadodara' },
        { id: 2, checklistName: 'Name 1', fieldName: 'City 1', operator: 'Not Equals', value: 'Rajkot' },
        { id: 3, checklistName: 'Name 2', fieldName: 'City 2', operator: 'Equals', value: 'Surat' },
        { id: 4, checklistName: 'Name 3', fieldName: 'City 3', operator: 'Not Equals', value: 'Ahmadabad' },
        { id: 5, checklistName: 'Name 4', fieldName: 'City 4', operator: 'Equals', value: 'Dang' }
    ];

    operatorOptions = [
        { label: 'Equals', value: 'Equals' },
        { label: 'Not Equals', value: 'Not Equals' },
    ];

    handleInputChange(event) {
        try {
            const id = event.target.dataset.id;
            const field = event.target.dataset.field;
            const value = event.target.value;
    
            this.checklistItems = this.checklistItems.map(item =>
                item.id === parseInt(id) ? { ...item, [field]: value } : item
            );

            console.log('test');
            this.testmethod()
            
        } catch (error) {

                console.log('There is an error', {error})
                console.log('There is an error', JSON.stringify(error))
                let errorMessage = error.body?.output?.errors[0]?.message
                errorMessage = errorMessage || error.body?.pageErrors[0]?.message
                errorMessage = errorMessage || 'There is an error with this application, please check with your system administrator'
                this.showToast('Error', errorMessage, 'error')

        }
    }

    handleOrderChange(event) {
        const id = parseInt(event.target.dataset.id);
        const action = event.target.dataset.action;
        const index = this.checklistItems.findIndex(item => item.id === id);
        if (index >= 0) {
            if (action === 'up' && index > 0) {
                // [this.checklistItems[index], this.checklistItems[index - 1]] = [this.checklistItems[index - 1], this.checklistItems[index]];
                this.swapItems(index, index - 1);
            } else if (action === 'down' && index < this.checklistItems.length - 1) {
                //[this.checklistItems[index], this.checklistItems[index + 1]] = [this.checklistItems[index + 1], this.checklistItems[index]];
                this.swapItems(index, index + 1);
            }
        }
    }

    swapItems(fromIndex, toIndex) {
        const updatedItems = [...this.checklistItems];
        const [movedItem] = updatedItems.splice(fromIndex, 1);
        updatedItems.splice(toIndex, 0, movedItem);
        this.checklistItems = updatedItems;
    }

    handleDelete(event) {
        const id = parseInt(event.target.dataset.id);
        this.checklistItems = this.checklistItems.filter(item => item.id !== id);
    }
}