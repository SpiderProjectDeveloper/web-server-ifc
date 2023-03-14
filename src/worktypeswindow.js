import { IFCPROJECT, IFCSITE, IFCBUILDING, IFCBUILDINGSTOREY, IFCANNOTATION } from 'web-ifc';
import { TooltipWindow } from './tooltipwindow';
import './worktypeswindow.css';
import { MessageBox } from './messagebox';

export class WorkTypesWindow 
{
	ignoreIfcTypes = [ IFCPROJECT, IFCSITE, IFCBUILDING, IFCBUILDINGSTOREY, IFCANNOTATION ];

	constructor( options={} ) 
	{
		this.counter = 0;
		this.initer = options.initer;
		this.locale = options.locale;
		this.ifc = options.ifc;
		this.gntedit = options.gntedit;
		this.callback = options.callback;
		this.windowTitle =  this.locale.msg('work_types_encoding');
		this.tooltipWindow = new TooltipWindow( 
			null, 
			{ 
				title: this.windowTitle, x:8, y: this.initer.hh + 8, closeOnOk: false,
				w: Math.floor(this.initer.contentW * 0.6 - 8), h: Math.floor(this.initer.contentH * 0.7)
			}
		);

		this.containerDiv = document.createElement('div');
		this.containerDiv.className = 'workTypesWindowContainer';

		this.messageDiv = document.createElement('div');
		this.messageDiv.className = 'workTypesWindowMessage';
		this.containerDiv.appendChild( this.messageDiv );

		this.appendDiv = document.createElement('div');
		this.appendDiv.className = 'workTypesWindowAppend';
		this.appendDiv.innerHTML = this.locale.msg('smart_attach_append_button');
		this.appendDiv.title = this.locale.msg('smart_attach_append_button_title');		
		this.appendDiv.onclick = function(e) {
			let workTypeDiv = this.createWorkTypeDiv();
			this.typesContainerDiv.appendChild( workTypeDiv );
		}.bind(this);
		this.containerDiv.appendChild( this.appendDiv );

		this.saveDiv = document.createElement('div');
		this.saveDiv.className = 'workTypesWindowSave';
		this.saveDiv.innerHTML = this.locale.msg('save_work_types');
		this.saveDiv.title = this.locale.msg('save_work_types_title');
		this.saveDiv.onclick = function(e) {
			this.save();
		}.bind(this);
		this.containerDiv.appendChild( this.saveDiv );

		this.saveIntoBrowserDiv = document.createElement('div');
		this.saveIntoBrowserDiv.className = 'workTypesWindowSaveIntoBrowser';
		this.saveIntoBrowserDiv.innerHTML = this.locale.msg('save_work_types_into_browser');
		this.saveIntoBrowserDiv.title = this.locale.msg('save_work_types_into_browser_title');
		this.saveIntoBrowserDiv.onclick = function(e) {
			this.saveWorksIntoBrowser();
		}.bind(this);
		this.containerDiv.appendChild( this.saveIntoBrowserDiv );

		this.restoreFromBrowserDiv = document.createElement('div');
		this.restoreFromBrowserDiv.className = 'workTypesWindowRestoreFromBrowser';
		this.restoreFromBrowserDiv.innerHTML = this.locale.msg('restore_work_types_from_browser');
		this.restoreFromBrowserDiv.title = this.locale.msg('restore_work_types_from_browser_title');
		this.restoreFromBrowserDiv.onclick = function(e) {
			this.restoreWorkTypesFromBrowser();
		}.bind(this);
		this.containerDiv.appendChild( this.restoreFromBrowserDiv );

		this.restoreFromSPDiv = document.createElement('div');
		this.restoreFromSPDiv.className = 'workTypesWindowRestoreFromSP';
		this.restoreFromSPDiv.innerHTML = this.locale.msg('restore_work_types_from_sp');
		this.restoreFromSPDiv.title = this.locale.msg('restore_work_types_from_sp_title');
		this.restoreFromSPDiv.onclick = function(e) {
			this.restoreWorkTypesFromSP();
		}.bind(this);
		this.containerDiv.appendChild( this.restoreFromSPDiv );

		this.attachDiv = document.createElement('div');
		this.attachDiv.className = 'workTypesWindowAttach';
		this.attachDiv.innerHTML = this.locale.msg('smart_attach_button');
		this.attachDiv.title = this.locale.msg('smart_attach_button_title');
		this.attachDiv.onclick = async function(e) {
			this.save();
			let works = this.getWorksInWindow();
			//console.log(works);
			let r = await this.callback( works );
			let msgs = this.locale.msg('smart_attach_report');
			let report = `${msgs.created} ${r.numStoreys} ${msgs.storeys}, ${r.numOperations} ${msgs.operations}`;
			this.showMessage(report);
		}.bind(this);
		this.containerDiv.appendChild( this.attachDiv );

		this.typesContainerDiv = document.createElement('div');
		this.typesContainerDiv.className = 'workTypesWindowTypesContainer';
		this.containerDiv.appendChild( this.typesContainerDiv );

		this.adata = null;

		this.isFirstShow = true;		// To know if the show function is displayed first time
	}

