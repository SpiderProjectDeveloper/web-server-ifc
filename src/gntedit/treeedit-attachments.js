import { ContextMenu } from '../contextmenu';
import { colorNumToStr } from "./treeedit-work-types";

export class TreeEditAttachments 
{
	constructor( treeedit ) 
	{
		this.treeedit = treeedit;
		this.nodeMap = treeedit.nodeMap;
		this.map = {}; 		// i:interger (activity node id) => ids:array  
		//this.typeMap = {};		// i:interger (activity node id) => type:string
		// attachedMaterials===null/undefined: all materials, attachedMaterials = [-1]: Ignore materials
		this.materialMap = {};		// i:interger (activity node id) => [materialId, materialId]:integer
		this.materialsNames = {}; // materialId:integer => name:string
		//this.selectedActivity = -1;
		//this.selectedActivityType = -1; 
	}

	copyWithIds( activityIdFrom, activityIdTo, expressIds ) 
	{
		this.map[activityIdTo] = [];
		for( let eid of expressIds ) { 
			this.map[activityIdTo].push(eid);
		}
		this.materialMap[activityIdTo] = [];
		if( this.materialMap[activityIdFrom] ) {
			for( let mid of this.materialMap[activityIdFrom] ) {
				this.materialMap[activityIdTo].push( mid );
			}
		}
		this.displayProperties(activityIdTo);
	}

	getSelectedActivity() {
		return this.treeedit.highlightedId;
	}

	getSelectedActivityType() {
		let id = this.treeedit.highlightedId;
		if( id in this.map ) {
			let node = this.nodeMap[id];
			if( 'spType' in node && node.spType !== null ) {
				return node.spType;
			}
		}
		return -1;
	}

	displayProperties( nodeId ) {
		if( !(nodeId in this.nodeMap) || this.nodeMap[nodeId] === null ) {
			return;
		}
		let node = this.nodeMap[nodeId];
		while( node.propertiesDiv.firstChild ) {
			node.propertiesDiv.removeChild( node.propertiesDiv.lastChild );
		}

		let ids = (nodeId in this.map ) ? this.map[nodeId] : null;
		if( !ids || ids.length === 0 ) {
			return;
		}

		let attachmentsDiv = document.createElement( 'div' );
		attachmentsDiv.className = 'tree-edit-node-attachments-div';
		node.propertiesDiv.appendChild(attachmentsDiv);

		let materials = (nodeId in this.materialMap) ? this.materialMap[nodeId] : null;

		attachmentsDiv.innerText = ids.length;
		if( materials && materials.length > 0 ) {
			if( materials[0] !== -1 ) {		// Not an 'ignore material' mark ("-1")
				let text = '', title = '';
				for( let i = 0 ; i < materials.length ; i++ ) {
					let m = materials[i];
					text += this.materialsNames[m].substring(0, 1);
					title += ( (i > 0) ? ',' : '') + this.materialsNames[m];
				}
				attachmentsDiv.innerText += ' ' + '⚍' + text; 
				attachmentsDiv.title = title;
			} else {		// Ignore materias ? 
				attachmentsDiv.innerText += ' ' + '⅀⚍' // '☑' '☐';
				attachmentsDiv.title = this.treeedit.locale.msg('all_materials');
			}
		} else {
			attachmentsDiv.title = ids.length;
		}

		let workTypeDiv = document.createElement('div');
		workTypeDiv.className = 'tree-edit-node-work-type-div';
		node.propertiesDiv.appendChild(workTypeDiv);
		workTypeDiv.innerHTML = '■'; // '♦⚑✦'; 	// ☉
		if( this.treeedit.workTypes ) {
			const setWorkTypeDisplay = function(elem, type) {
				if( !this.treeedit.workTypes.has(type) ) return;
				elem.style.color = colorNumToStr( this.treeedit.workTypes.get(type).colorNum );
				elem.title = `${type}: ${this.treeedit.workTypes.get(type).name}`;
			}.bind(this);

			let type = node.spType;
			if( type && this.treeedit.workTypes.has(type) ) {
				setWorkTypeDisplay(workTypeDiv, type);
			}
			workTypeDiv.addEventListener( 'mouseup', function(e) {
				if( !this.treeedit.workTypes ) return;
				let cmenu = new ContextMenu( { fontSize: '12px', style: { padding:'8px' } } );
				const cb = function( workTypeCode ) {
					node.spType = workTypeCode;
					setWorkTypeDisplay(workTypeDiv, workTypeCode);
				}.bind(this);
				let items=[];
				for( let [k, v] of this.treeedit.workTypes ) {
					let style = (k === node.spType) ? `font-weight:bold` : null;
					items.push([ `${k}: ${v.name}`, cb, k, style ]);
				}
				cmenu.show( e, items, null, null );
			}.bind(this) );
		}
	}

