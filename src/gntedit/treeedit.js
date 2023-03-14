import './treeedit.css'
import { TreeEditNode } from './treeedit-node'
import { initWorkTypesOutOfSPData, initWorkTypes, getSPWorkTypes } from './treeedit-work-types'
import { ContextMenu } from '../contextmenu';
import { TreeEditAttachments } from './treeedit-attachments';

export class TreeEdit 
{
	constructor( containerDiv, options={} ) 
	{
		this.containerDiv = containerDiv;
		this.options = options;
		this.locale = (options.locale) ? options.locale : null;

		this.nodeCounter = 0;
		this.nodeMap = {};

		this.workTypes = null;

		this.highlightedId = -1;

		this.attachments = new TreeEditAttachments( this );

		this.rootNode = new TreeEditNode( { 
			parent: null, id: this.nodeCounter, locale: this.locale,
			title: ((this.locale) ? this.locale.msg('project') : 'root'), 
			moveNode: this.moveNode.bind(this), 
			addChild: this.addChild.bind(this), 
			removeNode: this.removeNode.bind(this), 
			removeAllChildNodes: this.removeAllChildNodes.bind(this),
			nodeHighlighted: this.nodeHighlighted.bind(this),
			isHighlightEnabled: this.options.isHighlightEnabled,
			attachmentsMenu: this.options.attachmentsMenu
		} );
		containerDiv.appendChild(this.rootNode.div);
		this.nodeMap[this.nodeCounter] = this.rootNode;
		this.nodeCounter++;

		this.containerDiv.addEventListener( 
			'mouseup', 
			function(e) {
				if( ('which' in e && e.which === 3) || ('button' in e && e.button === 2) ) return;
				if( this.highlightedId !== -1 ) {
					this.nodeMap[ this.highlightedId ].titleDiv.className = 'tree-edit-node-title-div';
					let prevHighlighted = this.highlightedId;
					this.highlightedId = -1;
					this.options.nodeHighlighted(this.highlightedId, null, prevHighlighted);
				}
			}.bind(this)
		);
	}

	nodeHighlighted(id, type) 
	{
		let prevHighlighted = this.highlightedId; 
		if( this.highlightedId !== -1  ) {
			let n = this.nodeMap[this.highlightedId];
			n.titleDiv.className = 'tree-edit-node-title-div';
		}
		if( id !== -1 ) {
			this.nodeMap[id].titleDiv.className = 'tree-edit-node-title-div-highlighted';
		}
		this.highlightedId = id;
		this.options.nodeHighlighted(id, type, prevHighlighted);
	}

	isParent( node, possiblyParentNode ) 	// Id possiblyParentNode is a parent of node ?
	{ 	
		const findParent = function( node, possiblyParentNode ) {
			if( node.parent === null ) return false;
			if( node.parent.id == possiblyParentNode.id ) return true;
			return findParent( node.parent, possiblyParentNode );
		}
		return findParent( node, possiblyParentNode );
	}

	moveNode( e, nodeId, parentId, targetId, moveAsSibling=false ) 
	{
		let node = this.nodeMap[nodeId];
		let nodeDiv = node.div;
		let parentNode = this.nodeMap[parentId];
		let parentDiv = parentNode.childrenDiv;
		
		// Changing the values due to the new parent-child relations (from old parent to target)		
		let nodeIndex = parentNode.children.indexOf( node );
		parentNode.children.splice( nodeIndex, 1);	// Detaching from the parent
		if( !moveAsSibling ) {	// Moving as a child of the target 
			let targetNode = this.nodeMap[targetId];
			if( this.isParent( targetNode, node) ) return; 
			let targetDiv = targetNode.childrenDiv;
			targetNode.children.push( node );
			node.parent = targetNode;
			targetDiv.insertBefore(nodeDiv, targetDiv.firstChild);
		} else { 		// Moving as a sibling of the target
			let targetNode = this.nodeMap[targetId];
			if( this.isParent( targetNode, node) ) return; 
			let parentOfTheTargetNode = this.nodeMap[ targetNode.parent.id ]; 
			let parentOfTheTargetDiv = parentOfTheTargetNode.childrenDiv;

			let targetIndex = -1; 	// To insert before in the "children" array
			for( let i = 0 ; i < parentOfTheTargetNode.children.length ; i++ ) {
				if( parentOfTheTargetNode.children[i].id == targetId ) {
					targetIndex = i;
					break;
				}
			} 
			if( targetIndex === -1 ) {
				parentOfTheTargetNode.children.push(node);
			} else {
				parentOfTheTargetNode.children.splice( targetIndex, 0, node);
			}
			node.parent = parentOfTheTargetNode;
			parentOfTheTargetDiv.insertBefore( nodeDiv, targetNode.div );
		}
	}