	setAData( adata ) 
	{
		this.adata = adata;
		this.gntedit.treeEdit.initWorkTypesOutOfSPData( adata );
		this.ifc.setWorkTypesHighlights(this.gntedit.treeEdit.workTypes); 		// Colors to highlight different work types 
	}
	
	createWorkTypesDivs() 
	{
		while( this.typesContainerDiv.lastChild ) {
			this.typesContainerDiv.removeChild( this.typesContainerDiv.lastChild );
		}

		if( this.gntedit.treeEdit.workTypes ) {
			for( let [k, wt] of this.gntedit.treeEdit.workTypes ) {
				let workTypeDiv = this.createWorkTypeDiv(k, wt);
				this.typesContainerDiv.appendChild(workTypeDiv);
			}
		}
	}

	isHidden() 
	{
		return this.tooltipWindow.isHidden();
	}

	initIfcTypesAndMaterials() 
	{
		this.ifcTypes = [];
		for( let key in this.ifc.treeView.typesMap ) {
			this.ifcTypes.push( { name: key, id: this.ifc.treeView.typesMap[key] } );
		}
		this.ifcMaterials = [];
		for( let key in this.ifc.treeView.materialsMap ) {
			this.ifcMaterials.push( { name: this.ifc.treeView.materialsMap[key], expressId: key } );
		}
	}

	show = function() 
	{
		if( this.ifc.ifcModel === null ) {
			let mb = new MessageBox();
			mb.confirm( this.locale.msg('model_not_loaded') );
			return;
		}

		if( !this.tooltipWindow.isHidden() ) {
			this.tooltipWindow.hide();
			return;
		}

		this.initIfcTypesAndMaterials();
		this.createWorkTypesDivs();
		this.showMessage(null);				// Hiding a message
		this.tooltipWindow.show( this.containerDiv );

		if( this.isFirstShow ) {
			let r = this.restoreWorkTypesFromSP( { silentMode: true } );
			if( r ) return;
			this.restoreWorkTypesFromBrowser();
			this.isFirstShow = false;
		}
	}

