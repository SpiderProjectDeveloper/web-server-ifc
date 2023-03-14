import { IFCPROJECT, IFCSITE, IFCBUILDING, IFCBUILDINGSTOREY, IFCANNOTATION,
	IFCWALL, IFCWALLSTANDARDCASE } from 'web-ifc';
import { TooltipWindow } from './tooltipwindow'
import './smartattachwindow.css';
import { ContextMenu } from './contextmenu';
import { MessageBox } from './messagebox';

export class SmartAttachWindow {
	ignoreTypes = [ IFCPROJECT, IFCSITE, IFCBUILDING, IFCBUILDINGSTOREY, IFCANNOTATION ];

	constructor( settings ) {
		this.settings = settings;
		this.initer = settings.initer;
		this.locale = settings.locale;
		this.gntedit = settings.gntedit;
		this.ifc = settings.ifc;
		this.workTypesWindow = settings.workTypesWindow;

		this.callback = settings.callback;

		let title = this.locale.msg('smart_attach');

		this.twindow = new TooltipWindow( 
			null, 
			{ 
				title: title, x: Math.floor(this.initer.contentW * 0.5), y: this.initer.hh + 8, 
				w: Math.floor(this.initer.contentW * 0.45 - 8), h: Math.floor(this.initer.contentH * 0.7),
				okButton: { callback: function() { this.workTypesWindow.save(); }.bind(this), arg:null }
			}
		);

		this.containerDiv = document.createElement('div');
		this.containerDiv.className = 'smartAttachContainer';

		this.messageDiv = document.createElement('div');
		this.messageDiv.className = 'smartAttachMessage';
		this.containerDiv.appendChild( this.messageDiv );

		this.attachDiv = document.createElement('div');
		this.attachDiv.className = 'smartAttachButton';
		this.attachDiv.innerHTML = this.locale.msg('smart_attach_button');
		this.attachDiv.onclick = async function(e) {
			this.workTypesWindow.save();
			let works = this.getWorksInWindow();
			let r = await this.callback( works );
			let msgs = this.locale.msg('smart_attach_report');
			let report = `${msgs.created} ${r.numStoreys} ${msgs.storeys}, ${r.numOperations} ${msgs.operations}`;
			this.messageDiv.innerHTML = report;
		}.bind(this);
		this.containerDiv.appendChild( this.attachDiv );

		this.saveDiv = document.createElement('div');
		this.saveDiv.className = 'smartAttachSave';
		this.saveDiv.innerHTML = this.locale.msg('save_smart_attach_works');
		this.saveDiv.onclick = function(e) {
			this.saveWorksIntoBrowser();
		}.bind(this);
		this.containerDiv.appendChild( this.saveDiv );

		this.restoreDiv = document.createElement('div');
		this.restoreDiv.className = 'smartAttachRestore';
		this.restoreDiv.innerHTML = this.locale.msg('restore_smart_attach_works');
		this.restoreDiv.onclick = function(e) {
			this.restoreWorks();
		}.bind(this);
		this.containerDiv.appendChild( this.restoreDiv );

		this.appendDiv = document.createElement('div');
		this.appendDiv.className = 'smartAttachAppend';
		this.appendDiv.innerHTML = '＋';
		this.appendDiv.onclick = function(e) {
			let work = this.createWorkEntry();
			this.worksDiv.appendChild( work );
		}.bind(this);
		this.containerDiv.appendChild( this.appendDiv );

		this.worksDiv = document.createElement('div');
		this.containerDiv.appendChild( this.worksDiv );
	}

	initTypesAndMaterials() {
		this.ifcTypes = [];
		for( let key in this.ifc.treeView.typesMap ) {
			this.ifcTypes.push( { name: key, id: this.ifc.treeView.typesMap[key] } );
		}
		this.ifcMaterials = [];
		for( let key in this.ifc.treeView.materialsMap ) {
			this.ifcMaterials.push( { name: this.ifc.treeView.materialsMap[key], expressId: key } );
		}
	}

