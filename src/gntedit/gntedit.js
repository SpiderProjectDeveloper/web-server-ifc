import { TreeEdit } from "./treeedit";

export class GnTEdit 
{
	constructor( containerId, settings={}, options={} ) 
	{
		this.containerElem = document.getElementById(containerId);
		
		this.containerElem.addEventListener( 'selectstart', function(e) { e.preventDefault(); return false; } );
		this.containerElem.addEventListener( 'selectend', function(e) { e.preventDefault(); return false; } );

		this.options = options;
		this.locale = (options.locale) ? options.locale : null;

		this.treeEdit = new TreeEdit(
			this.containerElem, 
			{ 
				locale: this.locale, 
				nodeHighlighted: this.nodeHighlighted.bind(this),
				isHighlightEnabled: this.options.isHighlightEnabled,
				attachmentsMenu: this.options.attachmentsMenu
			} 
		);
	}

	getMaterialsAttachedById( id ) 
	{
		if( !this.treeEdit.attachments.materialMap ) return null;
		return this.treeEdit.attachments.materialMap[id];
	}

	getAttachmentsByActivityId(id) 
	{
		return (id in this.treeEdit.attachments.map) ? this.treeEdit.attachments.map[ id ] : null;
	}

	getAttachmentsOfHighlighted() 
	{
		let id = this.treeEdit.highlightedId;
		return (id in this.treeEdit.attachments.map) ? this.treeEdit.attachments.map[ id ] : null;
	}

	nodeHighlighted( id, type, prevId ) 
	{
		this.options.highlightCallback( id, type, prevId );
	}

	setRootNodeProps( props ) 
	{
		this.treeEdit.setRootNodeProps(props);
	}

	appendNode( parentNode, props ) 
	{
		let node = this.treeEdit.appendNode( parentNode, props );
		return node;
	}

	setNodeCounter( nodeCounter ) 
	{
		this.treeEdit.setNodeCounter(nodeCounter);
	}
}