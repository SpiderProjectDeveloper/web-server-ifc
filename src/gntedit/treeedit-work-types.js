export function colorNumToStr( colorNum ) {
	if( typeof(colorNum) === 'undefined' || colorNum === null ) {
		return '#707070';
	}
	return '#' +  colorNum.toString(16).padStart(6, '0');
}

function colorStrToNum( c ) {
	let cn = Number('0x'+c.substr(1,2))*256*256 + Number('0x'+c.substr(3,2))*256 + Number('0x'+c.substr(5,2));
	return cn;
}

export function initWorkTypesOutOfSPData( treeedit, adata ) {
	treeedit.workTypes = new Map();
	if( !('types' in adata.data) || !adata.data.types.length ) {
		return null;
	}

	for( let item of adata.data.types ) {
		let type = item['Type'];
		let c = parseInt(item['Color']); // This is the SP format: "bgr"
		let colorNum = (c&0x0000ff)*256*256 + ((c&0x00ff00)>>8)*256 + ((c&0xff0000)>>16);
		let colorStr = colorNumToStr(colorNum);
		let typeData = { colorNum: colorNum, colorStr: colorStr, name: item['TypeName'] };
		if( 'f_IfcMaterials' in item ) {
			typeData['ifcMaterials'] = type['f_IfcMaterials'];
		}
		treeedit.workTypes.set( type, typeData ); 
	}
}

export function initWorkTypes( treeedit, workTypes, resetColorsInTree=false, resetWorkTypes=true ) {
	if( resetWorkTypes || treeedit.workTypes === null ) {
		treeedit.workTypes = new Map();
	} 
	if( !workTypes  ) {
		return null;
	}

	for( let i = 0 ; i < workTypes.length ; i++ ) {
		let w = workTypes[i];
		let type = w.type;
		let typeData;
		if( resetWorkTypes === false && treeedit.workTypes.has(type) ) {
			typeData = treeedit.workTypes.get(type);
			treeedit.workTypes.delete(type);
		} else {
			let name = w.name;
			let colorStr = w.colorStr;
			let colorNum = colorStrToNum(colorStr);
			typeData = { colorNum: colorNum, colorStr: colorStr, name: name } 
		}
		if( 'ifcMaterials' in w ) {
			typeData['ifcMaterials'] = w['ifcMaterials'];
		} 
		treeedit.workTypes.set( type, typeData );
	}

	if( resetColorsInTree ) {
		let rootNode = treeedit.rootNode;
		const doNode = function( node ) {
			if( !node.children || node.children.length === 0 ) {	// An operation - no children
				treeedit.attachments.displayProperties( node.id );
			} else {
				for( let c of node.children ) {
					doNode(c);
				}
			}
		}
		doNode( rootNode );		
	}
}


export function getSPWorkTypes( treeedit ) {
	let spWorkTypes = [];
	if( treeedit.workTypes ) {
		for( let [type, typeData] of treeedit.workTypes ) {
			let c = typeData.colorNum;
			let spColor = (c&0x0000ff)*256*256 + ((c&0x00ff00)>>8)*256 + ((c&0xff0000)>>16)
			let spTypeData = { Type: type, TypeName: typeData.name, Color: spColor }
			if( 'ifcMaterials' in typeData ) {
				spTypeData['f_IfcMaterials'] = typeData['ifcMaterials'];
			}
			spWorkTypes.push(spTypeData);
		}
	}
	return spWorkTypes;
}
