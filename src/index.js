import './index.css';
import { Initializer } from './initializer';
import { Ifc } from './ifc'; 
import { GnTEdit } from './gntedit/gntedit';
import { WindowWidthResizeWidget } from './WindowWidthResizeWidget';
import { MessageBox } from './messagebox';
import { Locale } from './locale';
import { restoreAttachments, smartAttach } from './index-helpers';
import { saveProject } from './index-save-project';
import { AData } from './adata';
import { IndexControls } from './index-controls';
import { WorkTypesWindow } from './worktypeswindow';

const pickColor = 0xa0a040;
const checkColor = 0x4040f0;
const modelColor = 0xa0a0a0;
const modelOpacity = 0.25;

const highlightColor = 'rgba(100, 100, 255, 0.25)';
const hoverHighlightColor = 'rgba(200, 200, 255, 0.25)';

const _initer = new Initializer();

const _locale = new Locale( (_initer.lang) ? _initer.lang : undefined );

const _iControls = new IndexControls(_initer, _locale);

let _wtWin = null;

let _adata = null;

if( !_initer.user || !_initer.sessId ) {
	const mb = new MessageBox();
	mb.show( _locale.msg('auth_error') );
}

const _ifc = new Ifc( _locale, _initer, document.getElementById('ifc-treeview'), 
	{ pickColor: pickColor, checkColor: checkColor, modelColor: modelColor, modelOpacity: modelOpacity } );

// *** Gantt section

var _gntedit = null;

_gntedit = new GnTEdit('gnt', 
	{ highlightColor: highlightColor, hoverHighlightColor: hoverHighlightColor }, 
	{ 
		locale: _locale,
		highlightCallback: function(id, type, prevId) {
			_ifc.highlightActivityAttachments( id, (typeof(type)==='undefined' || type===null) ? -1 : type, prevId );
		},  
		isHighlightEnabled: function() { return (_ifc.ifcModel !== null); },
		attachmentsMenu: [ 
			{ 
				title: _locale.msg('attach_selected_with_no_materials'), 
				callback: function(i) { _ifc.copySelectedToActivity(i); },
				isAvailable: function(i) { 
					let ids = _gntedit.getAttachmentsOfHighlighted();
					return (ids && ids.length > 0);
				}
			}, 
			{ 
				title: _locale.msg('attach_selected_with_all_materials'), 
				callback: function(i) { 
					_ifc.copySelectedMaterialLayerToActivity(i, -1, _locale.msg('no_materials')); 
				},
				isAvailable: function(i) { 
					let ids = _gntedit.getAttachmentsOfHighlighted();
					return (ids && ids.length > 0);
				}
			}, 
			{ 
				//title: _locale.msg('attach_material_layer'), 
				callback: function(i, mkey, mname) { 
					_ifc.copySelectedMaterialLayerToActivity(i, mkey, mname); 
				},
				/*
				isAvailable: function(i) { 
					let ids = _gntedit.getAttachmentsOfHighlighted();
					return (ids && ids.length > 0);
				}, 
				*/
				generator: async function(activityId) {
					let layers = await _ifc.getMaterialLayersOfElements(); // Must return key-value pairs used to create several menu items
					//let activityId = _ifc.attachments.selectedActivity;
					for( let mId in layers ) {
						let mats = _gntedit.getMaterialsAttachedById( activityId );
						let style = (mats && mats.indexOf(mId) >= 0) ? 
							'font-weight: bold; color: #000000' : null; 	// Converted into: "<style>...</style>"
						let name = layers[mId];
						layers[mId] = { name: name, style: style };
					}
					return layers;
				}
			}, 
			{ 
				title: _locale.msg('clear_attachments'), 
				callback: function(i) { _ifc.clearAttachmentsForActivity(i); },  
				isAvailable: function(i) { 
					let ids = _gntedit.getAttachmentsByActivityId(i);
					return (ids && ids.length > 0); 
				}
			}, 
			{ 
				title: _locale.msg('split_with_storey_template'), 
				callback: function(i) { _ifc.splitWithStoreyTemplate(i); },  
				isAvailable: function(i) { 
					return ( _initer.storeyTemplateSwitchOn && _ifc.isStoreyTemplateSet() );
				}
			}
		]
	} 
);

