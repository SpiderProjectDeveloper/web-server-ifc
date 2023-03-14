import indexHTML from './index.html';

export class Initializer {
	w = null;	
	h = null;
	appContainer = null;
	user = null;
	sessId = null;
	projectId = null;
	lang = null;

	constructor() {
		this.projectExistsUrl = '/.project_exists';
		this.createProjectUrl = '/.create_project';
		this.setTableUrl = '/.set_table';
		this.setIfcUrl = '/.set_ifc';
		this.dataUrl = '/.model_data';
		this.modelUrl = '/.get_ifc'; 

		this.settingsStorageKey = 'settings';
		this.smartAttachWorksStorageKey = 'smartAttachWorks';
		this.workTypesStorageKey = 'workTypes';

		this.settings = {
			netVolumeKey : 'NetVolume', 
			grossVolumeKey : 'GrossVolume',
			netAreaKey : 'NetArea',
			netSideAreaKey : 'NetSideArea',
			widthKey : 'Width',
			exportIfcFile: false,
			highlightAttached: true,
			disableAttachAtCanvas: false,
		};

		this.storeyTemplateSwitchOn = false;
		this.storeyTemplateSwitchCallback = null;
		
		// setCookie('user', 'A User');
		// setCookie('sess_id', 'sessionid');
		// setCookie('lang', 'ru');

		// Reading project id
		let query = this.parseSearchQuery();
		if( ('projectId' in query) ) {
			this.projectId = query.projectId;
			let splitted = this.projectId.split('.');
			if( splitted.length === 3 ) {
				this.projectCode = splitted[0];
				this.projectVersion = Number(splitted[1]);
				if( isNaN(this.projectVersion) ) { 
					this.projectVersion = 1; 
				}
			} 
		}
		if( ('user' in query) ) {
			this.user = query.user;
			//setCookie('user', this.user);
		}
		if( ('sessId' in query) ) {
			this.sessId = query.sessId;
			setCookie('sess_id', this.sessId);
		}
		if( ('lang' in query) ) {
			this.lang = query.lang;
		}

		/*
		let searchArray = window.location.search.split('&');
		if( searchArray.length > 0 ) {
			let firstPair = searchArray[0].split('=');
			this.projectId = firstPair[1];
		}
		*/

		let script = document.getElementById('bundle');
		if( script ) {	
			let appContainerName = script.getAttribute('data-appcontainer');
			if(appContainerName) { 
				this.appContainer = document.getElementById(appContainerName);
			}
			this.user = script.getAttribute('data-user');
		}

		if( this.user === null ) {
			let cookieUser = getCookie( 'user' );
			if( cookieUser !== null ) {
				this.user = cookieUser;
			}
		}
		if( this.user === null ) { 
			this.user = 'NoName';
		}

		if( this.sessId === null ) {
			let cookieSessId = getCookie( 'sess_id' ); 	// Reading the session id from cookie if not set in command line
			if( cookieSessId !== null ) {
				this.sessId = cookieSessId;
			}
		}

		if( this.lang === null ) {
			let cookieLang = getCookie( 'lang' ); 	// Reading the language setting if not set in command line
			if( cookieLang !== null ) {
				this.lang = cookieLang;
			} 
		}

		this.updateResize();		
	}