	createWorkTypeDiv( type=null, typeData=null ) 
	{
		// Type container
		let typeContainerDiv = document.createElement('div');
		typeContainerDiv.className = 'workTypesWindowTypeContainer';
		typeContainerDiv.id = 'workTypeDiv' + this.counter;
		this.counter++;
		typeContainerDiv.draggable = true;

		typeContainerDiv.ondragstart = function(e) {
			e.dataTransfer.setData('text', typeContainerDiv.id); 
		}.bind(this);

		typeContainerDiv.ondrop = function(e) { 	// Handling drop 
			e.preventDefault();
			let draggedId = e.dataTransfer.getData('text'); 
			let draggedElem = document.getElementById( draggedId );
			this.typesContainerDiv.insertBefore( draggedElem, typeContainerDiv );
		}.bind(this);

		typeContainerDiv.ondragover = function(e) { 
			e.preventDefault(); 
		}	// To allow drop
		// End of type container

		let typeHeaderDiv = document.createElement('div');
		typeHeaderDiv.className = 'workTypesWindowTypeHeader';
		typeContainerDiv.appendChild( typeHeaderDiv );

		let expandDiv = document.createElement('div');
		expandDiv.className = 'workTypesWindowExpand';
		typeHeaderDiv.appendChild( expandDiv );

		let colorInput = document.createElement('input');
		colorInput.className = 'workTypesWindowColor';
		colorInput.type = 'color';
		let c = (typeData) ? typeData.colorStr : '#707070';
		colorInput.value = c;
		colorInput.dataset.color = c;
		colorInput.onchange = function(e) {
			colorInput.dataset.color = e.target.value; 
			this.showMessage(this.locale.msg('work_types_not_saved'));
		}.bind(this)				 
		typeHeaderDiv.appendChild(colorInput);

		let nameInput = document.createElement('input');
		nameInput.type='text';
		nameInput.className = 'workTypesWindowNameInput';
		nameInput.placeholder = this.locale.msg('work_type_name_placeholder');
		typeHeaderDiv.appendChild( nameInput );
		if( typeData && typeData.name ) {
			nameInput.value = typeData.name;
		}
		nameInput.onchange = function(e) { 
			this.showMessage(this.locale.msg('work_types_not_saved')); 
		}.bind(this);
		nameInput.onblur = nameInput.onchange;

		let typeInput = document.createElement('input');
		typeInput.type='text';
		typeInput.className = 'workTypesWindowTypeInput';
		typeInput.placeholder = this.locale.msg('work_type_code_placeholder');
		typeHeaderDiv.appendChild( typeInput );
		if( type ) {
			typeInput.value = type;
		}
		typeInput.onchange = function(e) { 
			this.showMessage(this.locale.msg('work_types_not_saved')); 
		}.bind(this);
		typeInput.onblur = typeInput.onchange;

		let removeDiv = document.createElement('div');
		removeDiv.className = 'workTypesWindowRemove';
		typeHeaderDiv.appendChild( removeDiv );
		removeDiv.innerHTML = '✖';
		removeDiv.onclick = function(e) {
			this.typesContainerDiv.removeChild(typeContainerDiv);
		}.bind(this);

		let settingsDiv = document.createElement('div')
		settingsDiv.className = 'workTypesWindowSettings';
		typeContainerDiv.appendChild( settingsDiv );

		let ifcTypesDiv = document.createElement('div');
		ifcTypesDiv.className = 'workTypesWindowIfcTypes'
		settingsDiv.appendChild( ifcTypesDiv );

		const checkTypeMaterialCombination = function( input, tId, mId, ifcMaterials ) {
			if( !ifcMaterials || !ifcMaterials.types || !ifcMaterials.materials ) return;
			for( let t of ifcMaterials.types ) {
				if( t.id != tId ) continue;
				if( mId === null && ifcMaterials.materials.length === 0 ) {
					input.checked = true;
					continue;
				}
				for( let m of ifcMaterials.materials ) {
					if( m.expressId != mId ) continue;
					input.checked = true;
					break;
				}
			}
		}

		let ifcMaterials = (typeData) ? typeData['ifcMaterials'] : null;
		for( let t of this.ifcTypes ) 
		{
			if( this.ignoreIfcTypes.indexOf(t.id) !== -1 ) continue;

			let ifcTypeDiv = document.createElement('div');
			ifcTypeDiv.className = 'workTypesWindowIfcType';
			ifcTypesDiv.appendChild( ifcTypeDiv );

			let ifcTypeTitleDiv = document.createElement('div');
			ifcTypeTitleDiv.className = 'workTypesWindowIfcTypeTitle';
			ifcTypeTitleDiv.innerHTML = t.name;
			ifcTypeDiv.appendChild( ifcTypeTitleDiv );

			let tmMap = this.ifc.treeView.typeMaterialCombinationsMap;
			if( t.id in tmMap && tmMap[t.id].size > 0 ) {
				let input = this.createIfcTypeInput(ifcTypeDiv, t, null);
				checkTypeMaterialCombination( input, t.id, null, ifcMaterials );	// Check if ifcMaterials are given and valid
				if( t.id in tmMap ) {
					for( let mId of tmMap[t.id] ) {
						input = this.createIfcTypeInput(ifcTypeDiv, t, mId);
						checkTypeMaterialCombination( input, t.id, mId, ifcMaterials );	// Check if ifcMaterials are given and valid
					}
				}
			} else {
				this.createIfcTypeInput(ifcTypeDiv, t, null);
			}
		}

		expandDiv.onclick = function(e) 
		{
			expandDiv.innerHTML = (settingsDiv.style.display !== 'block') ? '▽' : '▷';
			settingsDiv.style.display = (settingsDiv.style.display !== 'block') ? 'block' : 'none';
		}
		expandDiv.innerHTML = '▷';

		return typeContainerDiv;
	}

