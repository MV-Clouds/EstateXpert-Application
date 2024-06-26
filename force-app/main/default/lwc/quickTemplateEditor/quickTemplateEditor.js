import { LightningElement, track, wire, api } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import summerNote_Editor from '@salesforce/resourceUrl/summerNote_Editor';
import getFieldsForObject from '@salesforce/apex/QuickTemplateBuilderController.getAllFieldNames';
import saveTemplate from '@salesforce/apex/QuickTemplateBuilderController.saveTemplate';
import getTemplateContent from '@salesforce/apex/QuickTemplateBuilderController.getTemplateContentById';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';


export default class QuickTemplateEditor extends NavigationMixin(LightningElement) {
    @api selectedObject;
    @api currentRecordId = null;
    @api templateLabel = '';
    @api isFirstTimeLoaded = false;
    @track selectedField = '';
    @track fieldOptions = [];
    @track description = '';
    @track isLoading = true;
    @track isInitialRender = true;
    @track isDisplayedData = true;
    @track isModalOpen = false;
    @track selectedType = '';
    @track bodyOfTemplate = '';
    @track editValue = true;
    @track isObjectChanged = false;
    @track oldObject = '';
    @track cancelBtn = false;
    @track templateTypeForCreation = 'New';
    @track editor;
    @track currentPage;
    @track totalRecodslength;
    @track newPageNumber;

    get recordId(){
        return this.currentRecordId ? this.currentRecordId : 'tempId';
    }
    
