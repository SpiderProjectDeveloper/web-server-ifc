import { SettingsWindow } from "./settingswindow";

export class IndexControls 
{
	getProjectName() {
		if( !this.projectName || !this.projectName.value) return '';
		return this.projectName.value;
	}

	setProjectName( _name ) {
		let name = '';
		for( let i = 0 ; i < _name.length ; i++ ) {
			name += (_name[i] !== ' ') ? _name[i] : '_'; 
		}
		this.projectName.value = name;
	}

	getProjectVersion() {
		return this.projectVersion.value;
	}

	setProjectVersion( version ) {
		this.projectVersion.value = version;
	}

	constructor( initer, locale ) 
	{
		this.initer = initer;
		this.locale = locale;

		const sw = new SettingsWindow( initer, locale );

		this.help = document.getElementById('index-help-button');
		this.settings = document.getElementById('index-settings-button');
		this.filePrompt = document.getElementById('index-file-prompt');
		this.file = document.getElementById('index-file-input');
		this.highlightAttached = document.getElementById('index-highlight-attached');
		this.storeyTemplateSwitch = document.getElementById('index-storey-template-switch');
		this.save = document.getElementById('index-save-button');
		this.projectName = document.getElementById('index-project-name');
		this.projectVersion = document.getElementById('index-project-version');
		this.workTypes = document.getElementById('index-work-types-button');	

		this.workTypes.innerHTML = locale.icons.works;
		this.workTypes.title = locale.msg('work_types_encoding');

		this.storeyTemplateSwitch.className = 'index-storey-template-switch-off';
		this.storeyTemplateSwitch.innerHTML = locale.icons.storeyTemplate;
		this.storeyTemplateSwitch.onclick = function () {
			initer.storeyTemplateSwitchOn = !initer.storeyTemplateSwitchOn;
			this.setStoreyTemplateSwitchClass();
			if( initer.storeyTemplateSwitchCallback ) {
				initer.storeyTemplateSwitchCallback();
			}
		}.bind(this);
		this.setStoreyTemplateSwitchClass();

		this.save.title = locale.msg('save_project');
		this.save.innerHTML = locale.icons.save; // locale.msg('update_project');

		if( initer.projectId ) {		
			this.projectName.value = initer.projectId;
			this.projectVersion.value = initer.projectVersion;

			this.disableFilePicker();
		} 
		else 
		{
			this.enableFilePicker();
		}

		this.settings.innerHTML = locale.icons.settings;
		this.settings.onclick = function(e) { sw.show(); };

		this.ifcFileUploaded = false;
	}

	disableFilePicker() {
		this.filePickerEnabled = false;
		this.filePrompt.style.display = 'none';		
		this.file.style.display = 'none';
	}

	enableFilePicker() {
		this.filePickerEnabled = true;
		this.filePrompt.style.display = 'inline-block';		
		this.file.style.display = 'inline-block';		
		this.filePrompt.innerHTML = this.locale.msg('ifc_file');
		this.filePrompt.title = this.locale.msg('ifc_file_title');
	}

	setStoreyTemplateSwitchClass() 
	{
		if( this.initer.storeyTemplateSwitchOn ) {
			this.storeyTemplateSwitch.className = 'index-storey-template-switch-on';
		} else {
			this.storeyTemplateSwitch.className = 'index-storey-template-switch-off';
		}
	}
}