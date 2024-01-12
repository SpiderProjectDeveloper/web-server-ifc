import './ifc.css';
import {
  AmbientLight, AxesHelper, DirectionalLight, GridHelper, PerspectiveCamera, 
	Scene, WebGLRenderer, LoadingManager, Raycaster, Vector2, MeshLambertMaterial, 
} from "three";
import {
	acceleratedRaycast, computeBoundsTree, disposeBoundsTree
} from 'three-mesh-bvh';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { IFCTreeView } from './ifctreeview';
import { TooltipWindow } from './tooltipwindow';
import { CheckListWindow } from './checklistwindow';
import { MessageBox } from './messagebox';
import { IfcActivitiesAttachments } from './ifcactivitiesattachments';
import { isoToUtf8 } from './ifc-helpers';
import { SectioningTool } from './sectioning_tool.js';

const SECTIONING_TOOL_PICKABLE_LAYER = 10;
const SECTIONING_TOOL_NONPICKABLE_LAYER = 11;

export class Ifc 
{
	constructor( locale, initer, treeViewElem, options ) 
	{
		this.locale = locale;
		this.initer = initer;
		this.treeViewElem = treeViewElem;
		this.options = options;
		this.pickColor = (options.pickColor) ? options.pickColor : 0xff88ff;
		this.checkColor = (options.checkColor) ? options.checkColor : 0x88ff88;
		this.highlightColor = (options.highlightColor) ? options.highlightColor : 0xeeffee; // Bkgr highlight when context menu is called
		this.modelColor = (options.modelColor) ? options.modelColor : null;
		this.modelOpacity = (options.modelOpacity) ? options.modelOpacity : 1.0;
			
		this.attachments = new IfcActivitiesAttachments();
		this.highlightAttachedMat = null;

		this.messageBox = new MessageBox();

		this.tooltipWindow = new TooltipWindow( null, 
			{ title:this.locale.msg('picked_element'), x:Math.floor( window.innerWidth/10), y:Math.floor( window.innerHeight/4) }
		);

		this.typesListWindow = new CheckListWindow( null, 
			{ title: this.locale.msg('select_by_type'), okButton: { callback: this.typesListCallback.bind(this), arg:null } } 
		);

		this.treeView = null;

		this.scene = new Scene();
		this.ifcModel = null;

		//Creates the camera (point of view of the user)
		this.camera = new PerspectiveCamera(50, initer.canvasW / initer.canvasH);
		this.camera.position.z = 25;
		this.camera.position.y = 25;
		this.camera.position.x = 15;

		//Creates the lights of the scene
		const lightColor = 0xffffff;

		this.ambientLight = new AmbientLight(lightColor, 0.5);
		this.scene.add(this.ambientLight);

		this.directionalLight = new DirectionalLight(lightColor, 1);
		this.directionalLight.position.set(0, 10, 0);
		this.directionalLight.target.position.set(-5, 0, 0);
		this.scene.add(this.directionalLight);
		this.scene.add(this.directionalLight.target);

		//Sets up the renderer, fetching the canvas of the HTML
		this.threeCanvas = initer.canvasElem;
		this.threeCanvas.onmousedown = this.onMouseDown.bind(this);
		this.threeCanvas.onmousemove = this.onMouseMove.bind(this);
		this.renderer = new WebGLRenderer({ canvas: this.threeCanvas, alpha: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(initer.canvasW, initer.canvasH);

		//Creates grids and axes in the scene
		this.grid = new GridHelper(200, 20, 0xcfcfcf, 0xcfcfcf);
		this.scene.add(this.grid);

		this.axes = new AxesHelper();
		this.axes.material.depthTest = false;
		this.axes.renderOrder = 1;
		this.scene.add(this.axes);

		//Creates the orbit controls (to navigate the scene)
		this.controls = new OrbitControls(this.camera, this.threeCanvas);
		this.controls.enableDamping = true;
		this.controls.target.set(-2, 0, 0);

		this.sectioningTool = new SectioningTool( this.scene, SECTIONING_TOOL_PICKABLE_LAYER, SECTIONING_TOOL_NONPICKABLE_LAYER, );

		//Animation loop
		this.animate = function() {
			this.controls.update();
			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(this.animate);
		}.bind(this);
		this.animate();

		//Sets up the IFC loading
		const onload = function() {
			//console.log('loaded!');
		};
		const onprogress = function(url, loaded, total) {
			//console.log('progress:', url, loaded, total );
		};
		const onerror = function(e) {
			//console.log('error', e);
		};

		this.loadManager = new LoadingManager( onload, onprogress, onerror );

		this.ifcLoader = new IFCLoader(this.loadManager);
		this.ifcLoader.ifcManager.setupThreeMeshBVH(
			computeBoundsTree, disposeBoundsTree, acceleratedRaycast
		);

		this.raycaster = new Raycaster();
		this.raycaster.firstHitOnly = true;
		this.mouse = new Vector2();

		if( this.modelColor ) {
			this.modelMat = new MeshLambertMaterial({
				transparent: true, opacity: this.modelOpacity, color: this.modelColor
			});			
		} else {
			this.modelMat = null;
		}

		 // Creates subset material
		this.pickMat = new MeshLambertMaterial(
			{ transparent: false, opacity: 0.5, color: this.pickColor, depthTest: false } 	// { transparent: true, opacity: 0.95, color: this.pickColor, depthTest: false }
		);
		this.pickSubset = null;

		this.attachMats = null;
		this.attachMat = new MeshLambertMaterial(
			{ transparent: true, opacity: 0.5, color: this.checkColor, depthTest: false }
		);
		this.activeAttachMat = this.attachMat;
		this.attachSubset = null;

		this.highlightAttachedMat = new MeshLambertMaterial(
			{ transparent: true, opacity: 0.50, color: 0xffaaaa, depthTest: true }
		);
		this.highlightAttachedSubset = null;

		this.visibleMat = new MeshLambertMaterial({ 
			transparent: false, opacity: 0.75, // this.modelOpacity, 
			color: ( (this.modelColor) ? this.modelColor : 0x404040), depthTest: false 
		});
		this.visibleSubset = null;
		this.hideMat = new MeshLambertMaterial({ transparent: true, opacity: 0.0 });

		// Settings the pick mode (should be PICK_MODE_MODEL by default)
		this.initer.setStoreyTemplateSwitchCallback( () => { this.modeSwitcher(); } );
		this.modeSwitcher();
	}

	async setCoordsToOrigin() 
	{
		await this.ifcLoader.ifcManager.applyWebIfcConfig({ COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true });
	}

	setAttachmentsUpdateCallback( cb ) 
	{
		this.attachments.setUpdateCallback(cb);
	}

	setWorkTypesHighlights(workTypes) 
	{
		this.attachMats = {};
		for( let [k, v] of workTypes ) {
			let m = new MeshLambertMaterial(
				{ transparent: true, opacity: 0.75, color: v.colorNum, depthTest: false }
			);
			this.attachMats[k] = m;
		}
		this.attachMats[-1] = this.attachMat;
		this.activeAttachMat = this.attachMats[-1];
	}

	modeSwitcher() 
	{
		if( this.initer.storeyTemplateSwitchOn ) {
			this.raycaster.layers.disable( 1 );
			this.raycaster.layers.enable( SECTIONING_TOOL_PICKABLE_LAYER );
			this.controls.enabled = false;

			this.camera.layers.enable(SECTIONING_TOOL_PICKABLE_LAYER);	// For SectioningTool
			this.camera.layers.enable(SECTIONING_TOOL_NONPICKABLE_LAYER);	// For SectioningTool	
		} else {
			this.raycaster.layers.enable( 1 );
			this.raycaster.layers.disable( SECTIONING_TOOL_PICKABLE_LAYER );
			this.controls.enabled = true;

			this.camera.layers.disable(SECTIONING_TOOL_PICKABLE_LAYER);	// For SectioningTool
			this.camera.layers.disable(SECTIONING_TOOL_NONPICKABLE_LAYER);	// For SectioningTool
		}
	}

	calcMouseXY( event ) 
	{
		const bounds = this.threeCanvas.getBoundingClientRect();
		const x1 = event.clientX - bounds.left;
		const x2 = bounds.right - bounds.left;
		this.mouse.x = (x1 / x2) * 2 - 1;
		const y1 = event.clientY - bounds.top;
		const y2 = bounds.bottom - bounds.top;
		this.mouse.y = -(y1 / y2) * 2 + 1;
	}

	onMouseMove( event ) 
	{
		if( !this.initer.storeyTemplateSwitchOn ) return;

		if( !this.sectioningTool.isCaptured() ) return; 

		this.raycaster.setFromCamera(this.mouse, this.camera); // Places it on the camera pointing to the mouse

		this.sectioningTool.onMouseMove( this.raycaster );
		
		this.calcMouseXY( event );
	}

	onMouseDown(event) 
	{
		let e = event || window.event; // If the right button pressed - no picking as well
		let isRightButton = ("which" in e && e.which === 3) || ("button" in e && e.button === 2); 

		if( this.initer.storeyTemplateSwitchOn ) 
		{
			this.calcMouseXY( event );
			this.raycaster.setFromCamera(this.mouse, this.camera); // Places it on the camera pointing to the mouse

			this.sectioningTool.onMouseDown( this.raycaster, isRightButton );
			return;
		}

		if( this.ifcModel === null ) return;	// No model - no picking

		// Computes "this.mouse" - the position of the mouse on the screen
		this.calcMouseXY( event );	
		// Places it on the camera pointing to the mouse
		this.raycaster.setFromCamera(this.mouse, this.camera); 
	
		let found;
		if( this.visibleSubset === null ) {
			found = this.raycaster.intersectObjects([this.ifcModel]); // Casts a ray
		} else {
			found = this.raycaster.intersectObjects( [ this.visibleSubset ] );
		}

    if (found[0]) 
		{
			const index = found[0].faceIndex;
			const geometry = found[0].object.geometry;
			const ifc = this.ifcLoader.ifcManager;
			const id = ifc.getExpressId(geometry, index);
			if( isRightButton ) {
				this.highlightPicked( [id], null );
			} else {	// If check is allowed - checking in the treeview
				this.addChecked( id, null );
			}
    } else 
		{
			if( isRightButton ) {
				this.highlightPicked( null, null );
			}
		}
	}

	addChecked(ids, check, checkedInTreeview=null ) 
	{
		if( this.attachments.getSelectedActivity() === -1 ) {	// If no activity is selected...
			return;																							// ...exiting
		}
		if( checkedInTreeview === null && this.initer.settings.disableAttachAtCanvas ) {	
			return; // If attaching at canvas is disabled 
		}
		if( !(ids instanceof Array) ) { 	// A single value, not an array - making at an array of length "1"
			ids = [ids]
		}
		if( checkedInTreeview !== null ) {
			ids.push(checkedInTreeview);
		}
		if( this.ifcModel === null ) {
			return;
		}
		if( !this.checkIsAllowed() ) {
			return;
		}
		if( this.treeView.pickedExpressId !== null ) { 	// If there is an element picked - clearing it...
			if( this.pickSubset !== null ) {
				this.scene.remove(this.pickSubset);
				this.pickSubset = null;
			}
			this.treeView.highlightPicked( null );	
		}

		if( check === null ) { 	// "check==null" happens when clicking an element in the drawing - we do not know if it is already checked or not
			let entry = this.treeView.idMap[ids[0]];
			if( !entry ) return;
			check = (entry.checkBox.dataset.checked === 'n') ? true : false; 	// Checked it or not is getting known from the Treeview 
		}

		if( check ) {
			for( let id of ids ) { 
				this.attachments.push(null, id); //attachedIds.push(id); 
				this.treeView.highlightChecked( id, true );
			}
			this.attachSubset = this.ifcLoader.ifcManager.createSubset({ 
				scene: this.scene, modelID: this.ifcModel.modelID, ids: this.attachments.getAttached(null), 
				material: this.activeAttachMat, removePrevious: true
			});
			this.scene.add( this.attachSubset );
		} else {
			for( let id of ids ) { 
				this.attachments.remove( null, id );
				this.treeView.highlightChecked(id, false);
			}
			if( this.attachSubset !== null ) {
				this.scene.remove( this.attachSubset );
				this.attachSubset = null;
			}
			if( this.attachments.getAttached(null).length > 0 ) {
				this.attachSubset = this.ifcLoader.ifcManager.createSubset({ 
					modelID: this.ifcModel.modelID, ids: this.attachments.getAttached(null) /*attachedIds*/, 
					material: this.activeAttachMat, scene: this.scene, removePrevious: true
				});
				this.scene.add( this.attachSubset );
			}
		}
	}
	
	checkIsAllowed() 
	{ 
		return ( this.attachments.getSelectedActivity() !== null ); 
	}

	copySelectedToActivity(activityId) {
		this.attachments.copy(null, activityId);
	}

	attachToActivity(activityId, ids, material=null, materialName=null, update=true ) {
		this.attachments.assign(ids, activityId, material, materialName, update);
	}

	async getMaterialLayersOfElements(elements=null) 
	{ 		// If element === null taking a currently selected one
		if( elements === null ) {
			let sel = this.attachments.getSelectedActivity();
			if( !(sel in this.attachments.map) || !(this.attachments.map[sel].length > 0) ) return;
			elements = this.attachments.map[sel];
		} 

		let layers = {};
		for( let id of elements ) {
			let mprops = await this.ifcLoader.ifcManager.getMaterialsProperties(this.ifcModel.modelID, id, true);
			for( let mp of mprops ) {
				if( mp.constructor.name === 'IfcMaterialLayerSetUsage' ) {
					if( !mp.ForLayerSet || !mp.ForLayerSet.MaterialLayers ) continue;
					for( let lr of mp.ForLayerSet.MaterialLayers ) {
						if( lr.Material && lr.Material.Name && lr.Material['expressID'] ) {
							let eId =  lr.Material['expressID'];
							if( !(eId in layers) ) {
								layers[eId] = lr.Material.Name.value;
							}
						}
					} 
				} else if( mp.constructor.name === 'IfcMaterial' ) {
					if( mp['expressID'] && mp.Name ) {
						let eId = mp['expressID'];
						if( !(eId in layers) ) {
							layers[eId] = mp.Name.value
						}
					}		
				}
			}
		}
		return layers;
	}


	copySelectedMaterialLayerToActivity(i, mkey, mname) 
	{
		this.attachments.copy(null, i, mkey, mname);
		return;
	}

 	
	clearAttachmentsForActivity(i) 
	{
		if( this.attachments.getAttached(i).length === 0 ) return;
		this.attachments.clear(i);
		if( i === this.attachments.getSelectedActivity() ) { 	// If the currently highlighted element is to be cleared
			if( this.attachSubset !== null ) {
				this.scene.remove( this.attachSubset );
				this.attachSubset = null;
			} 
		}
	}

	// Highlights elements alreay attached to data items of the same type
	highlightAttached() 
	{
		let i = this.attachments.getSelectedActivity(); 
		let t = this.attachments.getSelectedActivityType(); 
		if( this.initer.settings.highlightAttached && i !== null && i >= -1 && t !== null && t !== -1 ) {
			let subset = null; // DEBUG this.attachments.getAttachedToWorkType(t, i);
			if( subset && subset.size > 0 ) {
				this.highlightAttachedSubset = this.ifcLoader.ifcManager.createSubset({ 
					modelID: this.ifcModel.modelID, ids: Array.from(subset), 
					material: this.highlightAttachedMat, scene: this.scene, removePrevious: false
				});
				this.scene.add(this.highlightAttachedSubset);
			}
		}
	}

	// Clears highlights of the elements alreay attached to data items of the same type
	clearHighlightAttached() {
		if( this.highlightAttachedSubset !== null ) {
			this.scene.remove( this.highlightAttachedSubset );
			this.highlightAttachedSubset = null;
		}
	}

	highlightActivityAttachments(activityId, t, prevActivityId) 
	{
		if( this.ifcModel === null ) {
			return;
		}	
		//let selectedActivity = this.attachments.selectedActivity;
		if( prevActivityId !== null && prevActivityId >= -1 ) { // If there is a data item (activity) selected
			let ids = this.attachments.map[prevActivityId];
			if( ids && ids.length > 0 ) {
				if( this.attachSubset !== null ) {
					this.scene.remove(this.attachSubset);
					this.ifcLoader.ifcManager.removeSubset({ 
						modelID: this.ifcModel.modelID, material: this.activeAttachMat, 
					});
					this.attachSubset = null;
				}
			}	
			this.clearHighlightAttached(); 	// Clear typewise highlighted subset if exists
		} 
		this.treeView.checkAll( false, (activityId === null || activityId < 0 ) ? false : true );
		
		if( activityId !== null && activityId >= -1 ) {
			this.activeAttachMat = (t === null || t === -1) ? this.attachMat : ((this.attachMats[t]) ? this.attachMats[t] : this.attachMat);
			let ids = this.attachments.map[activityId];
			if( ids && ids.length > 0 ) {
				this.attachSubset = this.ifcLoader.ifcManager.createSubset({ 
					modelID: this.ifcModel.modelID, ids: ids, material: this.activeAttachMat, 
					scene: this.scene, removePrevious: true
				});
				this.scene.add( this.attachSubset );
				this.treeView.checkByIds(ids);		
			}
			//this.attachments.typeMap[i] = t; 	// Remembering the type of the data item selected
		}

		this.highlightAttached();	// Highlight already attached elements typewise if exist
	}

	isStoreyTemplateSet() 
	{
		return (this.sectioningTool.numPolys() > 0);
	}

	async splitWithStoreyTemplate( activityId ) 
	{
		let doNode = async function( node, parentNode ) 
		{
			if( node.children.length ) 	// Has children
			{
				let childNodes = [];
				for( let i = 0 ; i < node.children.length ; i++ ) {
					childNodes.push( node.children[i] );
				}
				for( let childNode of childNodes ) {
					doNode( childNode, node );
				}
			} else 	// No children - must be splitted
			{
				let sections = await this.splitActivityWithStoreyTemplate( node.id );				
				sections.forEach( (v, k) => {
					let divisionNodeTitle = `${this.locale.msg('division')} ${(k+2).toString()}`; 
					let divisionNode = parentNode.children.find( (n) => { 
						return (n.title === divisionNodeTitle) 
					} );
					if( divisionNode === undefined ) {
						divisionNode = this.treeEdit.appendNode( parentNode, { title: divisionNodeTitle } );
					}
					let newNode = this.treeEdit.appendNode( 
						divisionNode, 
						{ title: node.title, spType: node.spType } 
					);
					// console.log('node=', node);
					this.attachments.copyWithIds( node.id, newNode.id, v );
				} );
			}
		}.bind(this);

		doNode( this.treeEdit.nodeMap[ activityId ], this.treeEdit.nodeMap[ activityId ].parent );
	}

	async splitActivityWithStoreyTemplate( activityId ) 
	{
		let ids = this.attachments.map[activityId];		
		if( !ids ) return;

		let customID = 'splitWithStoreyTemplate';

		// Initializing storage for ids splitted by sections
		let sections = new Map(); 
		sections.set( -1, [] );
		for( let i = 0 ; i < this.sectioningTool.numPolys() ; i++ ) {
			sections.set( i, [] );
		}

		for( let i = 0 ; i < ids.length ; i++ ) 
		{
			let id = ids[i];
			let subset = this.ifcLoader.ifcManager.createSubset({ 
				modelID: this.ifcModel.modelID, ids: [id], customID: customID,
				scene: this.scene, removePrevious: true
			});
		
			let count = subset.geometry.index.count;
			let indexes = subset.geometry.index.array;
			let found = false;
			for( let i = 0 ; i < count ; i++ ) {
				let posX = subset.geometry.attributes.position.array[ indexes[i] * 3 ]; // A point of the element (expressID)
				let posZ = subset.geometry.attributes.position.array[ indexes[i] * 3 + 2 ]; // A point of the element (expressID)
				let polyIndex = this.sectioningTool.findEnclosingPoly(posX, posZ);
				if( polyIndex >= 0 ) {
					sections.get(polyIndex).push(id);
					found = true;
					break;
				}
			}
			if( !found ) {
				sections.get(-1).push(id);
			}

			this.ifcLoader.ifcManager.removeSubset({ 
				modelID: this.ifcModel.modelID, customID: customID, 
			});
		}
		return sections;
	}


	async highlightPicked( ids, pickedInTreeViewId=null ) 
	{
		let pickedExpressId = this.treeView.pickedExpressId;

		if( this.pickSubset !== null ) {
			//this.ifcLoader.ifcManager.removeSubset(this.ifcModel.modelID, this.scene, this.pickMat);
			this.scene.remove(this.pickSubset);
			this.pickSubset = null;
		}
		this.treeView.highlightPicked( null );

		if( ids !== null && ids.length ) {
			let id = (pickedInTreeViewId!==null) ? pickedInTreeViewId : ids[0];
			if( pickedExpressId === id ) { 	// Picking the same element - must be unpicked then...
				this.tooltipWindow.hide();
				return;
			}
			// Creates subset
			this.pickSubset = this.ifcLoader.ifcManager.createSubset({ 
				modelID: this.ifcModel.modelID, ids: ids, material: this.pickMat, 
				scene: this.scene, removePrevious: true
			});
			this.scene.add(this.pickSubset);
			this.treeView.highlightPicked( id );
			//console.log('pick:getMaterialsProperties:', this.ifcLoader.ifcManager.getMaterialsProperties(this.ifcModel.modelID, ids[0], true));
			//console.log('pick:getPropertySets:', await this.ifcLoader.ifcManager.getPropertySets(this.ifcModel.modelID, ids[0], true));
			//console.log('pick:getItemProperties:', await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, ids[0], true));
			let info = await this.getItemInfo( id );
			let message = this.formatItemInfo( info );
			this.tooltipWindow.show( message );
			//await this.getCoords(ids[0]);
		} else {
			this.tooltipWindow.hide();
		}
	}

	async getCoords(id) 
	{
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, true);
		//console.log('getCoords', iprops);
		let pl = iprops.ObjectPlacement;
		if( !pl ) return null;

		if( pl.RelativePlacement && pl.RelativePlacement.Location ) {
			let cc = pl.RelativePlacement.Location.Coordinates;
			console.log('cc=', cc);
			let plr = pl.PlacementRelTo;
			if( plr && plr.RelativePlacement && plr.RelativePlacement.Location ) { 
				let ccr = plr.RelativePlacement.Location.Coordinates;
				cc[0].value += ccr[0].value; cc[1].value += ccr[1].value; cc[2].value += ccr[2].value;
			}
			return cc;
			if( cc && false ) {
				this.camera.position.x = cc[0].value + 15;
				this.camera.position.z = cc[1].value + 13;
				this.camera.position.y = cc[2].value + 8;
				this.controls.target.set(this.camera.position.x-5, this.camera.position.y, this.camera.position.z-5);
			}
		}		
	}

	async getItemInfo(id) 
	{
		let info = {};
		let props = await this.ifcLoader.ifcManager.getPropertySets(this.ifcModel.modelID, id, true);
		//console.log('getPropertySets', props);
		for( let p of props ) {
			if( p.constructor.name === 'IfcPropertySet' ) {
				if( p.HasProperties ) {
					for( let singleValue of p.HasProperties ) {
						if( singleValue.constructor.name === 'IfcPropertySingleValue') {
							info[singleValue.Name.value] = (singleValue.NominalValue) ? singleValue.NominalValue.value : '';
						}
					}
				}
			}
			if( p.constructor.name === 'IfcElementQuantity' ) {
				if( p.Quantities ) {
					for( let q of p.Quantities ) {
						if( q.Name ) {
							if( q.LengthValue ) {
								info[q.Name.value] = q.LengthValue.value;
							} else if( q.AreaValue ) {
								info[q.Name.value] = q.AreaValue.value;
							} else if ( q.VolumeValue ) {
								info[q.Name.value] = q.VolumeValue.value;
							}
						}
					}
				}
			}
		}
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, false);
		if( (iprops['Name']) ) info['Name'] = isoToUtf8( iprops['Name'].value );
		if( iprops['GlobalId'] ) info['GlobalId'] = iprops['GlobalId'].value;
		if( iprops['type'] ) info['type'] = iprops['type'];

		let materials = await this.getItemMaterials( id, info );
		if( materials.length > 0 ) {
			info['__materials'] = materials;
		}
		//console.log(info);
		return info;
	}