	assignMaterial(keyTo, materialId=null, materialName=null) {
		if( materialId === null ) return;
		if( keyTo in this.materialMap ) 	// If the activity node Id is already assigned - removing it
		{
			let mIndex = this.materialMap[keyTo].indexOf(materialId);
			if( mIndex >= 0 ) {
				this.materialMap[keyTo].splice( mIndex, 1 );
				return;
			}
		} else 	// If the activity node Id is not assigned - adding an empty array to push into
		{
			this.materialMap[keyTo] = [];
		}
		if( materialId === -1 ) {		// If 'ignore material' is added - removing all the others...
			this.materialMap[keyTo] = [];
		} else {	// If 'ignore materials' is previously added - removing it...
			if( this.materialMap[keyTo].length === 1 && this.materialMap[keyTo][0] === -1 ) {
				this.materialMap[keyTo] = [];
			}
		}
		this.materialMap[keyTo].push( materialId );
		if( !materialName ) {
			materialName = (materialId !== -1) ? String(materialId) : '';
		}
		if( !(materialId in this.materialsNames) ) {
			this.materialsNames[materialId] = materialName;
		}
	}

	assign( ids, keyTo, materialId=null, materialName=null, update=true ) {
		this.map[keyTo] = ids;
		this.assignMaterial( keyTo, materialId, materialName);
		if( update) {
			this.displayProperties(keyTo);
		}
	}

	copy( keyFrom, keyTo, material=null, materialName=null ) {
		if( keyFrom === null ) {	// If keyFrom is null - taking from the currently selected data item (could be "-1" as well)
			keyFrom = this.getSelectedActivity();
		}
		if( !(keyFrom in this.map) || !(this.map[keyFrom].length > 0) ) return;

		if( keyTo !== keyFrom ) {		// A material layer might be re-copied of the same activity 
			this.map[keyTo] = [];
			for( let item of this.map[keyFrom] ) {
				this.map[keyTo].push( item );
			}
		}
		if( material !== null ) {
			this.assignMaterial( keyTo, material, materialName);
		}
		this.displayProperties( keyTo );
	}

	getMaterialsNames(key) {
		if( !(key in this.materialMap) ) return [ null, null ];
		return [ this.materialMap[key], this.materialsNames ];
	}

	push( key, value ) {
		if( key === null ) {
			key = this.getSelectedActivity();
		}
		if( !(key in this.map) ) {
			this.map[key] = [];
		}
		this.map[key].push(value);
		this.displayProperties( key );
	}

	remove( key, value ) {
		if( key === null ) {
			key = this.getSelectedActivity();
		}
		if( !(key in this.map) ) return;
		let index = this.map[key].indexOf(value);
		if (index === -1) return;
		this.map[key].splice(index, 1);
		let ids = this.map[key];
		if( ids.length === 0 ) {
			delete this.map[key];
			ids = null;
			if( key in this.materialMap ) { 
				delete this.materialMap[key];
			}
		}	
		this.displayProperties( key );	
	}

	clear( key ) {
		if( !(key in this.map) ) return;
		delete this.map[key];
		if( key in this.materialMap ) {
			delete this.materialMap[key];
		}
		this.displayProperties( key );
	}

	getAttached( key ) {
		if( key === null ) {
			key = this.getSelectedActivity();
		}
		if( !(key in this.map) ) {
			return [];
		}
		return this.map[key];
	}

	getMaterials( key ) {
		if( key === null ) {
			key = this.getSelectedActivity();
		}
		if( !(key in this.map) ) {
			return [];
		}
		return [ this.materialMap[key], this.materialsNames ];
	}

	// Given a work type returns a set of ids attached to data items with this type
	/*
	getAttachedToWorkType(type, ignore=null) {	
		let attachedSet = new Set();

		for( let i in this.map ) {	// key == i-th data
			if( i == ignore ) continue;
			if( !(i in this.typeMap) ) continue;
			if( this.typeMap[i] !== type ) continue;
			this.map[i].forEach( id => { attachedSet.add(id); } );
		}	
		return attachedSet;
	}
	*/
}