	updateResize() {
		if( this.appContainer ) {
			this.appContainer.innerHTML = indexHTML;
			let r = appContainer.getBoundingClientRect();
			this.w = r.width;
			this.h = r.height;
		} else { 
			document.body.innerHTML = indexHTML;
			this.w = window.innerWidth;
			this.h = window.innerHeight;
		}
		this.hh = 40;
		this.contentH = this.h - this.hh;
		this.contentW = this.w;

		this.gntL = 0;
		this.gntT = 0;
		this.gntW = Math.floor( this.contentW / 4 );
		this.gntH = this.contentH;

		this.canvasL = Math.floor( this.contentW / 10 ); // this.gntW;
		this.canvasT = 0;
		this.canvasW = Math.floor(this.contentW - this.canvasL) * 0.95;
		this.canvasH = this.contentH;

		this.toolboxL = Math.floor( this.contentW* 0.10 );
		this.toolboxT = 0;
		this.toolboxW = this.contentW - this.toolboxL;
		this.toolboxH = this.contentH;

		let pageHeaderElem = document.getElementById('index-header');
		pageHeaderElem.style.height = this.hh + 'px';
		pageHeaderElem.style.width = this.w + 'px'; 

		let pageContentElem = document.getElementById('index-content');
		pageContentElem.style.height = this.contentH + 'px';
		pageContentElem.style.width = this.contentW + 'px'; 

		this.canvasElem = document.getElementById('ifc-canvas');
		this.canvasElem.style.left = this.canvasL + 'px'; 		
		this.canvasElem.style.top = this.canvasT + 'px';
		this.canvasElem.style.width = this.canvasW + 'px'; 		
		this.canvasElem.style.height = this.canvasH + 'px';

		this.toolboxElem = document.getElementById('ifc-toolbox');
		this.toolboxL = this.contentW - Math.floor(this.contentW * 0.15);
		this.toolboxT = 0;
		this.toolboxW = this.contentW - this.toolboxL;
		this.toolboxH = this.contentH;
		this.toolboxElem.style.left = this.toolboxL + 'px';
		this.toolboxElem.style.top = this.toolboxT + 'px';
		this.toolboxElem.style.width = this.toolboxW + 'px'; 		
		this.toolboxElem.style.height = this.toolboxH + 'px';

		this.treeviewElem = document.getElementById('ifc-treeview');
		this.treeviewElem.style.width = this.toolboxW + 'px'; 		
		this.treeviewElem.style.height = this.toolboxH + 'px';
		this.treeviewElem.style.fontSize = '12px';

		this.gntElem = document.getElementById('gnt');
		this.gntElem.style.left = this.gntL + 'px';
		this.gntElem.style.top = this.gntT + 'px';
		this.gntElem.style.width = this.gntW + 'px'; 		
		this.gntElem.style.height = this.gntH + 'px';
	}

	parseSearchQuery() {
		let r = {};
		if( window.location.search.length < 2 ) return r;
	
		let query = window.location.search.substring(1);
		if( query.indexOf('=') === -1 ) {	 // No '=' if no key-value pairs - project id only then
			r.projectId = query;
			return r;
		}
		var pairs = query.split('&');
		for( let pair of pairs ) {
			let kv = pair.split('=');
			let k = decodeURIComponent(kv[0]);
			if( k !== null && k !== '' ) {
				let v = decodeURIComponent(kv[1]);
				if( v !== null && v !== '' ) {
					r[k] = v;
				}
			}
		}
		return r;
	}

	setStoreyTemplateSwitchCallback( cb ) 
	{
		this.storeyTemplateSwitchCallback = cb;
	}
}

function deleteCookie( cname ) {
	document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=" + window.location.pathname;
}

function getCookie( cname, type='string' ) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for( let i = 0 ; i < ca.length ; i++ ) {
		let c = ca[i];
		while( c.charAt(0) == ' ' ) {
			c = c.substring(1);
		}
		if( c.indexOf(name) == 0 ) {
			let value = c.substring(name.length, c.length);
			if( type == 'string' ) {
				return value;
			}
			if( type == 'int' ) {
				let intValue = parseInt(value);
				if( !isNaN(intValue) ) {
					return intValue;
				}
			}
			if( type == 'float' ) {
				let floatValue = parseFloat(value);
				if( !isNaN(floatValue) ) {
					return floatValue;
				}
			}
			return null;
		}
	}
	return null;
}

function setCookie( cname, cvalue, exdays=3650 ) {
	if( exdays == null ) {
		document.cookie = cname + "=" + cvalue + "; path=/";
	}
	else {
		let d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		let expires = "expires="+ d.toUTCString();		
		document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
		//document.cookie = cname + "=" + cvalue + "; " + expires + "; path=" + window.location.pathname;
		//document.cookie = cname + "=" + cvalue + ";" + expires;
	}
}
