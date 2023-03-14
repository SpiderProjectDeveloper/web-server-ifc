
export class IfcActivitiesAttachments {
	constructor() {
		this.map = {}; 		// i:interger (data item index) => ids:array  
		//this.typeMap = {};		// i:interger (activity node id) => type:string
		// attachedMaterials===null/undefined: all materials, attachedMaterials = [-1]: Ignore materials
		this.materialMap = {};		// i:interger (activity node id) => [materialId, materialId]:integer
		this.materialsNames = {}; // materialId:integer => name:string
		this.selectedActivity = -1;
		this.selectedActivityType = -1; 
		this.updateCallback = null;
	}

	getSelectedActivity() {
		return this.selectedActivity;
	}

	getSelectedActivityType() {
		return this.selectedActivityType;
	}

	setUpdateCallback(cb) {
		this.updateCallback = cb;
	}

	assignMaterial(keyTo, materialId=null, materialName=null) {
		if( materialId === null ) return;
		if( keyTo in this.materialMap ) {
			let mIndex = this.materialMap[keyTo].indexOf(materialId);
			if( mIndex >= 0 ) {
				this.materialMap[keyTo].splice( mIndex, 1);
				return;
			}
		} else {
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
		if( this.updateCallback && update) {
			this.updateCallback( keyTo, 
				{ ids: this.map[keyTo], materials: this.materialMap[keyTo], materialsNames: this.materialsNames } 
			);
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

		if( this.updateCallback ) { 
			this.updateCallback( keyTo, 
				{ ids:this.map[keyTo], materials:this.materialMap[keyTo], materialsNames:this.materialsNames } 
			);
		}
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
		if( this.updateCallback ) {
			this.updateCallback( key, 
				{ ids: this.map[key], materials: this.materialMap[key], materialsNames: this.materialsNames } 
			);
		}
	}

	remove( key, value ) {
		if( key === null ) {
			key = this.selectedActivity;
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
		if( this.updateCallback ) { 
			this.updateCallback( key, 
				{ ids: ids, materials: this.materialMap[key], materialsNames: this.materialsNames } 
			);
		}
	}

	clear( key ) {
		if( !(key in this.map) ) return;
		delete this.map[key];
		if( key in this.materialMap ) {
			delete this.materialMap[key];
		}
		if( this.updateCallback ) this.updateCallback( key, 
			{ ids: this.map[key], materials: null, materialNames: null } 
		);
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