	createIfcTypeInput( typeDiv, t, mId = null ) 
	{
		let typeInput = document.createElement('input');
		typeInput.type = 'checkbox';
		typeInput.className = 'workTypesWindowIfcTypeInput';
		typeInput.dataset.name = t.name;
		typeInput.dataset.id = t.id;
		if( mId !== null ) {
			typeInput.dataset.mid = mId;
		} else {
			typeInput.dataset.mid = 'null';
		}
		typeDiv.appendChild(typeInput);

		const uncheckAllButNoMaterials = function( container ) {
			for( let child of container.children ) {
				if( child.dataset.mid !== 'null' ) {
					child.checked = false;
				}
			}
		}
	
		const uncheckNoMaterials = function( container ) {
			for( let child of container.children ) {
				if( child.dataset.mid === 'null' ) {
					child.checked = false;
					break;
				}
			}
		}
	
		let typeName = document.createElement('div');
		typeName.className = 'workTypesWindowIfcTypeName';
		if( mId !== null ) {
			typeName.innerHTML = this.ifc.treeView.materialsMap[mId];
			typeInput.onchange = function(e) {
				if( !e.target.checked ) return;
				uncheckNoMaterials(typeDiv);
			}.bind(this);
		} else {
			typeName.innerHTML = this.locale.msg('no_materials');
			typeInput.onchange = function(e) {
				if( !e.target.checked ) return;
				uncheckAllButNoMaterials(typeDiv);
			}.bind(this);
		}
		typeDiv.appendChild(typeName);
		return typeInput;
	}

	save() 
	{
		let types = [];
		let works = this.getWorksInWindow();

		for( let cdiv of this.typesContainerDiv.children ) {
			if( cdiv.className !== 'workTypesWindowTypeContainer' ) continue;
			
			for( let cdiv_ of cdiv.children ) {
				if( cdiv_.className !== 'workTypesWindowTypeHeader') continue;
	
				let type=null, name=null, color=null;
				for( let cdiv__ of cdiv_.children ) {
					if( cdiv__.className === 'workTypesWindowTypeInput' ) {
						type = (cdiv__.value && cdiv__.value.length > 0) ? cdiv__.value : null;
					}
					if( cdiv__.className === 'workTypesWindowNameInput' ) {
						name = (cdiv__.value && cdiv__.value.length > 0) ? cdiv__.value : null;
					}
					if( cdiv__.className === 'workTypesWindowColor' ) {
						color = cdiv__.dataset.color;
					}
				}
				if( type !== null && name !== null && color !== null ) {
					let typeData = { type:type, name:name, colorStr:color };
					let work = this.findWorkByType(type, works);
					if( work !== null ) {
						typeData['ifcMaterials'] = work;
					}
					types.push(typeData);
				}
			}
		}
		if( types.length > 0 ) {
			this.gntedit.treeEdit.initWorkTypes( types, true );			
			this.ifc.setWorkTypesHighlights(this.gntedit.treeEdit.workTypes);
		}
		this.showMessage(this.locale.msg('work_types_saved'));
		return types;
	}

