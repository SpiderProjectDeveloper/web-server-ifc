

export class ColorPicker {

	constructor( props ) {
		this.target = props.target;
		if( props.show ) {
			this.show();
		}

		this.container = document.createElement
	}


	show() {

	}
}


class ColorSlider {
	constructor() {
		this.containerDiv = document.createElement('div');

		this.colorDiv = document.createElement('div');
		this.containerDiv.appendChild(this.colorDiv);
		this.colorDiv.style.backgroundColor = 'linear-gradient(to left, #ff0000, #000000)';

	}
}