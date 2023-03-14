import { IFCBUILDINGSTOREY } from 'web-ifc';

export async function restoreAttachments( adata, gntedit, ifc ) 
{
	let data = adata.data;

	const levelToNumber = function(level) 
	{
		if( typeof(level) !== 'undefined' && level !== null ) {
			let n = Number(level);
			if( !isNaN(n) ) return n;
		}
		return null;
	}

	let act0 = data.activities[0];
	gntedit.setRootNodeProps( { title: act0.Name, spCode: act0.Code, spLevel: Number(act0.Level) } );
	let hStack = [ gntedit.treeEdit.rootNode ];
	for( let i = 1 ; i < data.activities.length ; i++ ) {
		let act = data.activities[i];
		let parentNode = hStack[hStack.length-1];
		let aLevel = act.Level;
		let nLevel = levelToNumber(aLevel);
		if( nLevel !== null ) {
			aLevel = nLevel;
		}
		let isOp = (nLevel === null ) ? true : false;
		if( !isOp ) {
			while( true ) {
				if( typeof(parentNode.spLevel) !== 'number') break;
				if( aLevel <= parentNode.spLevel ) {
					hStack.pop();
					if( hStack.length === 0 ) break;
					parentNode = hStack[hStack.length-1];
				} else {
					break;
				}
			}
		}
		let node = gntedit.appendNode( parentNode, 
			{ title: act.Name, spCode: act.Code, spLevel: aLevel, spType: act.Type }
		);
		if( isOp ) {
			if( act.f_Model && act.f_Model.length > 0 ) {
				let ids = act.f_Model.split(',').map(Number);
				if( ids !== null && ids.length && ids.length > 0 ) {
					if( act.f_Materials ) {
						let materialLayers =  await ifc.getMaterialLayersOfElements(ids); // { mid=>mname, mid=>mname }
						let materialsIds = act.f_Materials.split(',').map(Number);
						for( let im = 0 ; im < materialsIds.length ; im++ ) {
							let mid = materialsIds[im];	
							if( isNaN(mid) ) continue;
							let mname = (mid in materialLayers) ? materialLayers[mid] : null;
							ifc.attachToActivity( 
								node.id, ids, mid, mname, (im === materialsIds.length-1) ? true : false 
							);
						}
					} else {
						ifc.attachToActivity( node.id, ids );
					}
				}
			}
		}
		if( !isOp ) {
			hStack.push( node );
		} 
	}

	gntedit.setNodeCounter( adata.maxNumbericalCode );
}


export async function uploadFile( file ) {

	const upload = async function ( file) {
		return new Promise( (resolve, reject) => {
			let reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = function (evt) {
				resolve( evt.target.result );
			}
			reader.onerror = function (evt) {
				reject( "Error reading file" );
			}
		});   	
	}

	try {
		let r = await upload(file);
		return r;
	} catch(e) {
		return null;
	}
}

export async function smartAttach( ifc, gntedit, works ) {
	// console.log(works);
	let storeysIds = await ifc.ifcLoader.ifcManager.getAllItemsOfType(
		ifc.ifcModel.modelID, IFCBUILDINGSTOREY, false 
	);

	let numStoreys = 0;
	let numOperations = 0;
	for( let storeyId of storeysIds ) {			// Taking all the storeys one by one 
		//let iprops = await ifc.ifcLoader.ifcManager.getItemProperties(ifc.ifcModel.modelID, storeyId, false);
		//let title = (iprops.Name) ? iprops.Name.value : `IFCBUILDINGSTOREY${numStoreys+1}`; 
		let iprops = await ifc.getItemProperties(storeyId);
		let title = (iprops[0] !== '') ? iprops[0] : `IFCBUILDINGSTOREY${numStoreys+1}`; 
		let gntStoreyNode = gntedit.appendNode( gntedit.treeEdit.rootNode, { title: title } );

		for( let work of works ) {		// Iterating over works specified
			let ids = [];
			const doNode = function( node ) {		
				if( node.children && node.children.length > 0 ) {
					for( let n of node.children ) {
						doNode( ifc.treeView.idMap[n] );
					} 				
				} else {
					for( let type of work.types ) {
						if( node.type === type.name ) {
							ids.push(node.expressId);
						}
					}
				}
			}
			doNode( ifc.treeView.idMap[ storeyId ] );	// Reading recursively the sub-nodes of a storey  
			let gntNode = gntedit.appendNode( gntStoreyNode, 
				{ title: work.name, spType: work.workType } 
			);
			numOperations += 1;
			if( work.materials && work.materials.length > 0 ) {
				for( let i = 0 ; i < work.materials.length ; i++ ) {
					let mId = Number(work.materials[i].expressId);
					let mName = work.materials[i].name;
					ifc.attachToActivity( gntNode.id, ids, mId, mName );
				}
			} else {
				ifc.attachToActivity( gntNode.id, ids, null, null );
			}
		}
		numStoreys += 1;
	}
	return { numStoreys: numStoreys, numOperations: numOperations };
}

//let node = gntedit.appendNode( parentNode, {title: act.Name, spCode: act.Code, spLevel: aLevel} );