	createWorkDivsOutOfGnt() {
		let works = [];
		for( let [type, typeData] of this.gntedit.treeEdit.workTypes ) {
			let w = ('ifcMaterials' in typeData) ? typeData['ifcMaterials'] : null;
			if( w === null ) continue;
			//w.workType = type;
			//w.name = typeData.name;
			let i = ('i' in w) ? Number(w.i) : NaN;
			if( isNaN(i) ) continue;
			works.push( w );
		}
		if( works.length > 0 ) {
			works.sort( (w1, w2) => { return w1.i - w2.i } );
			for( let w of works ) {
				let workDiv = this.createWorkEntry( w );
				this.worksDiv.appendChild( workDiv );
			}
		}
	}

	show() {
		if( this.ifc.ifcModel === null ) {
			let mb = new MessageBox();
			mb.confirm( this.locale.msg('model_not_loaded') );
			return;
		}

		if( !this.twindow.isHidden() ) {
			this.twindow.hide();
			return;
		}

		this.initTypesAndMaterials();
		this.removeWorks();
		this.createWorkDivsOutOfGnt();
		this.messageDiv.innerHTML = '';
		this.twindow.show( this.containerDiv );
	}

	hide() {
		this.twindow.hide();
	}

	getWorksInWindow() {
		let works = [];
		for( let workDiv of this.worksDiv.children ) {
			if( workDiv.className !== 'smartAttachWork' ) continue;
			let name=null;
			let workType=null;
			let types = [];
			let materailsSet = new Set();
			for( let childDiv of workDiv.children ) {
				if( childDiv.className === 'smartAttachWorkHead' ) {
					for( let childDiv_ of childDiv.children ) {
						if( childDiv_.className === 'smartAttachWorkNameInput' ) {
							name = childDiv_.value;
						}
						if( childDiv_.className === 'smartAttachWorkTypeInput' ) {
							workType = childDiv_.value;
						}
					}
				}
				if( childDiv.className === 'smartAttachSettings' ) {
					for( let childDiv_ of childDiv.children ) {
						if( childDiv_.className === 'smartAttachTypes' ) {	// childDiv_ - 'smartAttachTypes'
							for( let childDiv__ of childDiv_.children ) {		// childDiv__ - 'smartAttachType'
								for( let childDiv___ of childDiv__.children) {		// Searching for childDiv___ = 'smartAttachTypeInput'
									if( childDiv___.className !== 'smartAttachTypeInput' ) continue;
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

	findWorkByType( workType, works=null ) {
		if( !works ) {
			works = this.getWorksInWindow();
		}
		for( let i = 0 ; i < works.length ; i++ ) {
			let w = works[i];
			if( w.workType === workType ) {
				w.i = i;
				return w;
			}
		}
		return null;
	}

	createWorkEntry = function( props={} ) {
		let workDiv = document.createElement('div');
		workDiv.className = 'smartAttachWork';
		
		let workHeadDiv = document.createElement('div');
		workHeadDiv.className = 'smartAttachWorkHead';	
		workDiv.appendChild( workHeadDiv );

		let expandDiv = document.createElement('div');
		expandDiv.className = 'smartAttachExpand';
		workHeadDiv.appendChild( expandDiv );

		let workNameInput = document.createElement('input');
		workNameInput.type='text';
		workNameInput.className = 'smartAttachWorkNameInput';
		workNameInput.readOnly = true;
		workNameInput.placeholder = this.locale.msg('work_type_name_placeholder');
		workHeadDiv.appendChild( workNameInput );
		if( props.name ) {
			workNameInput.value = props.name;
		}

		let workTypeInput = document.createElement('input');
		workTypeInput.type='text';
		workTypeInput.className = 'smartAttachWorkTypeInput';		
		workTypeInput.readOnly = true;
		workTypeInput.placeholder = this.locale.msg('work_type_code_placeholder');
		workHeadDiv.appendChild( workTypeInput );
		if( props.workType ) {
			workTypeInput.value = props.workType;
		}

		let workTypeSelect = document.createElement('div');
		workTypeSelect.className = 'smartAttachWorkTypeSelect';		
		workHeadDiv.appendChild( workTypeSelect );
		workTypeSelect.innerHTML = '☉';
		workTypeSelect.onclick = function(e) {
			if( !this.gntedit.treeEdit.workTypes ) {
				let mb = new MessageBox();
				mb.confirm(this.locale.msg('work_types_not_specified'));
				return; 
			}
			let cmenu = new ContextMenu({ fontSize: '12px' });
			let trigger = { elem: workTypeSelect, color: '#f0f0f0', backgroundColor: '#0f0f0f' };
			let items = [];
			const mfunc = function(workType) {
				workNameInput.value = workType.name;
				workTypeInput.value = workType.type;
			}
			for( let [k, v] of this.gntedit.treeEdit.workTypes ) {
				items.push([ v.name, mfunc, { name: v.name, type: k } ])
			} 
			cmenu.show( e, items, trigger );
		}.bind(this);

		let removeDiv = document.createElement('div');
		removeDiv.className = 'smartAttachRemove';
		workHeadDiv.appendChild( removeDiv );
		removeDiv.innerHTML = '✖';
		removeDiv.onclick = function(e) {
			this.worksDiv.removeChild(workDiv);
		}.bind(this);

		let settingsDiv = document.createElement('div')
		settingsDiv.className = 'smartAttachSettings';
		workDiv.appendChild( settingsDiv );

		let typesDiv = document.createElement('div');
		typesDiv.className = 'smartAttachTypes'
		settingsDiv.appendChild( typesDiv );
	
		const checkTypeMaterialCombination = function( input, tId, mId, props ) {
			if( !props.types || !props.materials ) return;
			for( let t of props.types ) {
				if( t.id != tId ) continue;
				if( mId === null && props.materials.length === 0 ) {
					input.checked = true;
					continue;
				}
				for( let m of props.materials ) {
					if( m.expressId != mId ) continue;
					input.checked = true;
					break;
				}
			}
		}

		for( let t of this.ifcTypes ) {
			if( this.ignoreTypes.indexOf(t.id) !== -1 ) continue;

			let typeDiv = document.createElement('div');
			typeDiv.className = 'smartAttachType';
			typesDiv.appendChild( typeDiv );

			let typeTitleDiv = document.createElement('div');
			typeTitleDiv.className = 'smartAttachTypeTitle';
			typeTitleDiv.innerHTML = t.name;
			typeDiv.appendChild( typeTitleDiv );

			let tmMap = this.ifc.treeView.typeMaterialCombinationsMap;
			if( t.id in tmMap && tmMap[t.id].size > 0 ) {
				let input = this.createTypeInput(typeDiv, t, null);
				checkTypeMaterialCombination( input, t.id, null, props );	// Check if props are given and valid
				if( t.id in tmMap ) {
					for( let mId of tmMap[t.id] ) {
						input = this.createTypeInput(typeDiv, t, mId);
						checkTypeMaterialCombination( input, t.id, mId, props );	// Check if props are given and valid
					}
				}
			} else {
				this.createTypeInput(typeDiv, t, null);
			}
		}
			
		expandDiv.onclick = function(e) {
			expandDiv.innerHTML = (settingsDiv.style.display !== 'block') ? '▽' : '▷';
			settingsDiv.style.display = (settingsDiv.style.display !== 'block') ? 'block' : 'none';
		}
		expandDiv.innerHTML = '▷';

		return workDiv;
	}

	createTypeInput( typeDiv, t, mId = null ) {
		let typeInput = document.createElement('input');
		typeInput.type = 'checkbox';
		typeInput.className = 'smartAttachTypeInput';
		typeInput.dataset.name = t.name;
		typeInput.dataset.id = t.id;
		if( mId !== null ) {
			typeInput.dataset.mid = mId;
		} else {
			typeInput.dataset.mid = 'null';
		}
		typeDiv.appendChild(typeInput);

		let typeName = document.createElement('div');
		typeName.className = 'smartAttachTypeName';
		if( mId !== null ) {
			typeName.innerHTML = this.ifc.treeView.materialsMap[mId];
			typeInput.onchange = function(e) {
				if( !e.target.checked ) return;
				this.uncheckNoMaterials(typeDiv);
			}.bind(this);
		} else {
			typeName.innerHTML = this.locale.msg('no_materials');
			typeInput.onchange = function(e) {
				if( !e.target.checked ) return;
				this.uncheckAllButNoMaterials(typeDiv);
			}.bind(this);
		}
		typeDiv.appendChild(typeName);
		return typeInput;
	}

	uncheckAllButNoMaterials( container ) {
		for( let child of container.children ) {
			if( child.dataset.mid !== 'null' ) {
				child.checked = false;
			}
		}
	}

	uncheckNoMaterials( container ) {
		for( let child of container.children ) {
			if( child.dataset.mid === 'null' ) {
				child.checked = false;
				break;
			}
		}
	}

	saveWorksIntoBrowser(saveWorkTypes=true) {
		/*
		let works = this.getWorksInWindow();
		localStorage.setItem(this.initer.smartAttachWorksStorageKey, JSON.stringify(works));
		*/
		if( saveWorkTypes ) {
			this.workTypesWindow.save();
		}
		let works = this.getWorksInWindow();
		let workTypes = [];
		if( this.gntedit.treeEdit.workTypes ) {
			this.gntedit.treeEdit.workTypes.forEach( (v, k) => {
				let workTypeData = { type:k, name: v.name, colorStr: v.colorStr }; 
				let work = this.findWorkByType(k, works);
				if( work !== null ) {
					workTypeData['ifcMaterials'] = work;
				}
				workTypes.push( workTypeData ); 
			} );
		}
		localStorage.setItem(this.initer.workTypesStorageKey, JSON.stringify(workTypes));
		//console.log('saving work types=', workTypes);
		this.messageDiv.innerHTML = this.locale.msg('smart_attach_works_saved')
	}

	restoreWorks() {
		/*
		this.removeWorks();
		let works = localStorage.getItem(this.initer.smartAttachWorksStorageKey);
		works = JSON.parse( works );
		console.log('Restoring works=', works);
		if( works ) {
			for( let w of works ) {
				let workDiv = this.createWorkEntry( w );
				this.worksDiv.appendChild( workDiv );
			}
		}
		*/
		let workTypes = localStorage.getItem(this.initer.workTypesStorageKey);
		if( workTypes ) {
			workTypes = JSON.parse( workTypes );
			//console.log('Restoring work types=', workTypes);
			this.gntedit.treeEdit.initWorkTypes( workTypes, true, false );	// Reset colors, do not reset work types from SP if exist
			this.ifc.setWorkTypesHighlights(this.gntedit.treeEdit.workTypes);
			if( !this.workTypesWindow.isHidden() ) {
				this.workTypesWindow.initTypeControls();
			} else {
				this.workTypesWindow.show();
			}
			this.removeWorks();
			this.createWorkDivsOutOfGnt();
			this.messageDiv.innerHTML = this.locale.msg('smart_attach_works_restored')
		}
	}

	removeWorks() {
		for( let i = this.worksDiv.children.length - 1 ; i >= 0 ; i-- ) {
			let childDiv = this.worksDiv.children[i];
			if( childDiv.className === 'smartAttachWork' ) {
				this.worksDiv.removeChild( childDiv );
			}
		}	
	}

	showNotSavedMessage() {
		this.messageDiv.innerHTML = this.locale.msg('smart_attach_works_not_saved')
	}
} 