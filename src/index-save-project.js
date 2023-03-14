import { MessageBox } from './messagebox'
import { uploadFile } from './index-helpers'
import { getSPWorkTypes } from './gntedit/treeedit-work-types'

async function sendWithValidation( url, msg, statusOnly=true ) 
{
	let r;
	try {
		r = await fetch( url, { method: 'POST', body: JSON.stringify(msg) } );
		r = await r.json();
		if( !r || !('errcode' in r) || r.errcode !== 0 ) {
			if( r && 'error' in r && r.error.length > 0) {
				return (statusOnly) ? r.error : {error: e.error, response: r};
			}
			let e = args.locale.msg('unknown_error');
			return (statusOnly) ? e : {error: e, response: r};
		}
	} catch(e) {
		e = (e) ? e : args.locale.msg('unknown_error');
		return (statusOnly) ? e : {error:e, response: r};
	}
	return (statusOnly) ? null : {error:null, response: r};
}

export function saveProject(args) {
	const mb = new MessageBox();
	args.mb = mb;
	
	if( args.ifc.ifcModel === null ) {
		args.mb.confirm( args.locale.msg('chooseargs.ifc') );
		return;
	}			
	args.mb.show( args.locale.msg('wait_creating_project') );

	setTimeout( async function() { save( args ) }, 50 );
}


async function save( args ) 
{
	let code = args.icontrols.getProjectName();
	let version = args.icontrols.getProjectVersion();

	// Verifying if a project with this name already exists
	let r = await sendWithValidation( 
		args.initer.projectExistsUrl, { Code: code, Version: version }, false 
	);
	if( r.error !== null ) {
		args.mb.confirm( r.error );	
		return;
	}
	if( r.response.exists == 1 ) {
		let mb = new MessageBox()
		mb.ask( 
			(action) => {
				if( action === 0 ) {
					args.mb.hide();
					return;
				}
				setTimeout( () => { sendProjectData(args, code, version, 'update'); }, 50 );				
			},
			args.locale.msg('ask_project_already_exists') 
		);	
	} 
	else {
		sendProjectData(args, code, version, 'create');
	}
}

async function sendProjectData(args, code, version, action) 
{
	let projectData = await readProjectData( args, code, version );
	if( projectData === null ) {
		args.mb.confirm( args.locale.msg('create_project_error') );	
		return;
	}

	let errorMessage = args.locale.msg('success');

	let ver = String(version);
	while (ver.length < 3) { 
		ver = '0' + ver;
	}
	let projectFileName = `${code}.${ver}.sprj`;

	let msg, err;
	try {
		if( action === 'create' ) {
			err = await sendWithValidation( args.initer.createProjectUrl, projectData );
			if( err !== null ) {
				throw( args.locale.msg('create_project_error') + "<br/>" + err );
			} 

			// *** Loading and saving the ifc file
			if( args.icontrols.ifcFileUploaded && args.initer.settings.exportIfcFile ) {
				let ifcContent = await uploadFile( args.icontrols.file.files[0] );
				if( ifcContent === null ) {
					throw( args.locale.msg('create_project_error') );
				}
				msg = { 
					sessId: args.initer.sessId, fileName: projectFileName, 
					ifcFileName: args.ifc.fileName, ifc: ifcContent 
				};
				err = await sendWithValidation(args.initer.setIfcUrl, msg );
				if( err !== null ) {
					throw( args.locale.msg('create_project_error') + "<br/>" + err );
				} 
			}

			let types = getSPWorkTypes( args.gntedit.treeEdit );
			if( types && types.length > 0 ) {
				msg = { 
					sessId: args.initer.sessId, fileName: projectFileName, 
					table:'TypeDescr', array: types 
				};
				err = await sendWithValidation(args.initer.setTableUrl, msg );
				if( err !== null ) {
					throw( args.locale.msg('create_work_types_table_error') + "<br/>" + err );
				} 
			}
		} else {
			// Updating activities (setTable)
			msg = { 
				sessId: args.initer.sessId, fileName: projectFileName, 
				table:'Activity', array: projectData.activities
			};	
			err = await sendWithValidation(args.initer.setTableUrl, msg );
			if( err !== null ) {
				throw( args.locale.msg('save_project_error') + "<br/>" + err );
			} 
			if( projectData.materials && projectData.materials.length > 0 ) {		// Saving materials if exist
				msg = { 
					sessId: args.initer.sessId, fileName: projectFileName, 
					table:'Material', array: projectData.materials
				};
				err = await sendWithValidation(args.initer.setTableUrl, msg );
				if( err !== null ) {
					throw( args.locale.msg('save_project_error') + "<br/>" + err );
				} 
			}

			let types = getSPWorkTypes( args.gntedit.treeEdit );
			if( types && types.length > 0 ) {
				msg = { sessId: args.initer.sessId, fileName: projectFileName, 
					table:'TypeDescr', array: types 
				};
				err = await sendWithValidation(args.initer.setTableUrl, msg );
				if( err !== null ) {
					throw( args.locale.msg('create_work_types_table_error') + "<br/>" + err );
				} 
			}

			// *** Loading and saving the ifc file
			if( args.initer.filePickerEnabled && args.icontrols.ifcFileUploaded && args.initer.settings.exportIfcFile ) 
			{
				let ifcContent = await uploadFile( args.icontrols.file.files[0] );
				if( ifcContent === null ) {
					throw( args.locale.msg('create_project_error') );
				}
				msg = { 
					sessId: args.initer.sessId, fileName: projectFileName, 
					ifcFileName: args.ifc.fileName, ifc: ifcContent 
				};
				err = await sendWithValidation(args.initer.setIfcUrl, msg );
				if( err !== null ) {
					throw( args.locale.msg('create_project_error') + "<br/>" + err );
				} 
			}

		}
	}
	catch(e) {
		errorMessage = (e) ? e : args.locale.msg('save_project_error');
		return;
	}
	finally {
		args.mb.confirm(errorMessage);
		return;
	}
}

