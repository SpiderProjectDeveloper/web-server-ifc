import './contextmenu.css';

export class ContextMenu {

	constructor( props = {} ) {
		this.props = props;

		// Triggering element functionality (to change it's color and/or background)
		this.triggerElem = null;
		this.triggerOriginalColor = null;
		this.triggerOriginalBackgroundColor = null;

		this.div = document.createElement('div');
		this.div.className = 'contextmenu';
		this.div.style.display = 'none';
		this.div.style.zIndex = 10000;
		if( props.style ) {
			for( let k in props.style ) {
				this.div.style[k] = props.style[k];
			}
		}
		this.div.onmouseleave = function(e) {
			this.hide();
		}.bind(this);
		this.parent = null;
	}

	// item: [0]-title, [1]-cb, [2]-cb. arg, [3]-style
	show( e, items, trigger, parent = null ) {
		if( !items || !('length' in items) || items.length === 0 ) {
			return;
		}
		
		// Changing color and/or background color of the triggering elements
		if( trigger ) {
			this.triggerElem = trigger.elem;
			this.triggerOriginalColor = trigger.elem.style.color;
			this.triggerOriginalBackgroundColor = trigger.elem.style.backgroundColor;
			if( trigger.color ) trigger.elem.style.color = trigger.color;
			if( trigger.backgroundColor ) trigger.elem.style.backgroundColor = trigger.backgroundColor;
		} else {
			this.triggerElem = null;
		}

		if( !this.parent ) {
			if( parent ) {
				parent.appendChild(this.div);
				this.parent = parent;
			} else {
				document.body.appendChild(this.div);
				this.parent = document.body;
			}
		}
	
		while(this.div.hasChildNodes() ) {
			this.div.removeChild( this.div.lastChild );
		}

		if( e.clientX > window.innerWidth/2 ) {
			this.div.style.right = (window.innerWidth - e.clientX - 4) + 'px';
		} else {
			this.div.style.left = (e.clientX - 4) + 'px';			
		}
		if( e.clientY > window.innerHeight/2 ) {
			this.div.style.bottom = (window.innerHeight - e.clientY + 4) + 'px';
		} else {
			this.div.style.top = (e.clientY - 4) + 'px';			
		}
		this.div.style.height = (this.props.fontSize+8) * items.length + 'px';
		this.div.style.display = 'block';
		for( let item of items ) {
			let itemDiv = document.createElement('div');
			itemDiv.style.whiteSpace = 'nowrap';
			if( 'fontSize' in this.props ) {
				itemDiv.style.fontSize = this.props.fontSize;
			}
			// Title and style (the 4th element of every item): "b"
			let title = item[0];
			let style = ( item.length > 3 && item[3] ) ? item[3] : null;
			if( style !== null ) {
				title = `<span style='${style}'>${title}</span>`;
			}

			if( item[1] === null ) {	// Disabled ? 
				itemDiv.innerHTML = title;
				itemDiv.className = 'contextmenu-item-disabled';
			} else if( typeof(item[1]) === 'function' ) {
				let cb = item[1];
				let arg = item[2];	
				itemDiv.innerHTML = title;
				itemDiv.className = 'contextmenu-item';
				itemDiv.onclick = function(e) {
					let inputArgs = [];
					for( let ch of this.div.children ) {
						if( ch.children && ch.children.length === 2 && ch.children[1].nodeName === 'INPUT') {
							inputArgs.push(ch.children[1].value);
						}
					}
					cb(arg, inputArgs);
					this.hide();
				}.bind(this);	
			} else if( typeof(item[1]) === 'string' ) {
				if( item[1] === 'subheader' ) {
					itemDiv.innerHTML = title;
					itemDiv.className = 'contextmenu-subheader';	
				}
				else if( item[1] === 'input' ) {
					let spanElem = document.createElement('span');
					spanElem.innerHTML = title;
					spanElem.className = 'contextmenu-input-label';
					let inputElem = document.createElement('input');
					inputElem.type = 'text';
					inputElem.className = 'contextmenu-input';
					itemDiv.appendChild(spanElem);
					itemDiv.appendChild(inputElem);
				}
			} 
			else {
				itemDiv.innerHTML = title;
				itemDiv.className = 'contextmenu-title';
			}
			this.div.appendChild(itemDiv);
		}		
	}

	hide() {
		this.div.style.display = 'none';
		if( this.triggerElem ) {
			this.triggerElem.style.color = this.triggerOriginalColor;
			this.triggerElem.style.backgroundColor = this.triggerOriginalBackgroundColor;
		}
	}
} 