_ifc.setTreeEdit(_gntedit.treeEdit);

setupControls();

//_ifc.setAttachmentsUpdateCallback( _gntedit.displayProperties.bind(_gntedit) )

window.addEventListener('contextmenu', function(e) { e.preventDefault(); return true; });

//document.body.addEventListener( 'selectstart', function(e) { e.preventDefault(); return false; } );
//document.body.addEventListener( 'selectend', function(e) { e.preventDefault(); return false; } );

const treeviewResizeWidget = new WindowWidthResizeWidget( 
	document.getElementById('ifc-toolbox'), -1, 
	function( width ) {
		let treeviewDiv = document.getElementById('ifc-treeview');
		treeviewDiv.style.width = width + 'px';
	}
);

const gntResizeWidget = new WindowWidthResizeWidget( 
	document.getElementById('gnt'), 1, 
	function( width ) {
		//_gntedit.fitContainerWidth();
	}
);


// Highlight ifc elements (already) attached typewise functionality
function setupControls() {
	_iControls.save.addEventListener( 
		'click', 
		function(e) { 
			saveProject(
				{ locale: _locale, initer:_initer, icontrols:_iControls, gntedit: _gntedit, ifc: _ifc }
			); 
		}, 
		false 
	);

	_iControls.help.onclick = function(e) { 
		let mb = new MessageBox( { textAlign:'left' } );
		mb.confirm( 
			_locale.helpText(), _locale.msg('help_title'), 
			100, 100, window.innerWidth - 200, window.innerHeight - 200 
		);
	};

	_wtWin = new WorkTypesWindow({ 
		initer: _initer, locale: _locale, gntedit: _gntedit, ifc: _ifc,
		callback: async function(works) { return await smartAttach(_ifc, _gntedit, works); } 
	});
	_iControls.workTypes.addEventListener( 'click', function(e) { _wtWin.show(); }, false );			

	// ****
	function addPickFileListener() {
		_iControls.file.addEventListener( 
			'change', 
			function(changed) 
			{
				if( changed.target.files.length === 0 ) {
					return;
				}
				let ifcURL = URL.createObjectURL(changed.target.files[0]);
				_ifc.setCoordsToOrigin();
				_ifc.loadModel( ifcURL, changed.target.files[0].name, changed.target.files[0],
					async function() {
						//console.log(_ifc.treeView.rootNode);
						let props = await _ifc.getItemProperties(_ifc.treeView.rootNode.expressID);
						//console.log(props);
						let pname = (props[0]) ? props[0] : ((props[1]) ? props[1] : '');
						_iControls.setProjectName(pname); 
						_iControls.setProjectVersion(1); 
						_iControls.ifcFileUploaded = true;
					});
			},
			false
		);
	}

	if( !_initer.projectId ) 
	{ 	// No ifc path is specified - adding "Choose Ifc Model" functionality
		addPickFileListener();
	} 
	
	if( _initer.projectId ) 
	{		// The project name is specified - using update functionality
		_adata = new AData({}, _initer.projectId, _initer.user, _initer.sessId);
		_adata.load( function(status, adata) 
		{
			_iControls.setProjectName( adata.data.project.Code );

			_wtWin.setAData( _adata );
			
			//let dataTypeMap = _adata.createDataTypeMap();
			//if( dataTypeMap ) {
			//	_ifc.setDataTypeMap(dataTypeMap); 	// DataTypeMap [i => 'type'] 
			//}	
				
			let isIfcPath = 
				(typeof(adata.data.project.IFCPath) === 'string') && 
				adata.data.project.IFCPath.length > 0;
			
			if( isIfcPath ) { 	// An IFC-file already attached to the project
				let ifcURL = _initer.modelUrl + '?' + _initer.projectId;
				_ifc.setCoordsToOrigin();
				_ifc.loadModel( ifcURL, decodeURIComponent(adata.data.project.IFCPath), null, 
				async function() {
					await restoreAttachments(adata, _gntedit, _ifc);
				}
			);
			} else 	// No ifc file attached to the project
			{	
				_iControls.enableFilePicker(); 	// Enables picking an ifc-file
				addPickFileListener();
				setTimeout( async () => { await restoreAttachments(adata, _gntedit, _ifc); }, 0 );
			}
		});
	}
}
