import { TooltipWindow } from './tooltipwindow'
import './settingswindow.css';

export class SettingsWindow {

	constructor( initer, locale ) {
		this.initer = initer;
		this.locale = locale;

		let title = this.locale.msg('settings');

		const okCallback = function() {
			let kv = this.readSettingsFromWindow();
			for( let key in kv ) {
				initer.settings[key] = kv[key];
			}
		}.bind(this);

		this.twindow = new TooltipWindow( null, 
		{ 
			title: title,
			w: Math.floor( window.innerWidth * 0.5 ), 
			h: Math.floor( window.innerHeight * 0.7 ),
			okButton: { callback: okCallback, arg: null } 
		});

		this.containerDiv = document.createElement('div');
		this.containerDiv.className = 'settingsContainer';

		this.saveDiv = document.createElement('div');
		this.saveDiv.className = 'settingsSave';
		this.saveDiv.innerHTML = this.locale.msg('save_settings');
		this.saveDiv.onclick = function(e) {
			this.saveSettings();
		}.bind(this);
		this.containerDiv.appendChild( this.saveDiv );

		this.restoreDiv = document.createElement('div');
		this.restoreDiv.className = 'settingsRestore';
		this.restoreDiv.innerHTML = this.locale.msg('restore_settings');
		this.restoreDiv.onclick = function(e) {
			this.restoreSettings();
		}.bind(this);
		this.containerDiv.appendChild( this.restoreDiv );

		for( let key in this.initer.settings ) {
			let inputContainerDiv = document.createElement('div');
			inputContainerDiv.className = 'settingsInputContainer';
			this.containerDiv.appendChild( inputContainerDiv );

			let title = this.locale.msg(key, 'settings');
			if( title === null ) {
				title = key[0].toUpperCase();
				for( let i = 1 ; i < key.length ; i++ ) {
					if( key[i] >= 'A' && key[i] <= 'Z' ) {
						title += ' ';
					}
					title += key[i];
				}
			}

			let prompt = this.locale.msg(key+'Title', 'settings');

			let inputPromptDiv = document.createElement('div');
			inputPromptDiv.className = 'settingsInputPrompt';
			inputPromptDiv.innerHTML = title;
			if( prompt ) {
				inputPromptDiv.title = prompt;
			}
			inputContainerDiv.appendChild(inputPromptDiv);

			let input = document.createElement('input');
			input.className = 'settingsInput';
			if( prompt ) {
				input.title = prompt;
			}
			input.placeholder = title;
			input.dataset.key = key;
			let type = typeof(this.initer.settings[key]);
			input.dataset.type = type;
			if( type === 'string' ) {
				input.type = 'text';
			} else if( type === 'boolean' ) {
				input.type = 'checkbox';
			}
			inputContainerDiv.appendChild( input );
		}
		this.initSettingsWindow( this.initer.settings );
	}

	show() {
		if( this.twindow.isHidden() ) {
			this.initSettingsWindow( this.initer.settings );
			this.twindow.show( this.containerDiv );
		} else {
			this.twindow.hide();
		}
	}

	hide() {
		this.twindow.hide();
	}

	saveSettings() {
		let kv = this.readSettingsFromWindow();
		localStorage.setItem(this.initer.settingsStorageKey, JSON.stringify(kv));
	}

	restoreSettings() {
		let kv = localStorage.getItem(this.initer.settingsStorageKey);
		kv = JSON.parse( kv );
		if( kv ) {
			this.writeSettingsToWindow(kv);
		}
	}

	readSettingsFromWindow() {
		let kv = {};
		for( let c of this.containerDiv.children ) {
			if( c.className !== 'settingsInputContainer') { continue };
			for( let c_ of c.children ) {
				if( c_.className !== 'settingsInput') { continue };
				let key = c_.dataset.key;
				let type = c_.dataset.type;
				let value = (type==='string') ? c_.value : ((type==='boolean') ? c_.checked : null);
				if( value !== null ) {				
					kv[key] = value;
				}
				break;
			}
		}
		return kv;
	}

	writeSettingsToWindow(kv) {
		for( let c of this.containerDiv.children ) {
			if( c.className !== 'settingsInputContainer') { continue };
			for( let c_ of c.children ) {
				if( c_.className !== 'settingsInput') { continue };
				c_.value = '';
				let key = c_.dataset.key;
				if( key in kv ) {
					if( c_.dataset.type === 'string' ) {
						c_.value = kv[key];
					} else if( c_.dataset.type === 'boolean' ) {
						c_.checked = kv[key];
					}
				}
				break;
			}
		}
	}

	initSettingsWindow( settings ) {
		for( let c of this.containerDiv.children ) {
			if( c.className !== 'settingsInputContainer') { continue };
			for( let c_ of c.children ) {
				if( c_.className !== 'settingsInput') { continue };
				let key = c_.dataset.key;
				if( key in settings ) {
					if( typeof(settings[key]) === 'string' ) {
						c_.value  = settings[key];
					} else if( typeof(settings[key]) === 'boolean' ) {
						c_.checked = settings[key];
					} 
				}
				break;
			}
		}
	}
} 