    /**
    * Method Name: getStateParameters
    * @description: Method to get values from attribute from the currentpagereference
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        console.log('OUTPUT : ',currentPageReference);                               
        let decodedJson = currentPageReference;
        console.log('OUTPUT 11: ',decodedJson);
        if (decodedJson ) {
            console.log('OUTPUT 2 : ',decodedJson);
            console.log('OUTPUT 3 : ',decodedJson.attributes);
            console.log('OUTPUT 4 : ',decodedJson.attributes.attributes);

            if(decodedJson.attributes.attributes.c__navigationState && decodedJson.attributes.attributes.c__templateType != 'New'){
                const navigationStateString = decodedJson.attributes.attributes.c__navigationState;
                console.log('navigationStateString ==>' , navigationStateString);
                if (navigationStateString) {
                    try {
                        const parseObject = JSON.parse(navigationStateString);
                        console.log('navigationState2 ==>', parseObject);
    
                        this.selectedObject = parseObject.selectedObject;
                        this.currentRecordId = parseObject.myrecordId;
                        this.templateLabel = parseObject.label;
                        this.description = parseObject.description;
                        this.selectedType = parseObject.type;
                        this.bodyOfTemplate = parseObject.bodyoftemplate;
                        this.isObjectChanged = parseObject.isObjectChanged;
                        this.oldObject = parseObject.oldObject;
                        this.isFirstTimeLoaded = parseObject.isFirstTimeLoaded;
                        this.templateTypeForCreation = parseObject.templateTypeForCreation;
                        this.currentPage = parseObject.pageNumber;
                        this.totalRecodslength = parseObject.totalRecodslength;
    
                        this.fetchFields();
                    } catch (error) {
                        console.error('Error parsing navigation state:', error);
                    }
                } else {
                    console.error('navigationState not found in currentPageReference.state');
                }
            }
            else{
                this.selectedObject = 'Contact';
                this.fetchFields();
            }
        } else {
            console.error('currentPageReference or currentPageReference.state is not defined');
        }
    }

    /**
    * Method Name: renderedCallback
    * @description: Method to load external libraries and jquery
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    renderedCallback() {
        if (this.isInitialRender) {
            Promise.all([
                loadScript(this, summerNote_Editor + '/jquery-3.7.1.min.js'),
            ])
                .then(() => {
                    return Promise.all([
                        loadStyle(this, summerNote_Editor + '/summernote-lite.css'),
                        loadScript(this, summerNote_Editor + '/summernote-lite.js'),
                    ]);
                })
                .then(() => {
                    this.isInitialRender = false;
                    setTimeout(() => {
                        this.initializeSummerNote(this, 'editor');
                    }, 100);
                    this.isLoading = false;
                })
                .catch(error => {
                    console.log('Error loading libraries', error);
                    this.isLoading = false;
                });
        }
    }


    /**
    * Method Name: fetchFields
    * @description: Method to fetch the fields for the selected object
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    fetchFields() {
        if (!this.selectedObject) {
            console.error('No selected object found.');
            return;
        }

        getFieldsForObject({ objectName: this.selectedObject })
            .then(data => {
                this.fieldOptions = data.map(field => ({ label: field, value: field }));

                if(this.isObjectChanged){
                    const errorPopup = this.template.querySelector('c-error_-pop-up');
                    console.log('errorPopup ==> ' , errorPopup);
                    if(errorPopup){
                        errorPopup.showToast('warning', 'Object change will remove all merge fields', 'Warning');
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching fields:', error);
            });
    }

    /**
    * Method Name: initializeSummerNote
    * @description: Method to initialize library
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    async initializeSummerNote(self, editorSelector) {
        try {
            console.log('self : ', self.activeTabName);


            const selector = this.currentRecordId ? this.currentRecordId : 'tempId';
            this.editor = this.template.querySelector(`[data-id="${selector}"]`);

            // Initialize SummerNote Editor...
            $(this.editor).summernote({
                editing: true,
                styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                fontSizes: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '52', '56', '60', '64', '68', '72', '76', '80', '86', '92', '98'],
                fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
                addDefaultFonts: true,
                tableClassName: 'table table-bordered',
                insertTableMaxSize: {
                    col: 10,
                    row: 10,
                },
                toolbar: [
                    // Customized Toolbar 
                    ['custom_paragraphFormatting', ['ul', 'ol', 'paragraph', 'height']],
                    ['custom_style', ['style']],
                    ['custom_fontFormattings', ['fontname', 'fontsize', 'forecolor', 'backcolor', 'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript']],
                    ['custom_insert', ['table', 'link', 'picture', 'hr']],
                    ['custom_clearFormatting', ['clear']],
                ],
                popover: {
                    image: [
                        ['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
                        ['float', ['floatLeft', 'floatRight', 'floatNone']],
                        ['remove', ['removeMedia']]
                    ],
                    link: [
                        ['link', ['linkDialogShow', 'unlink']]
                    ],
                    table: [
                        ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
                        ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
                        ['merge', ['jMerge']],
                        ['style', ['jBackcolor', 'jBorderColor', 'jAlign']],
                        ['info', ['jTableInfo']],
                    ],
                },
                tabsize: 2,
                disableResizeEditor: true,
                blockquoteBreakingLevel: 2,
                dialogsInBody: true,
                dialogsFade: false,
                disableDragAndDrop: true,
                shortcuts: true,
                tabDisable: false,
                codeviewFilter: false,
                codeviewIframeFilter: true,
                toolbarPosition: 'top',
                spellCheck: true,
                disableGrammar: false,
                maximumImageFileSize: null,
                acceptImageFileTypes: "image/*",
                allowClipboardImagePasting: true,
                icons: {
                    'align': 'note-icon-align',
                    'alignCenter': 'note-icon-align-center',
                    'alignJustify': 'note-icon-align-justify',
                    'alignLeft': 'note-icon-align-left',
                    'alignRight': 'note-icon-align-right',
                    'rowBelow': 'note-icon-row-below',
                    'colBefore': 'note-icon-col-before',
                    'colAfter': 'note-icon-col-after',
                    'rowAbove': 'note-icon-row-above',
                    'rowRemove': 'note-icon-row-remove',
                    'colRemove': 'note-icon-col-remove',
                    'indent': 'note-icon-align-indent',
                    'outdent': 'note-icon-align-outdent',
                    'arrowsAlt': 'note-icon-arrows-alt',
                    'bold': 'note-icon-bold',
                    'caret': 'note-icon-caret',
                    'circle': 'note-icon-circle',
                    'close': 'note-icon-close',
                    'code': 'note-icon-code',
                    'eraser': 'note-icon-eraser',
                    'floatLeft': 'note-icon-float-left',
                    'floatRight': 'note-icon-float-right',
                    'font': 'note-icon-font',
                    'frame': 'note-icon-frame',
                    'italic': 'note-icon-italic',
                    'link': 'note-icon-link',
                    'unlink': 'note-icon-chain-broken',
                    'magic': 'note-icon-magic',
                    'menuCheck': 'note-icon-menu-check',
                    'minus': 'note-icon-minus',
                    'orderedlist': 'note-icon-orderedlist',
                    'pencil': 'note-icon-pencil',
                    'picture': 'note-icon-picture',
                    'question': 'note-icon-question',
                    'redo': 'note-icon-redo',
                    'rollback': 'note-icon-rollback',
                    'square': 'note-icon-square',
                    'strikethrough': 'note-icon-strikethrough',
                    'subscript': 'note-icon-subscript',
                    'superscript': 'note-icon-superscript',
                    'table': 'note-icon-table',
                    'textHeight': 'note-icon-text-height',
                    'trash': 'note-icon-trash',
                    'underline': 'note-icon-underline',
                    'undo': 'note-icon-undo',
                    'unorderedlist': 'note-icon-unorderedlist',
                    'video': 'note-icon-video',
                },

                callbacks: {
                    onBeforeCommand: null,
                    onBlur: null,
                    onBlurCodeview: null,
                    onChange: function (contents, context, $editable) {
                    },
                    onChangeCodeview: null,
                    onDialogShown: null,
                    onEnter: null,
                    onFocus: null,
                    onImageLinkInsert: null,
                    onImageUpload: null,
                    onImageUploadError: null,
                    onInit: function () {
                    },
                    onKeydown: null,
                    onKeyup: null,
                    onMousedown: null,
                    onMouseup: function (e) {
                    },
                    onPaste: function (event) {
                    },
                    onScroll: null,
                },
            });

            const noteFrame = this.editor.nextSibling;
            const page = noteFrame.querySelector('.note-editable');
            page.setAttribute('contenteditable', 'true');

            if (this.currentRecordId && this.templateTypeForCreation == 'Edit') {
                if (this.isDisplayedData) {
                    this.loadTemplateContent();
                    this.isDisplayedData = false;
                }
            }
            else{
                console.log('templateTypeForCreation ==> ' ,this.templateTypeForCreation);
                this.setEmailBody();
            }

            return true;
        } catch (error) {
            console.log(JSON.stringify(error));
            return false;
        }
    }

    /**
    * Method Name: loadTemplateContent
    * @description: load the template body and add that in library editor
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    loadTemplateContent() {

        if(this.isFirstTimeLoaded){
            getTemplateContent({ templateId: this.currentRecordId })
            .then(result => {
                console.log('result : ', result);
                this.description = result.Description__c;
                this.bodyOfTemplate = result.Template_Body__c;
                $(this.editor).summernote('code', this.bodyOfTemplate);

                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error fetching template content:', error);
                this.isLoading = false;
            });
        }
        else{
            $(this.editor).summernote('code', this.bodyOfTemplate);
        }


    }

    /**
    * Method Name: handleFieldChange
    * @description: handle field change and call appendFieldToEditor method
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handleFieldChange(event) {
        this.selectedField = event.detail.value;
        this.appendFieldToEditor();
    }

    /**
    * Method Name: appendFieldToEditor
    * @description: append the selected field in the editor of the library
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */

    appendFieldToEditor() {
        try {
            const content = `{!${this.selectedObject}.${this.selectedField}} `;
    
            $(this.editor).summernote('saveRange');
    
            $(this.editor).summernote('restoreRange');
    
            const currentRange = $(this.editor).summernote('createRange');
    
            if (currentRange) {
                const textNode = document.createTextNode(content);
    
                currentRange.insertNode(textNode);
    
                currentRange.collapse(false);
    
            }
        } catch (error) {
            console.log('error in appendFieldToEditor method', error);
        }
    }
    
    /**
    * Method Name: setEmailBody
    * @description: get the body of the template and set in the currentpagereference method
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    setEmailBody(){
        console.log('In setEmailbody method');
        console.log('bodyOfTemplate ==> ' , this.bodyOfTemplate);
        if(this.bodyOfTemplate != '' || this.bodyOfTemplate != null && this.templateTypeForCreation != 'New'){
            $(this.editor).summernote('code', this.bodyOfTemplate);
        }
    }

    /**
    * Method Name: handleSave
    * @description: save the record with alll the data
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handleSave() {
        const content = $(this.editor).summernote('code');
        this.isLoading = true;

        const template = {
            Object_Name__c: this.selectedObject,
            Label__c: this.templateLabel,
            Template_Body__c: content,
            Description__c : this.description,
            Template_Type__c : this.selectedType
        };
        console.log('recId ==> ' , this.currentRecordId);

        saveTemplate({ template : template , recId : this.currentRecordId })
            .then((res) => {
                this.showToast('Success', 'Template saved successfully', 'success');
                this.isLoading = false;
                this.navigationToTemplatePageWithPage();
            })
            .catch(error => {
                console.error('Error saving template:', error);
                this.showToast('Error', 'Error saving template', 'error');
                this.isLoading = false;
            });
    }

    /**
    * Method Name: handleEdit
    * @description: send the data of body in the modal and open popup to edit the template details
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handleEdit() {
        const content = $(this.editor).summernote('code');
        this.bodyOfTemplate = content;
    
        this.isModalOpen = true;
    }

    /**
    * Method Name: handleModalClose
    * @description: Method to close the modal
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handleModalClose() {
        this.isModalOpen = false;
    }

    /**
    * Method Name: handleCancel
    * @description: Method to close tab and go back to the previous tab
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    async handleCancel() {
        console.log('In handlecancel');
        var regex = /(<([^>]+)>)/ig;

        const editorContent = $(this.editor).summernote('code');
        const editorContentWithoutHtml = editorContent.replace(regex, "");
        console.log('editorContentWithoutHtml ==> ' , editorContentWithoutHtml);

        if(editorContentWithoutHtml != ''){

            const normalizedEditorContent = editorContent.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
            const normalizedBodyOfTemplate = this.bodyOfTemplate.replace(/\s+/g, ' ').trim();    
    
            if (normalizedEditorContent !== normalizedBodyOfTemplate) {
                console.log('editorContent ==> ' , normalizedEditorContent);
                console.log('bodyOfTemplate ==> ' , normalizedBodyOfTemplate);
                this.isObjectChanged =  true;
                this.cancelBtn = true;
        
                setTimeout(async () => {
                    const errorPopup = this.template.querySelector('c-error_-pop-up');
                    console.log('errorPopup ==> ', errorPopup);
        
                    if (errorPopup) {
                        errorPopup.showToast('warning', 'You will lose all changed data here', 'Warning');
                    } else {
                        console.error('Error popup component not found');
                    }
                }, 100);
            }

            else{
                this.navigationToTemplatePage();
            }
        }

        else{
            this.navigationToTemplatePage();
        }

    
    }

    /**
    * Method Name: navigationToTemplatePage
    * @description: Method to nevigate template page
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    navigationToTemplatePage(){
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: {
                    apiName: 'template_builder',
                    pageNumber: this.newPageNumber
                },
            });
    }

    /**
    * Method Name: navigationToTemplatePageWithPage
    * @description: Method to nevigate template page with current page
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    navigationToTemplatePageWithPage() {
        const pageSize = 10;
        this.newPageNumber = 1;
        if(this.totalRecodslength){
            this.newPageNumber = Math.ceil((this.totalRecodslength + 1) / pageSize);
        }
    
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'template_builder',
                pageNumber: this.newPageNumber
            },
        });
    }

    /**
    * Method Name: showToast
    * @description: Method to display toast message
    * Date: 13/06/2024
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

    /**
    * Method Name: handlePopUpCancel
    * @description: Method to cancel error popup
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handlePopUpCancel(){
        this.isObjectChanged  = false;
        console.log('oldobject ==> ' , this.oldObject);
        
        if(this.oldObject){
            this.selectedObject = this.oldObject;
        }
        this.cancelBtn = false;
        // $(this.editor).summernote('destroy');
        console.log(this.selectedObject , 'SelectedObject');
    }

    /**
    * Method Name: handleContinue
    * @description: Method to continue error popup component
    * Date: 13/06/2024
    * Created By: Rachit Shah
    */
    handleContinue() {
        if (this.isObjectChanged && !this.cancelBtn) {
            const editorContent = $(this.editor).summernote('code');
            
            const mergeFieldRegex = /\{\![^\}]+\}/g;
            
            const replacedContent = editorContent.replace(mergeFieldRegex, '{!Merge field text}');
            
            $(this.editor).summernote('code', replacedContent);
            
            this.isObjectChanged = false;
        }

        else{
            $(this.editor).summernote('code', this.bodyOfTemplate);
            this.navigationToTemplatePage();
        }
    }
    
}