	async getItemMaterials(id, info={}) 
	{
		let mprops = await this.ifcLoader.ifcManager.getMaterialsProperties(this.ifcModel.modelID, id, true);
		//console.log('getMaterialProperties', mprops);
		let materials = [];
		for( let mp of mprops ) {
			if( mp.constructor.name === 'IfcMaterialLayerSetUsage' ) {
				if( mp.ForLayerSet && mp.ForLayerSet.MaterialLayers ) {
					for( let lr of mp.ForLayerSet.MaterialLayers ) {
						//console.log('m=', lr);
						if( lr.Material && lr.Material.Name && lr.Material['expressID'] ) {
							let volume = null;
							if( lr.LayerThickness && info[this.initer.settings.netSideAreaKey] ) {
								volume = lr.LayerThickness.value * info[this.initer.settings.netSideAreaKey];
							} 
							else if( info[this.initer.settings.widthKey] && info[this.initer.settings.netSideAreaKey] ) {
								volume = info[this.initer.settings.widthKey] * info[this.initer.settings.netSideAreaKey];
							}
							else if( info[this.initer.settings.netVolumeKey] ) { 	// if( info['NetVolume'] ) {
								volume = info[ this.initer.settings.netVolumeKey ];
							} 
							let material = [ lr.Material['expressID'], isoToUtf8(lr.Material.Name.value), volume ];
							materials.push( material ); 
						}
					}
				}
			} else if( mp.constructor.name === 'IfcMaterial' ) {
				//console.log('m=', mp);
				if( mp['expressID'] && mp.Name ) {
					let st = this.initer.settings;
					let volume = (info[st.netVolumeKey]) ? 
						info[st.netVolumeKey] : ((info[st.grossVolumeKey]) ? info[st.grossVolumeKey] : null);
					materials.push( [ mp['expressID'], isoToUtf8(mp.Name.value), volume ] );
				}		
			}
		}
		return materials;
	}