	removeNode( node ) 
	{
		let parentNode = node.parent;
		if( parentNode === null ) return; 	// If it is the root node - leaving the function...

		if( node.id === this.highlightedId ) {	// If a node is the one highlighted at the moment...
			this.nodeHighlighted(-1, null);				// ... the highlight must be cleared 
		}

		const removeFromMap = function( node_ ) {
			for( let n of node_.children ) {
				removeFromMap( n );
			}
			if( node_.id === this.highlightedId ) {	// If a node is the one highlighted at the moment...
				this.nodeHighlighted(-1, null);				// ... the highlight must be cleared 
			}
			if( node_.id in this.nodeMap ) { 
				delete this.nodeMap[ node_.id ]; 
			}
		}.bind(this);
		removeFromMap( node );

		let nodeIndex = parentNode.children.findIndex( (el_,ind_,arr_) => { return ( el_.id === node.id ) } );
		if( nodeIndex !== -1 ) {
			parentNode.children.splice( nodeIndex, 1 );
		}
		parentNode.childrenDiv.removeChild( node.div );

		if( parentNode.children.length === 0 ) {
			parentNode.expandDiv.innerHTML = '';
		}
		//console.log('node map after:', this.nodeMap);
	}

	removeAllChildNodes( node ) 
	{
		if( !node.children ) return; 	

		const removeFromMap = function( node_ ) {
			for( let n of node_.children ) {
				removeFromMap( n );
			}
			if( node_.id === this.highlightedId ) {	// If a node is the one highlighted at the moment...
				this.nodeHighlighted(-1, null);				// ... the highlight must be cleared 
			}
			if( node_.id in this.nodeMap ) { 
				delete this.nodeMap[ node_.id ]; 
			}
		}.bind(this);

		for( let childNode of node.children ) {
			removeFromMap( childNode );
			node.childrenDiv.removeChild( childNode.div );
		}
		node.children = [];
	}


	addChild( node, inpArgs ) 
	{
		//console.log('add child');
		let title;
		if( inpArgs && inpArgs[0] ) {
			title = inpArgs[0];
		} else {
			if( node.parent === null ) {	// The root node is appended with a child?
				title = `${this.locale.msg('element')}_${ node.lastChildNumber}`;
			} else {
				title = `${node.titleDiv.innerText}_${ node.lastChildNumber}`;
			}
		}
		this.appendNode( node, { title: title } );
	}


	appendNode( parentNode, props ) 
	{
		if( parentNode === null ) {
			parentNode = this.rootNode;
		}
		let node = new TreeEditNode( {
			parent: parentNode, title: props.title, id: this.nodeCounter, locale: this.locale,
			moveNode: this.moveNode.bind(this),
			addChild: this.addChild.bind(this),
			removeNode: this.removeNode.bind(this),
			removeAllChildNodes: this.removeAllChildNodes.bind(this),
			spCode: props.spCode, spLevel: props.spLevel, spType: props.spType,
			nodeHighlighted: this.nodeHighlighted.bind(this),
			isHighlightEnabled: this.options.isHighlightEnabled,
			attachmentsMenu: this.options.attachmentsMenu
		} );
		this.nodeMap[this.nodeCounter] = node;
		this.nodeCounter++;

		parentNode.childrenDiv.appendChild( node.div );
		parentNode.children.push(node);
		parentNode.lastChildNumber += 1;

		if( parentNode.children.length === 1 ) {
			parentNode.childrenDiv.style.display === 'block';
			parentNode.expandDiv.innerHTML = '-';
		}

		return node;
	}

	removeLastNode( parentNode ) 
	{
		if( parentNode.children.length === 0 ) {
			return;
		}
		parentNode.childrenDiv.removeLastChild();
		parentNode.children.pop();

		if( parentNode.children.length === 0 ) {
			parentNode.expandDiv.innerHTML = '';
		}
	} 

	setRootNodeProps( props ) 
	{
		if( props.title ) this.rootNode.setTitle( props.title );
		if( props.spCode ) this.rootNode.spCode = props.spCode;
		if( props.spLevel ) this.rootNode.spLevel = props.spLevel;
	}

	initWorkTypesOutOfSPData(data) {
		initWorkTypesOutOfSPData( this, data );
	}

	initWorkTypes( types, resetColorsInTree=false, resetWorkTypes=true ) {
		initWorkTypes(this, types, resetColorsInTree, resetWorkTypes);
	}

	getSPWorkTypes() { 
		return getSPWorkTypes(this);
	}

	setNodeCounter( nodeCounter ) {
		this.nodeCounter = nodeCounter;
	}
}
