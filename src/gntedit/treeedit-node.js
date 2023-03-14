import { TreeEditInput } from './treeedit-input'
import { ContextMenu } from './../contextmenu'
import { MessageBox } from './../messagebox'

export class TreeEditNode 
{
	constructor( options = {} ) 
	{
		this.id = options.id;
		this.parent = options.parent;
		this.title = options.title;
		this.locale = options.locale;
		this.moveNode = options.moveNode;
		this.addChild = options.addChild;
		this.removeNode = options.removeNode;
		this.removeAllChildNodes = options.removeAllChildNodes;
		this.nodeHighlighted = options.nodeHighlighted;
		this.isHighlightEnabled = options.isHighlightEnabled;
		this.attachmentsMenu = options.attachmentsMenu;
		if( options.spCode ) this.spCode = options.spCode;
		if( options.spLevel ) this.spLevel = options.spLevel;
		if( options.spType ) this.spType = options.spType;
		
		this.children = [];	// TreeEditNodes
		this.lastChildNumber = 0;

		this.div = document.createElement('div');
		this.div.className = 'tree-edit-node-div';
		this.div.dataset.id = this.id;

		this.propertiesDiv = document.createElement('div');
		this.propertiesDiv.className = 'tree-edit-node-properties-div';
		this.div.appendChild( this.propertiesDiv );

		this.expandDiv = document.createElement('div');
		this.expandDiv.className = 'tree-edit-node-expand-div';
		this.expandDiv.innerHTML = '';
		this.div.appendChild( this.expandDiv );
		this.expandDiv.addEventListener( 'click', function(e) {
			let display = ( this.childrenDiv.style.display === 'none' ) ? 'block' : 'none';
			this.childrenDiv.style.display = display;
			this.expandDiv.innerHTML = (display === 'none') ? '+' : '-';
		}.bind(this) );

		if( parent !== null ) { 	// If not a root node
			this.upperTitleDiv = document.createElement('div');
			this.upperTitleDiv.className = 'tree-edit-node-upper-title-div';
			this.upperTitleDiv.dataset.id = this.id;
			this.upperTitleDiv.innerHTML = '&nbsp;';
			this.div.appendChild(this.upperTitleDiv);
			this.upperTitleDiv.ondragover = function(e) { 
				e.preventDefault(); 
				e.target.className = 'tree-edit-node-upper-title-div-droppable';
			}	// To allow drop
			this.upperTitleDiv.ondragleave = function(e) { 
				e.preventDefault(); 
				e.target.className = 'tree-edit-node-upper-title-div';
			}	// To allow drop
		}

		this.titleDiv = document.createElement('div');
		this.titleDiv.className = 'tree-edit-node-title-div';
		this.titleDiv.dataset.id = this.id;
		this.titleDiv.innerText = this.title;
		this.div.appendChild(this.titleDiv);
		this.titleDiv.ondragover = function(e) { 
			e.preventDefault(); 
			e.target.className = 'tree-edit-node-title-div-droppable';
		}	// To allow drop
		this.titleDiv.ondragleave = function(e) { 
			e.preventDefault(); 
			e.target.className = 'tree-edit-node-title-div';
		}	// To allow drop

		if( this.parent !== null ) { 	// If not a root node
			this.titleDiv.draggable = true;
			this.titleDiv.ondragstart = function(e) {
				//console.log(`${this.id},${this.parent.id}`); 
				e.dataTransfer.setData('text', `${this.id},${this.parent.id}`); 
			}.bind(this);
		}

		this.titleDiv.addEventListener( 
			'mouseup', 
			async function(e) {
				e.stopPropagation();
				e.preventDefault();
				if( ('which' in e && e.which === 3) || ('button' in e && e.button === 2) ) { 	// The right button?
					const cmenu = new ContextMenu( { fontSize: '12px' } );
					let cmenuItems = [];
					cmenuItems.push( [ this.locale.msg('node_title'), 'input', null ] ); 
					cmenuItems.push( [ this.locale.msg('add_child'), this.addChild, this ] );
					if( this.parent !== null ) { 
						cmenuItems.push( [ this.locale.msg('remove_node'), this.removeNode.bind(this), this ] ); 
					}
					if( this.children && this.children.length > 0 ) {
						cmenuItems.push( [ this.locale.msg('remove_all_child_nodes'), this.removeAllChildNodes, this ] );
					}
					if( this.isHighlightEnabled() ) {		// If highlight is enabled - involving attachments menu items 					
						//cmenuItems.push( [ this.locale.msg('attachments'), 'subheader', null ] );
						let id = this.id;
						for( let m of this.attachmentsMenu ) {
							if( m.isAvailable && !m.isAvailable(id) ) { 	// Check if not available 
								cmenuItems.push( [ m.title, null ] );	
								continue;
							}
							if( m.generator ) {	// Generator to create several menu items
								let kvpairs = await m.generator(this.id); 	// kvpairs: materialId => { name:..., style:...  }
								//let kvSubheader = false;
								for( let k in kvpairs ) {
									//if( !kvSubheader ) {
									//	cmenuItems.push( [ m.title, 'subheader', null ] );
									//	kvSubheader = true;
									//}
									let optionTitle = this.locale.msg('attach_with_material') + ' + ' + kvpairs[k].name;
									cmenuItems.push([ 
										optionTitle, function() { m.callback(id, k, kvpairs[k].name); }, null, kvpairs[k].style 
									]);
								}
								continue;
							}
							cmenuItems.push( [ m.title, function() { m.callback(id); } ] );
						}
					}
					cmenu.show( e, cmenuItems, { elem: this.titleDiv, backgroundColor:'#efefef' } );	
				} else {	
					if( this.isHighlightEnabled() ) {			
						this.nodeHighlighted(this.id, this.spType);
					} else {
						let mb = new MessageBox();
						mb.confirm( this.locale.msg('model_not_loaded_disables_node_select') );
					}
					//let ed = new TreeEditInput();
					//ed.edit( this.titleDiv );			
				}
			}.bind(this) 
		);


		this.titleDiv.ondblclick = function(e) {
			if( ('which' in e && e.which === 3) || ('button' in e && e.button === 2) ) { 	// The right button?
				return;
			} 
			let ed = new TreeEditInput();
			ed.edit( this.titleDiv );			
		}.bind(this);

		this.childrenDiv = document.createElement('div');
		this.childrenDiv.className = 'tree-edit-node-children-div';
		this.div.appendChild(this.childrenDiv);

		const callMoveNode = function(e, moveAsSibling=false) {
			let data = e.dataTransfer.getData('text');
			let ids = data.split(',');
			if( ids.length !== 2 ) return;
			let nodeId = ids[0];
			let parentId = ids[1];
			let targetId = e.target.dataset.id;
			this.moveNode( e, nodeId, parentId, targetId, moveAsSibling );
		}.bind(this);

		if( parent !== null ) { 	// If not a root node
			this.upperTitleDiv.ondrop = function(e) { 	// Handling drop 
				e.preventDefault();
				this.upperTitleDiv.className = 'tree-edit-node-upper-title-div';
				callMoveNode(e, true); 
			}.bind(this);
		}
		this.titleDiv.ondrop = function(e) { 	// Handling drop 
			e.preventDefault(); 
			this.titleDiv.className = 'tree-edit-node-title-div';
			callMoveNode(e)
		}.bind(this);
	}

	setTitle( title ) {
		this.titleDiv.innerText = title;
	}
}

