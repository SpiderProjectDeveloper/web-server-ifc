import './tooltipwindow.css';

export class TooltipWindow {

	constructor( parentDiv=null, settings={} ) {
		this.settings = settings;

		this.closeOnOk = ('closeOnOk' in settings) ? settings.closeOnOk : true;

		let h = ('h' in settings) ? settings.h : Math.round(window.innerHeight/3);
		let hh = 24;

		this.div = document.createElement('div');
		this.div.className = 'tooltipWindow';
		this.div.style.left = ('x' in settings) ? settings.x+'px' : (Math.round(window.innerHeight/10) + 'px');
		this.div.style.top = ('y' in settings) ? settings.y+'px' : (Math.round(window.innerHeight/10) + 'px');
		this.div.style.width = ('w' in settings) ? settings.w+'px' : (Math.round(window.innerWidth/4) + 'px');
		this.div.style.height = h + 'px';
		this.div.style.display = 'none';

		this.headerDiv = document.createElement('div');
		this.headerDiv.className = 'tooltipWindowHeader';

		this.closeDiv = document.createElement('div');
		this.closeDiv.className = 'tooltipWindowClose';
		this.closeDiv.innerHTML = '&#10060;'; // 	✕ &#128940;
		this.closeDiv.onclick = function(e) {
			this.div.style.display = 'none';
		}.bind(this);
		this.headerDiv.appendChild(this.closeDiv);

		if( 'okButton' in settings ) {
			this.okDiv = document.createElement('div');
			this.okDiv.className = 'tooltipWindowOk';
			this.okDiv.innerHTML = '✓'; // 	✕ &#128940;
			this.okDiv.onclick = function(e) {
				if( this.closeOnOk ) {
					this.div.style.display = 'none';
				}
				settings.okButton.callback( settings.okButton.arg );
			}.bind(this);	
			this.headerDiv.appendChild(this.okDiv);
		} 
		
		this.moveDiv = document.createElement('div');
		this.moveDiv.style.position = 'relative';
		this.moveDiv.style.color = '#ffffff';
		this.moveDiv.style.cursor = 'pointer';
		this.moveDiv.style.marginLeft = '4px';
		this.moveDiv.style.display = 'inline-block';
		this.moveDiv.innerHTML = (settings.title) ? settings.title : '&#128204;'; // 	📌 ✕ &#128940;
		this.moveDiv.addEventListener( 'mousedown', function(e) {
			e.stopPropagation(); 
			e.preventDefault(); 
			let originalX = e.screenX, originalY = e.screenY;

			const onMouseMove = function(e) {
				e.stopPropagation(); 
				e.preventDefault(); 	
				let dx = e.screenX - originalX, dy = e.screenY - originalY;
				let oldX = parseInt(this.div.style.left);
				let oldY = parseInt(this.div.style.top);
				this.div.style.left = oldX + dx + 'px';
				this.div.style.top = oldY + dy + 'px';
				originalX = e.screenX;
				originalY = e.screenY;
			}.bind(this);

			const onMouseUp = function(e) {
				document.removeEventListener( 'mouseup', onMouseUp );
				document.removeEventListener( 'mousemove', onMouseMove );
			}.bind(this);

			document.addEventListener( 'mouseup', onMouseUp );
			document.addEventListener( 'mousemove', onMouseMove );
			
		}.bind(this) );

		this.moveDiv.addEventListener( 'selectstart', function(e) { 
			e.stopPropagation(); 
			e.preventDefault(); 
			return false; 
		} );
		this.headerDiv.appendChild(this.moveDiv);

		this.contentDiv = document.createElement('div');
		this.contentDiv.style.position = 'relative';
		this.contentDiv.style.width = '100%';
		this.contentDiv.style.height = (h - hh) + 'px'; 
		this.contentDiv.style.overflow = 'auto'; 
		this.contentDiv.style.padding = '2px';
		this.contentDiv.style.color = '#ffffff';
		this.contentDiv.innerHTML = '';
		this.div.style.backgroundColor = 'rgba(50, 50, 50, 0.75)';

		this.div.appendChild(this.headerDiv);
		this.div.appendChild(this.contentDiv);

		this.resizeDiv = document.createElement('div');
		this.resizeDiv.style.position = 'absolute';
		this.resizeDiv.style.right = '2px';
		this.resizeDiv.style.bottom = '0px';
		this.resizeDiv.style.cursor = 'pointer';
		this.resizeDiv.style.color = '#ffffff';
		this.resizeDiv.style.fontSize = '18px';
		this.resizeDiv.style.fontWeight = 'bold';
		this.resizeDiv.innerHTML = '⤡';
		this.div.appendChild(this.resizeDiv);
		this.resizeDiv.addEventListener( 'mousedown', function(e) {
			e.stopPropagation(); 
			e.preventDefault(); 
			let originalX = e.screenX, originalY = e.screenY;

			const onMouseMove = function(e) {
				e.stopPropagation(); 
				e.preventDefault(); 	
				let dx = e.screenX - originalX, dy = e.screenY - originalY;
				let oldW = parseInt(this.div.style.width);
				let oldH = parseInt(this.div.style.height);
				this.div.style.width = oldW + dx + 'px';
				this.div.style.height = oldH + dy + 'px';
				let oldContentH = parseInt(this.contentDiv.style.height);
				this.contentDiv.style.height = oldContentH + dy + 'px';
				originalX = e.screenX;
				originalY = e.screenY;
			}.bind(this);

			const onMouseUp = function(e) {
				document.removeEventListener( 'mouseup', onMouseUp );
				document.removeEventListener( 'mousemove', onMouseMove );
			}.bind(this);

			document.addEventListener( 'mouseup', onMouseUp );
			document.addEventListener( 'mousemove', onMouseMove );
			
		}.bind(this) );

		if( parentDiv === null ) {
			parentDiv = document.body;
		}
		parentDiv.appendChild(this.div);
	}

	show( message, x=null, y = null, w = null, h = null ) {
		//if( this.contentDiv.innerHTML.length > 0 ) {
		//	this.contentDiv.innerHTML = undefined;
		//}
		while(this.contentDiv.hasChildNodes()) {
			this.contentDiv.removeChild(this.contentDiv.lastChild);
		}
		if( typeof(message) === 'object' ) {
			this.contentDiv.appendChild(message);
		} else {
			this.contentDiv.innerHTML = message;
		}
		if( x !== null ) {
			this.div.style.left = x + 'px';	
		}
		if( y !== null ) {
			this.div.style.top = y + 'px';	
		}
		if( w !== null ) {
			this.div.style.width = w + 'px';	
		}
		if( h !== null ) {
			this.div.style.height = x + 'px';	
		}
		this.div.style.display = 'block';
	}

	hide() {
		this.div.style.display = 'none';
	}

	isHidden() {
		return (this.div.style.display === 'none');
	}
} 