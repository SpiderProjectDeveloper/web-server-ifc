
export class TreeEditInput {
	constructor() {
		this.triggerDiv = null;

		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.style.dispaly = 'none';
		this.input.className = 'tree-edit-node-div-editor-input';
		document.body.appendChild( this.input );

		this.input.onblur = function() { this.input.style.display = 'none'; }.bind(this);

		this.input.onkeyup = function(e) {
			if( e.keyCode === 13 ) {
				this.triggerDiv.innerText = this.input.value;
				this.input.style.display = 'none';
				return;
			}
			if( e.keyCode === 27 ) {
				this.input.style.display = 'none';
				return;
			}
		}.bind(this);
	}

	edit( div ) {
		this.triggerDiv = div;

		let bbox = div.getBoundingClientRect();
		this.input.style.left = bbox.left + 'px';
		this.input.style.top = bbox.top + 'px';
		this.input.style.width = bbox.width + 'px';
		this.input.style.height = bbox.height + 'px';
		this.input.style.dispaly = 'block';
		this.input.value = div.innerText;
		this.input.focus();
	} 
}