	formatItemInfo( info ) {
		let r = '';
		let name = (info['Name']) ? info['Name'] : 'Undefined';
		r = 'Name: ' + name;
		for( let k in info ) {
			if( k === 'Name' ) {
				continue;
			}
			if( k === '__materials' ) {
				for( let a of info[k] ) {
					r += '<br/>Material: ' + a[1] + ( (a[2]) ?  ('(' + a[2] + ')') : '' );
				}
				continue;
			}
			let value = info[k];
			if( typeof(k === 'string') ) {
				k = isoToUtf8(k);
			}
			if( typeof(info[k] === 'string') ) {
				value = isoToUtf8(value);
			}
			r += '<br/>' + k + ': ' + value;
		}
		return r;
	}

	async getItemName( id ) {
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, false);
		let name = ( iprops && iprops['Name'] ) ? iprops['Name'].value : ''; 
		return isoToUtf8( name ); 
	}

	async getItemProperties( id ) {
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, false);
		let name = ( iprops && iprops['Name'] ) ? iprops['Name'].value : '';
		let gid =  ( iprops && iprops['GlobalId'] ) ? iprops['GlobalId'].value : null;
		let type =  ( iprops && iprops['type'] ) ? iprops['type'] : null;
		return [isoToUtf8(name), gid, type];
	}

	async loadModel(ifcURL, fileName, fileUpload=null, callback=null) 
	{
		this.fileUpload = fileUpload;		// Saving file object 
		this.fileName = fileName;		// Saving file name 

		this.messageBox.show(`${this.locale.msg('wait_loading_ifc')}<br/>${this.fileName}`);
		await this.ifcLoader.ifcManager.setWasmPath("/");
		this.ifcLoader.load(
			ifcURL, 
			async function(ifcModel) 
			{
				this.ifcModel = ifcModel.mesh;
				this.messageBox.hide();

				// Clearing the previous if required
				if( this.ifcModel !== null ) {
					this.scene.remove(this.ifcModel);
				}
				this.typesListWindow.clear();

				if( this.modelMat !== null ) {
					ifcModel.mesh.material = this.modelMat;
				}
				
				this.scene.add(ifcModel.mesh);
				let sp = await ifcModel.getSpatialStructure(ifcModel.modelID);						
				this.treeView = new IFCTreeView( this.locale, this.treeViewElem, sp, 
					{ 
						pickColor: this.pickColor,
						checkColor: this.checkColor,
						highlightColor: this.highlightColor, 
						pickCallback: this.highlightPicked.bind(this),
						checkCallback: this.addChecked.bind(this),
						checkIsAllowedCallback: this.checkIsAllowed.bind(this),
						getItemNameCallback: this.getItemName.bind(this), 
						getItemPropertiesCallback: this.getItemProperties.bind(this), 
						getItemMaterialsCallback: this.getItemMaterials.bind(this),
						getItemInfoCallback: this.getItemInfo.bind(this),
						showAllCallback: this.showAll.bind(this),
						filterByIdsCallback: this.filterByIds.bind(this),
						messageCallback: function(msg) { 
							if(msg) { this.messageBox.show(msg); }
							else { this.messageBox.hide(); }  
						}.bind(this)  					
					}				 
				);
				await this.treeView.createEntries();
				this.initTypesList();
				if( callback ) {
					callback();
				}
			}.bind(this),
			function(prg) { 
				this.messageBox.show( 
					this.locale.msg('wait_loading_ifc') + '<br/>' + 
					this.locale.msg('loaded') +  ': ' + prg.loaded +  ' ' + 
					this.locale.msg('bytes') 
				);
			}.bind(this),
			function(e) 
			{
				this.messageBox.show( this.locale.msg('ifc_not_loaded') );
			}.bind(this)
		);
	};

	checkAll() {
		if( this.ifcModel === null ) {
			return;
		}
		this.treeView.checkAll(true);
	};

	uncheckAll() {
		if( this.ifcModel === null ) {
			return;
		}
		this.treeView.checkAll(false);
	};

	checkByIds( ids ) {
		if( this.ifcModel === null ) {
			return;
		}
		this.treeView.checkByIds(ids);
	}

	checkByTypes() {
		if( this.ifcModel === null ) {
			return;
		}
		this.typesListWindow.show();
	}

	async typesListCallback( list ) {
		list = this.typesListWindow.checkList;
		const manager = this.ifcLoader.ifcManager;
		for( let item of list ) { 	// item[0]=id, item[1]=title, item[2]=checked?
			if( item[2] || true ) { 	// Checked?
				const elements = await manager.getAllItemsOfType(this.ifcModel.modelID, item[0], false);	
				this.treeView.checkById(elements, item[2]);
			}
		}
	}

	initTypesList() {
		for( let key in this.treeView.typesMap ) {
			this.typesListWindow.add( this.treeView.typesMap[key], key, true );
		}
	}

	filterByIds(ids) {
		//this.ifcModel.material = this.hideMat;
		this.visibleSubset = this.ifcLoader.ifcManager.createSubset({ 
			scene: this.scene, modelID: this.ifcModel.modelID, ids: ids, 
			material: this.visibleMat, removePrevious: true
		});
		this.scene.add( this.visibleSubset );

		this.ifcModel.mesh.visible = false;
	}

	showAll() {
		if( this.visibleSubset !== null ) {
			this.scene.remove( this.visibleSubset );
			this.visibleSubset = null;
			this.ifcModel.mesh.visible = true;
		}
	}

	getAttachedIds(id) {
		if( !(id in this.attachments.map ) ) return null;
		let ids = this.attachments.map[id];
		return (ids.length > 0) ? ids : null;
	}

	getAttachedMaterials(id) {
		if( !(id in this.attachments.materialMap) || this.attachments.materialMap[id].length===0) return null;
		return this.attachments.materialMap[id];
	}

	setAttachedIds(nodeId, ids) {
		this.attachments.map[nodeId] = ids;
	}

	setAttachedMaterial(id, materialId ) {
		this.attachments.materialMap[id] = materialId;
	}

	setTreeEdit( treeEdit ) 
	{
		this.treeEdit = treeEdit;
		this.attachments = treeEdit.attachments;
	}
}


		/*
		this.selectionBox = new SelectionBox( this.camera, this.scene );
		this.selectionHelper = new SelectionHelper( this.selectionBox, this.renderer, 'selectBox' );

		this.threeCanvas.addEventListener( 'pointerdown', function ( event ) {
			for ( const item of this.selectionBox.collection ) {
				item.material.emissive.set( 0x000000 );
			}
			this.selectionBox.startPoint.set( 
				(event.clientX / window.innerWidth)*2-1, -(event.clientY / window.innerHeight)*2+1, 0.5 
			);
		}.bind(this) );
		
		this.threeCanvas.addEventListener( 'pointermove', function ( event ) {
			if ( this.selectionHelper.isDown ) {
				for ( let i = 0; i < this.selectionBox.collection.length; i ++ ) {
					this.selectionBox.collection[ i ].material.emissive.set( 0x000000 );
				}
				this.selectionBox.endPoint.set(
					(event.clientX / window.innerWidth)*2-1, -(event.clientY / window.innerHeight)*2+1, 0.5 
				);
		
				const allSelected = this.selectionBox.select();
				for ( let i = 0; i < allSelected.length; i ++ ) {
					allSelected[ i ].material.emissive.set( 0xffffff );
				}
			}
		}.bind(this) );
		
		this.threeCanvas.addEventListener( 'pointerup', function ( event ) {
			this.selectionBox.endPoint.set(
				(event.clientX / window.innerWidth)*2-1, -(event.clientY / window.innerHeight)*2+1, 0.5 
			);
			const allSelected = this.selectionBox.select();
			for ( let i = 0; i < allSelected.length; i ++ ) {
				allSelected[ i ].material.emissive.set( 0xffffff );
			}
		}.bind(this) );		
		*/
