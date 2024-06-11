import { LightningElement, track, wire, api } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import summerNote_Editor from '@salesforce/resourceUrl/summerNote_Editor';
import getFieldsForObject from '@salesforce/apex/TemplateBuilderController.getAllFieldNames';
import saveTemplate from '@salesforce/apex/TemplateBuilderController.saveTemplate';
import getTemplateContent from '@salesforce/apex/TemplateBuilderController.getTemplateContentById';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TemplateModalChild extends LightningElement {
    @api selectedObject;
    @api myrecordId;
    @track selectedField = '';
    @track fieldOptions = [];
    @track templateLabel = '';
    @track isLoading = true;
    @track isInitialRender = true;
    @track isDisplayedData = true; //For rendering data first time

    connectedCallback() {
        console.log('selectedObject ==> ', this.selectedObject);
        console.log('recId ==> ', this.myrecordId);

    }

    @wire(getFieldsForObject, { objectName: '$selectedObject' })
    wiredFields({ error, data }) {
        if (data) {
            this.fieldOptions = data.map(field => ({ label: field, value: field }));
        } else if (error) {
            console.error('Error fetching fields: ', error);
        }
    }

    renderedCallback(){
        try {
            if(this.isInitialRender){
            Promise.all([
                loadScript(this, summerNote_Editor + '/jquery-3.7.1.min.js'),
            ])
            .then(result => { 
                Promise.all([
                    
                    loadStyle(this, summerNote_Editor + '/summernote-lite.css'),
                    loadScript(this, summerNote_Editor + '/summernote-lite.js'),
                    
                ])
                .then(res => {
                    this.isInitialRender = false;
                    this.initializeSummerNote(this,'editor')

                    console.log('library loaded SuccessFully', {res});
                    this.isLoading = false;                   
                })
                .catch(err => {
                    console.log('Error To Load summerNote_Editor >> ', {err}) 
                    this.isLoading = false;
                })
            })
            .catch(error => { 
                console.log('Error To Load Jquery >> ', {error}) ;
                this.isLoading = false; 
            })
                
        }
        }
        catch(error){
            console.log('error in richTextEditor_custom.renderedCallback : ', error.stack);
        }
    }

    async initializeSummerNote(self, editorSelector){
        try { 
          console.log('self : ', self.activeTabName);
                var note = {
                  summerNote: null ,
                  selector: null ,
                  noteEditorFrame: null ,
                }
    
                var _self;
                _self = self;
                note.selector = editorSelector;
                note.summerNote =  _self.template.querySelector(`[data-name="${note.selector}"]`);
    
                // Initalize SummerNote Editor...
                $(note.summerNote).summernote({
        
                    editing: true,
                    // placeholder: 'Welcome To The DocGenius Template Builder. A Place Where You Can Create Your Amazing Documentation...',
                    styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                    fontSizes: ['8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','26','28','30','32','34','36','38','40','42','44','46','48','52','56','60','64','68','72','76','80','86','92','98'],
                    fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
                    addDefaultFonts : true,
                      tableClassName: 'table table-bordered',
                      insertTableMaxSize: {
                        col: 10,
                        row: 10,
                      },
                      toolbar: [
                        ['style', ['style']],
                        ['font', ['bold', 'underline', 'clear']],
                        ['fontname', ['fontname']],
                        ['color', ['color']],
                        ['para', ['ul', 'ol', 'paragraph']],
                        ['table', ['table']],
                        ['insert', ['link', 'picture', 'video']],
                        ['view', ['fullscreen', 'codeview', 'help']],
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
                            ['tablerowcolor', ['setTableRowColor']],
                            ['tablebordercolor', ['setTableBorder']],
                            ['tablecellcolor', ['setTableCellColor']],
                            ['cellVerticalAlightn', ['setCellVeticalAlign']],
                            ['merge', ['jMerge']],
                            ['style', ['jBackcolor', 'jBorderColor', 'jAlign']],
                            ['info', ['jTableInfo']],
                            // ['delete', ['jWidthHeightReset', 'deleteTable']],
                          ],
                    },
                    tabsize: 2,
                    disableResizeEditor: true,
                    blockquoteBreakingLevel: 2,
                    dialogsInBody : true,
                    dialogsFade : false,
                    disableDragAndDrop : true,
                    shortcuts : true,
                    tabDisable : false,
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
                        onChange: function(contents, context, $editable){
                            // setFontResizerValue(note);
                            // setFieldNameTagging(note, $editable);
                            
                        },
                        onChangeCodeview: null,
                        onDialogShown: null,
                        onEnter: null,
                        onFocus: null,
                        onImageLinkInsert: null,
                        onImageUpload: null,
                        onImageUploadError: null,
                        onInit: function(){
                            // Method to set CSS of HTML Elements Once Editor Load SuccessFully...
                            // setCSSAfterLoadEditor(note);
                        },
                        onKeydown: null,
                        onKeyup: null,
                        onMousedown: null,
                        onMouseup: function(e) {
                            // setFontResizerValue(note);
                        },
                        onPaste: function(event){
    
                        },
                        onScroll: null,
                      },
                });

                const page = document.querySelector('.note-editable');
                page.setAttribute('data-editor', note.selector);
                // There is some issue or bug in summerNote js that not make editor enable...
                // So we make it using our logic....
                page.setAttribute('contenteditable', 'true');

                if(this.myrecordId){
                    if(this.isDisplayedData){
                        this.loadTemplateContent();
                        this.isDisplayedData = false;
                    }
                }
                
                return true;
        } catch (error) {
            console.log(JSON.stringify(error));
            
            // console.warn('error in editorConfig.initializeSummerNote : ', error.stack);
            return false;
        }
    }
    
    loadTemplateContent() {
        getTemplateContent({ templateId: this.myrecordId })
            .then(result => {
                console.log(result);
                const editor = this.template.querySelector('[data-name="editor"]');
                console.log({editor});
                this.displayText(editor,result);
                // $(editor).summernote('code', result.Template_Body__c);
                // this.templateLabel = result.Label__c;
                // this.isLoading = false;
            })
            .catch(error => {
                console.error('Error fetching template content:', error);
                this.isLoading = false;
            });
    }

    async displayText(editor,result){
        let content = await result.Template_Body__c;
        let label = await result.Label__c;
        console.log('label ==> ', label);
        console.log('content ==> ' , content);
        $(editor).summernote('code', $(editor).summernote('code') + ' ' + content);
        this.templateLabel = label ;
        this.isLoading = false;
    }
    
    handleFieldChange(event) {
        this.selectedField = event.detail.value;
        this.appendFieldToEditor();
    }

    handleTemplateLabelChange(event) {
        this.templateLabel = event.target.value;
    }

    appendFieldToEditor() {
        const editor = this.template.querySelector('[data-name="editor"]');
        const content = `<span>{!${this.selectedObject}.${this.selectedField}}</span>`;
        $(editor).summernote('code', $(editor).summernote('code') + ' ' + content);
    }

    handleSave() {
        const editor = this.template.querySelector('[data-name="editor"]');
        const content = $(editor).summernote('code');
        this.isLoading = true;
        saveTemplate({ objectName: this.selectedObject, templateName: this.templateLabel, templateContent: content })
            .then(() => {
                this.showToast('Success', 'Template saved successfully', 'success');
                this.isLoading = false;
                this.handleClose();
            })
            .catch(error => {
                console.error('Error saving template:', error);
                this.showToast('Error', 'Error saving template', 'error');
                this.isLoading = false;
            });
    }

    handleClose() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}