	getWorksInWindow() 
	{
		let works = [];
		for( let typeDiv of this.typesContainerDiv.children ) {
			if( typeDiv.className !== 'workTypesWindowTypeContainer' ) continue;
			let name=null;
			let workType=null;
			let types = [];
			let materailsSet = new Set();
			for( let childDiv of typeDiv.children ) {
				if( childDiv.className === 'workTypesWindowTypeHeader' ) {
					for( let childDiv_ of childDiv.children ) {
						if( childDiv_.className === 'workTypesWindowNameInput' ) {
							name = childDiv_.value;
						}
						if( childDiv_.className === 'workTypesWindowTypeInput' ) {
							workType = childDiv_.value;
						}
					}
				}
				if( childDiv.className === 'workTypesWindowSettings' ) {
					for( let childDiv_ of childDiv.children ) {
						if( childDiv_.className === 'workTypesWindowIfcTypes' ) {	// childDiv_ - 'smartAttachTypes'
							for( let childDiv__ of childDiv_.children ) {		// childDiv__ - 'smartAttachType'
								for( let childDiv___ of childDiv__.children) {		// Searching for childDiv___ = 'smartAttachTypeInput'
									if( childDiv___.className !== 'workTypesWindowIfcTypeInput' ) continue;
									if( !childDiv___.checked ) continue;
									let type = { name: childDiv___.dataset.name, id: childDiv___.dataset.id };
									if( childDiv___.dataset.mid && childDiv___.dataset.mid !== 'null' ) {
										materailsSet.add(childDiv___.dataset.mid)
									}
									types.push( type );
								}
							}
						}
					}
				}
			}
			if( !name || types.length === 0  ) continue;
			let materials = [];
			for( let mId of materailsSet ) {
				materials.push( { expressId: mId, name: this.ifc.treeView.materialsMap[mId] } );
			}
			works.push( { name: name, workType: workType, types: types, materials: materials } );
		}
		return works;
	}

	findWorkByType( workType, works=null ) 
	{
		if( !works ) {
			works = this.getWorksInWindow();
		}
		for( let i = 0 ; i < works.length ; i++ ) {
			let w = works[i];
			if( w.workType === workType ) {
				return w;
			}
		}
		return null;
	}

	saveWorksIntoBrowser() 
	{
		let workTypes = this.save();
		if( workTypes.length > 0 ) {
			localStorage.setItem(this.initer.workTypesStorageKey, JSON.stringify(workTypes));
			this.showMessage( this.locale.msg('work_types_saved') );
		}
	}

	restoreWorkTypesFromBrowser() 
	{
		let workTypes = localStorage.getItem(this.initer.workTypesStorageKey);
		if( !workTypes ) return false;
		workTypes = JSON.parse( workTypes );
		//console.log(workTypes);
		this.gntedit.treeEdit.initWorkTypes( workTypes, true, false );	// Reset colors, do not reset work types from SP if exist
		this.ifc.setWorkTypesHighlights(this.gntedit.treeEdit.workTypes);
		this.createWorkTypesDivs();
		this.showMessage( this.locale.msg('work_types_restored_from_browser') );
		return true;
	}

	restoreWorkTypesFromSP( props = {} ) {
		if( this.adata === null ) {
			let mb = new MessageBox();
			if( props.silentMode ) {
				return;
			}
			mb.confirm( this.locale.msg('project_not_loaded'));
			return false;
		}
		this.gntedit.treeEdit.initWorkTypesOutOfSPData( this.adata );
		this.ifc.setWorkTypesHighlights(this.gntedit.treeEdit.workTypes); 		// Colors to highlight different work types 		
		this.createWorkTypesDivs();
		this.showMessage( this.locale.msg('work_types_restored_from_sp') );
		return true;
	}

	showMessage(msg=null) {
		if( msg ) {
			this.messageDiv.innerHTML = msg;
			this.messageDiv.style.display = 'block';
		} else {
			this.messageDiv.innerHTML = '';
			this.messageDiv.style.display = 'none';
		}
	}
}