async function readProjectData( args, code, version ) {
	let expressId = args.ifc.treeView.rootDiv.dataset.expressId;
	if(!expressId) return null;

	let info = await args.ifc.getItemInfo(parseInt(expressId));
	let exportProject = { 
		Code: code, Name: ((!args.initer.projectId) ? info.Name : undefined), Version: version 
	};

	let level=0;
	let exportActivities = [];
	let materialsMap = args.ifc.treeView.materialsMap; // {}; 
	//let exportActivitiesMaterials = [];	
	let rootNode = args.gntedit.treeEdit.rootNode;

	const doNode = async function( node, level ) {
		level++;
		let activity = { Level: level };
/*
		if( node.parent === null ) {
			if( !node.spCode ) node.spCode = node.id;
		} else {
			if( !node.spCode ) node.spCode = node.parent.spCode + '_' + node.id;
		}
*/
		if( typeof(node.spCode) === 'undefined' || node.spCode === null ) node.spCode = node.id;
		activity.Code = node.spCode;
		activity.parent = (node.parent) ? node.parent.spCode : undefined;
		activity.Name = node.titleDiv.innerText;
		if( (!node.children || !node.children.length) && node.spType ) {
			activity.Type = node.spType
		}
		let ids = args.ifc.getAttachedIds(node.id); 	// The IFC elements attached    // args.ifc.attachments.map[node.id];
		let attachedMaterials = args.ifc.getAttachedMaterials(node.id); 	// If a material layer is attached     //(node.id in args.ifc.attachments.materialMap) ? args.ifc.attachments.materialMap[node.id] : null;
		if( ids ) {
			let f_Model = ids.join();
			activity.f_Model = f_Model;
			if( !node.children || !node.children.length ) {
				await readActivityMaterialsFromIfc( args, activity, ids, attachedMaterials );
			}
		}
		exportActivities.push( activity );
		for( let c of node.children ) {
			await doNode(c, level);
		}
	}
	await doNode( rootNode, level );

	let exportMaterials = [];
	for( let k in materialsMap ) {
		exportMaterials.push( { Code: k, Name: materialsMap[k] } );
	}

	return { 
		project: exportProject, activities: exportActivities, materials: exportMaterials //, activitiesMaterials: exportActivitiesMaterials 
	};
}

async function readActivityMaterialsFromIfc( args, activity, ids, attachedMaterials ) 
{
	// attachedMaterials===null/undefined: all materials, attachedMaterials = [-1]: Ignore materials
	if( !attachedMaterials || attachedMaterials.length === 0 ) {
		activity['f_Materials'] = '';		// Ignore materials	
		return;		
	}

	let fLayer = new Set(); 	// To store attached layer materials in

	let totalVolume = 0;
	let mVolumes = {};
	for( let i = 0 ; i < ids.length ; i++ ) {
		let data = await readItemData( args, ids[i] );
		if( data === null ) continue;

		if( 'volume' in data ) {
			totalVolume += data.volume;
		}
		//console.log('mVolumes:', mVolumes)
		if( 'mVolumes' in data ) { 	// { material id: volume }
			for( let materialId in data.mVolumes ) {
				if( attachedMaterials[0] !== -1 ) {
					if( !(attachedMaterials.indexOf(Number(materialId)) >= 0) ) {
						continue;		// If materialId is not found among materials attached - continue;
					} 
				}
				if( materialId in mVolumes ) {
					mVolumes[ materialId ] += data.mVolumes[ materialId ];
				} else {
					mVolumes[ materialId ] = data.mVolumes[ materialId ];
				}
				if( !fLayer.has(materialId) ) {
					fLayer.add( materialId );
				}
			}
		}
	}
	if( fLayer.size > 0 ) {			// If layer materials are involved...
		activity.f_Materials = Array.from(fLayer).join(',');		// ...creating the "f_Materials" column for SP
	}

	//if( totalVolume > 0 ) {
	//	activity.VolPlan = totalVolume;
	//}
	for( let id in mVolumes ) {	// 
		// activitiesMaterials.push( { OperCode: activity.Code, MatCode: id, Fix: mVolumes[id] } );
		let k = 'm_fix_' + id;
		activity[k] = mVolumes[id];
	}
}

async function readItemData( args, id ) {
	data = {};
	let info = await args.ifc.getItemInfo( id, true );
	//console.log('info:', info);
	if( args.initer.settings.netVolumeKey in info ) {
		data.volume = info[args.initer.settings.netVolumeKey];
	}
	if( '__materials' in info ) {
		data.mVolumes = {}; // { material id: volume }
		//console.log('info.__materials=', info.__materials);
		for( let m of info.__materials ) { 	// m[0] - expressId, m[1] - name, n[2] - thickness
			let expressId = m[0];
			let props = await args.ifc.getItemProperties( expressId, false );
			//console.log('props:', props);
			let materialGlobalId = ( props && props.length >= 2 && props[1] !== null ) ? props[1] : expressId;
			// if( !(materialGlobalId in materialsMap) ) {
			//	 materialsMap[materialGlobalId] = m[1]; 	
			// }
			if( m[2] ) {
				data.mVolumes[materialGlobalId] = m[2];
			}
		}
	}
	return data;
}
