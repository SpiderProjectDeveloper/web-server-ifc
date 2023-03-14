export class Locale {

	constructor( lang = 'en' ) 
	{
		this.lang = lang;

		this.icons = {
			save: '💾',
			attach: '⚯',
			settings: '⚙',
			works: '⚒⚒⚒',
			storeyTemplate: '✂'
		}; // 🛠 ⚯ ⛏


		this.texts = {
			undefined: { en: '', ru: '' },
			success: { en: 'Done!', ru: 'Готово!' },
			loaded: { en: 'Loaded', ru: 'Загружено' },
			bytes: { en: 'bytes', ru: 'байт' },
			project: { en: 'project', ru: 'Проект'},
			element: { en: 'Activity', ru: 'Операция'},
			picked_element: { en: 'Picked Element', ru: 'Выбранный элемент' },
			attachments: { en: 'Linking', ru: 'Связка' },
			unknown_error: { en: 'Unknown error!', ru: 'Неизвестная ошибка' },
			auth_error: { en: 'Authentification error!', ru: 'Ошибка авторизации' },
			add_child: { en: 'Add Child activity', ru: 'Добавить дочернюю операцию/фазу' },
			node_title: { en: 'Activity Name: ', ru: 'Название: ' },
			remove_node: { en: 'Remove Activity', ru: 'Удалить' },
			remove_all_child_nodes: { en: 'Remove All Children', ru: 'Удалить все дочерние узлы' },
			check_by_type: { en: '<i>Check by Type:</i>', ru: '<i>Выбрать по типу:</i>'},
			uncheck: { en: '<b>UNCHECK ALL</b>', ru: '<b>ОЧИСТИТЬ ВЫБОР</b>'},
			hide_all_except: { en: '<i>Leave visible (type):</i>', ru: '<i>Оставить видимым (тип):</i>'},
			unhide_all: { en: '<b>MAKE ALL VISIBLE</b>', ru: '<b>СДЕЛАТЬ ВИДИМЫМ ВСЕ</b>'},
			ifc_not_loaded: { en: 'The IFC file has not been loaded...', ru: 'Не удалось загрузить IFC-файл' },
			choose_ifc: { 
				en: 'Please choose an IFC file first and connect operation with elements of the 3D-model...', 
				ru: 'Пожалуйста, выберите .IFC файл и свяжите операции с элементами его 3D-модели'
			},
			project_not_loaded: { 
				en: 'No SP project has been loaded!', 
				ru: 'Проект не загружен!' 
			},
			save_project: { en: 'Save Project', ru: 'Сохранить проект' },
			nothing_to_save: {
				en: 'Nothing to save. Please connect at least one element with one operation.',
				ru: 'Ни один элемент не связан ни с одной операцией! Нечего сохранять...'
			},
			no_data: {
				en: 'No data for creating an SP project. Please choose an .ifc file and connect some activities with 3D model elements...',
				ru: 'Нет данных для создания проекта Спайдер Проджект. Пожалуйста, выберит .ifc-файл и свяжите его элементы с операциями...'
			},
			create_project_error: {
				en: 'Error while saving the changes!',
				ru: 'Ошибка при сохранении проекта в Спайдер Проджект!'
			},
			create_work_types_table_error: {
				en: 'Error saving work types table!',
				ru: 'Ошибка при сохранении таблицы типов работ!'
			},
			work_type_may_not_be_changed_or_removed: {
				en: 'This work type is used by the Project Setup Tool and may not be changed or removed!',
				ru: 'Этот тип работы используется в инструменте для автоматического создания операций и не может быть изменен или удален!'
			},
			save_project_error: {
				en: 'Error while saving the changes!',
				ru: 'Ошибка при сохранении проекта в Спайдер Проджект!'
			},
			ask_project_already_exists: {
				en: 'Project with the same name and version already exists. Update?',
				ru: 'Проект с таким именем уже существует. Обновить?'
			},			
			wait_creating_project: {
				en: 'Please wait while saving the changes in Spider Project...',
				ru: 'Подождите, пока проект сохраняется в Спайдер Проджект...'
			},
			wait_loading_ifc: {
				en: 'Please wait while processing IFC file',
				ru: 'Подождите, пока обрабатывается IFC-файл'
			},
			create_project: { en: 'Create Project', ru: 'Создать проект' },
			create_project_title: {
				en: 'Create a project in SP',
				ru: 'Создать проект Спайдер Проджект'
			},
			update_project: { en: 'Update Project', ru: 'Сохранить проект' },
			update_project_title: {
				en: 'Update a project in SP',
				ru: 'Сохранить проект Спайдер Проджект'
			},
			ifc_file: { en: 'IFC:', ru: 'IFC:' },
			ifc_file_title: { 
				en: 'An .IFC file to untegrate into the Spider Project', 
				ru: '.IFC файл для связи с проектом Спайдер Проджект' 
			},
			smart_attach: {
				en: 'Project Setup Tool',
				ru: 'Автоматическое создание операций'
			},
			smart_attach_button: {
				en: '⚯',
				ru: '⚯'
			},			
			smart_attach_button_title: {
				en: 'Automatically splits the project for storeys and create a set of works for each',
				ru: 'Автоматически разбить проект на этажи и на каэдом этаже создать набор работ'
			},			
			smart_attach_append_button: { en: '+', ru: '+' },
			smart_attach_append_button_title: { 
				en: 'Append a new work type', 
				ru: 'Добавить новый тип работ' 
			},
			save_work_types: { 
				en: '✔', 	// 'Save', 
				ru: '✔' 	// 'Сохранить' 
			},
			save_work_types_title: { 
				en: 'Save the work types into the SP project', 	// 'Save', 
				ru: 'Сохранить типы работ в проекте СП' 	// 'Сохранить' 
			},
			save_work_types_into_browser: { en: '✔+', ru: '✔+' },
			save_work_types_into_browser_title: { 
				en: "Save the work types into the SP project and copy into Browser's memory for use in future projects", 
				ru: 'Сохранить типы работ в проекте СП и скопировать в память барузера для использования в следующих проектах' 
			},
			work_types_saved: { en: 'Works saved', ru: 'Работы сохранены' },
			restore_work_types_from_browser: { 
				en: '↺', // 'Restore', 
				ru: '↺' // 'Загрузить' 
			},
			restore_work_types_from_browser_title: {
				en: "Load work types previously saved into the browser memory", 
				ru: 'Загрузить типы работ, сохраненные в памяти браузера' 
			},
			restore_work_types_from_sp: {
				en: '⟳', // "Reset", 
				ru: '⟳' //'Сброс' 
			},
			restore_work_types_from_sp_title: {
				en: "Restore original work types out of the project loaded", 
				ru: 'Восстановить исходные типы работ из загруженного проекта' 
			},
			work_types_restored_from_browser: { 
				en: 'Works restored from browser memory', 
				ru: 'Работы загружены из памяти браузера' 
			},
			work_types_restored_from_sp: { 
				en: 'Works restored from SP', 
				ru: 'Работы загружены из проекта' 
			},
			work_types_not_saved: { en: 'Works not saved...', ru: 'Работы не сохранены'},
			smart_attach_report: { 
				en: { created: 'Created', storeys: 'storeys', operations: 'operations' },
				ru: { created: 'Создано', storeys: 'этажей', operations: 'операций' }
			},
			work_type_name_placeholder: { en: 'work type name', ru: 'имя тип работы' },
			work_type_code_placeholder: { en: 'work type code', ru: 'код типа работы' },
			work_types_not_specified: { 
				en: 'Work types are not specified!', 
				ru: 'Коды типов работ не заданы!' 
			},
			work_types_encoding: { en: 'Types of Works' , ru: 'Типы работ' },
			attach_selected: { en: 'Link Selected', ru: 'Связать с выбранными' },
			attach_selected_with_all_materials: { 
				en: 'Link selected with all materials', 
				ru: 'Связать с выбранными (+ все материалы)' 
			},
			attach_selected_with_no_materials: { 
				en: 'Link selected with no materials', 
				ru: 'Связать с выбранными (без материалов)'
			},
			all_materials: { en: 'All Materials', ru: 'Все материалы' },
			no_materials: { en: 'No Materials', ru: 'Без материалов' },
			attach_material_layer: { en: 'Link material layer:', ru: 'Связать со слоем материала:' },
			attach_with_material: { en: 'Link', ru: 'Связать' },
			select_by_type: { en: 'Select by Type', ru: 'Выбрать по типу' },
			clear_attachments: { en: 'Clear linking', ru: 'Очистить связку' },
			split_with_storey_template: { en: 'Split with Template', ru: 'Разделить по шаблону' },
			model_not_loaded_disables_node_select: {
				en: 'Please load an .IFC file first, then select activities and connect these with the elements of the .IFC model(s).',
				ru: 'Вначале необходимо загрузить .IFC-файл. После этого вы сможете выделять операции и связывать их с элементами .IFC-модели'
			},
			model_not_loaded: {
				en: 'Please load an .IFC file first',
				ru: 'Вначале необходимо загрузить .IFC-файл'
			},
			create_activities_first: {
				en: 'Please create activities hierarchy and attach model elements to',
				ru: 'Вначале необходимо создать структуру из фаз/операций и прикрепить к операциям элементы модели'
			},
			division: {
				en: 'Division',
				ru: 'Захватка'
			},
			settings: { en: 'Settings', ru: 'Настройки' },
			save_settings: { en: 'Save', ru: 'Сохранить' },
			restore_settings: { en: 'Restore', ru: 'Загрузить' },
			help_title: { en: 'Help', ru: 'Справка' },
			help_text: { 
				en: 
				`<b>Creating a Project</b>:<br/>Choose an .ifc file. After it is loaded it is visualized in the middle area of the browser window (the <i>3D View</i>) and an hierarchy tree is displayed at it's right area (the <i>IFC Tree View</i>).<br/>Create an hierarchical structure (phases and operations) of your project (the <i>Activities Hierarchy View</i> that placed in the left area of the window). To add/remove elements use the right mouse button to call the context menu. You may as well move elements across the hierarchy with your mouse. Make a double click to edit the name of a phase or operation element in the hierarchy. When clicked an element is highlighted. The highlighted operation can be linked with elements of your 3D model. You have several ways to make linking:<br/>* pick an element in the 3D view, or<br/>* Check a checkbox in the <i>IFC Tree View</i>, or<br/>* Use the <i>Linking Tool</i> (the ${this.icons.attach} button).<br/>To make picking of elements easier you may hide some unnecessary elements leaving at the <i>3D View</i> only a subset of those. Right click an element in the <i>IFC Tree View</i> and check all child elements of a required type.<br/>After all the elements required are linked press the save button ${this.icons.save} to write down the changes into the Spider Project App.<br/><br/><b>Linking Tool</b><br/>First you must make a list of works each having the name, type and color code&nbsp;- the <i>Types of Works</i> window is available by clicking the ${this.icons.works} button. Next you use the ${this.icons.attach} button to open the linking tool window. For each work you add from the list you made you specify a set of materials involved choosing those from a dropdown checklist.`, 
				ru: 
				`<b>Создание проекта</b>:<br/>Выберите .ifc файл. Когда он загрузится в средней части окна браузера появится визуализация модели (<i>Окно 3D</i>), а в правой части&nbsp;- его иерархическая структура (<i>Окно IFC-структуры</i>).<br/>Создайте структуру проекта (фазы и операции) в левой части окна бразуера (<i>Окно структуры проекта</i>). При загрузке приложения <i>структура проекта</i> представлена единственным корневым элементом, который по умолчанию имеет название "Проект". Для добавления/удаления новых элементов (фаз и операций) используйте контекстное меню, которое вызывается по нажатию правой кнопки мыши на каждом элементе <i>структуры. проекта</i>. Созданные элементы можно перетаскивать с места на место внутри структуры. Редактировать имя элемента можно двойным щелчком.<br/>Щелчок мышью по элементу подсвечивает его. К подсвеченному элементу может быть привязаны элементы 3D-модели. Привязку можно сделать несколькими способами:<br/>* Щелкнув мышью по изображению элемента в <i>Окне 3D</i>.<br/>* Поставив галочку напротив элемента в <i>Окне IFC-структуры</i>.<br/>* Воспользовавшись инструментом для автоматического связывания (кнопка ${this.icons.attach}).<br/>Чтобы сделать привязку элементов по щелчку в <i>Окне 3D</i> более удобной, можно оставить видимыми на экране лишь часть элементов модели. Для этого надо щелкнуть по элементу в <i>Окне IFC-структуры</i> правой кнопкой и в открывшемся меню выбрать нужный IFC-тип&nbsp;- на экране останутся только элементы этого типа, дочерние по отношению к элементу, для которого было вызвано меню.<br/>После того, как все нужные элементы будут привязаны к операциям, нажмите кнопку ${this.icons.save}, и данные будут записаны в приложение Спайдер Проджект.<br/><br/><b>Автоматическое связывание</b><br/>Сперва вам необходимо задать список работ, указав для каждой имя, тип и цветовой код. Это делается в окне <i>Типы работ</i>, доступном по нажатию кнопки ${this.icons.works}. Затем вам следует нажать кнопку ${this.icons.attach}, чтобы открыть окно с инструментом автосвязывания. Для каждой работы в этом окне (которую вы добавляете из списка работ, сформированного ранее) вы можете задаете набор используемых материалов, выбирая их из ниспадающего списка.` 
			},
			settings: {
				netVolumeKey: { en: 'IFC Net Volume', ru: 'Net-объем IFC' },
				grossVolumeKey: { en: 'IFC Gross Volume', ru: 'Gross-объем IFC' },
				netAreaKey: { en: 'IFC Net Area', ru: 'Net-площадь IFC' },
				netSideAreaKey: { en: 'IFC Net Side Area', ru: 'Боковая Net-площадь IFC' },
				widthKey: { en: 'IFC Width', ru: 'Ширина IFC' },
				netVolumeKey: { en: 'IFC Net Volume', ru: 'Net-объем IFC' },
				exportIfcFile: { en: 'Export Ifc File', ru: 'Экспортировать .IFC-файл' },
				highlightAttached: { 
					en: 'Highlight elements already linked', 
					ru: 'Выделять уже связанные с операциями элементы' 
				},
				highlightAttachedTitle: {
					en: 'Highlight elements which has already been linked to another operation',
					ru: 'Подсвечивать элементы, которые уже были связаны с другими операциями'
				},	
				disableAttachAtCanvas: {
					en: 'Disable linking by clicking on the canvas',
					ru: 'Запретить связывание элементов щелчком по 3D-модели'
				},
				storeyTemplateMode: { en: 'Storey Template Mode', ru: 'Режим шаблона этажа' },
			}
		}

		this.help = {
			en: `<b>Creating a Project</b>:<br/>Choose an .ifc file. After it is loaded it is visualized in the middle area of the browser window (the <i>3D View</i>) and an hierarchy tree is displayed at it's right area (the <i>IFC Tree View</i>).<br/>Create an hierarchical structure (phases and operations) of your project (the <i>Activities Hierarchy View</i> that placed in the left area of the window). To add/remove elements use the right mouse button to call the context menu. You may as well move elements across the hierarchy with your mouse. Make a double click to edit the name of a phase or operation element in the hierarchy. When clicked an element is highlighted. The highlighted operation can be linked with elements of your 3D model. You have several ways to make linking:<br/>* pick an element in the 3D view, or<br/>* Check a checkbox in the <i>IFC Tree View</i>, or<br/>* Use the <i>${this.texts.smart_attach.en}</i>.<br/>To make picking of elements easier you may hide some unnecessary elements leaving at the <i>3D View</i> only a subset of those. Right click an element in the <i>IFC Tree View</i> and check all child elements of a required type.<br/>After all the elements required are linked press the save button ${this.icons.save} to write down the changes into the Spider Project App.<br/><br/><b>${this.texts.smart_attach.en}</b><br/>First you must create a list of works each having the name, type and color code&nbsp;- the <i>Works Types</i> window is available by clicking the ${this.icons.works} button. Next for some or every work type you point out a set of IFC-elements and related  materials (please use the ▷ button). By clicking the  ${this.icons.attach} button each storey of the IFC-model would be automatically parsed and a set of related operations would be created.`,
			ru: `<b>Создание проекта</b>:<br/>Выберите .ifc файл. Когда он загрузится в средней части окна браузера появится визуализация модели (<i>Окно 3D</i>), а в правой части&nbsp;- его иерархическая структура (<i>Окно IFC-структуры</i>).<br/>Создайте структуру проекта (фазы и операции) в левой части окна бразуера (<i>Окно структуры проекта</i>). При загрузке приложения <i>структура проекта</i> представлена единственным корневым элементом, который по умолчанию имеет название "Проект". Для добавления/удаления новых элементов (фаз и операций) используйте контекстное меню, которое вызывается по нажатию правой кнопки мыши на каждом элементе <i>структуры. проекта</i>. Созданные элементы можно перетаскивать с места на место внутри структуры. Редактировать имя элемента можно двойным щелчком.<br/>Щелчок мышью по элементу подсвечивает его. К подсвеченному элементу может быть привязаны элементы 3D-модели. Привязку можно сделать несколькими способами:<br/>* Щелкнув мышью по изображению элемента в <i>Окне 3D</i>.<br/>* Поставив галочку напротив элемента в <i>Окне IFC-структуры</i>.<br/>* Воспользовавшись инструментом для автоматического создания операций.<br/>Чтобы сделать привязку элементов по щелчку в <i>Окне 3D</i> более удобной, можно оставить видимыми на экране лишь часть элементов модели. Для этого надо щелкнуть по элементу в <i>Окне IFC-структуры</i> правой кнопкой и в открывшемся меню выбрать нужный IFC-тип&nbsp;- на экране останутся только элементы этого типа, дочерние по отношению к элементу, для которого было вызвано меню.<br/>После того, как все нужные элементы будут привязаны к операциям, нажмите кнопку ${this.icons.save}, и данные будут записаны в приложение Спайдер Проджект.<br/><br/><b>${this.texts.smart_attach.ru}</b><br/>Сперва вам необходимо задать список типов работ, указав для каждого имя типа, код типа и цветовой код. Это делается в окне <i>Кодировка типов работ</i>, доступном по нажатию кнопки ${this.icons.works}. По нажатию кнопки ▷, расположенной слева от каждого типа работ, открывается панель, где можно выбрать IFC-элементы и связанные с ними материалы, которые будут "прикреплены" к автоматически созданным операциям после нажатия кнопки ${this.icons.attach}.`
		}		
	}

	setLang( lang ) {
		this.lang = lang;
	}

	msg( msgCode, sectionId=null ) {
		if( sectionId !== null ) {	// Settings section
			let msgTexts = this.texts.settings[msgCode];
			if( !msgTexts ) return null;
			let msgText = msgTexts[this.lang];
			if( !msgText ) return msgTexts.en;
			return msgText;
		}

		// Main section
		let msgTexts = this.texts[msgCode];
		if( !msgTexts ) {
			return this.texts.undefined[this.lang];
		}
		let msgText = msgTexts[this.lang];
		if( !msgText ) {
			return msgTexts.en;
		}
		return msgText;
	}

	helpText() {
		// Main section
		let text = this.help[this.lang];
		if( !text ) {
			return help.en;
		}
		return text;
	}

}