
export class WindowWidthResizeWidget {

	constructor( parent, side, callback ) 
	{
		let sizeToolDiv = document.createElement('div');
		sizeToolDiv.style.position = 'absolute';
		sizeToolDiv.style.cursor = 'pointer';
		let bbox = parent.getBoundingClientRect();
		if( side === -1 || side === 'left') {
			//sizeToolDiv.style.left = -5+'px';
			sizeToolDiv.style.left = (bbox.left-4) +'px';
		} else {
			//sizeToolDiv.style.right = 0+'px';
			sizeToolDiv.style.left = (bbox.right-4)+'px';
		}
		sizeToolDiv.style.top = Math.round(bbox.height/2) + 'px';
		sizeToolDiv.innerHTML = (side === -1) ? '❮' : '❯'; // 'ᐊ'; //'🡰';
		
		//parent.appendChild(sizeToolDiv);
		document.body.appendChild(sizeToolDiv);

		sizeToolDiv.addEventListener( 
			'mousedown', 
			function(e) {
				let previousX = e.screenX

				const onMouseMove = function(e) {					
					let dx = e.screenX - previousX;
					let left = parseInt(sizeToolDiv.style.left);
					let parentLeft = parseInt(parent.style.left);
					let parentWidth = parseInt(parent.style.width);
					if( side === -1 ) {
						left += dx;
						parentLeft += dx;
						parentWidth -= dx;
						parent.style.left = parentLeft + 'px'; 
						parent.style.width = parentWidth + 'px'; 
						sizeToolDiv.style.left = left + 'px';
					} else {
						left += dx;
						parentWidth += dx;
						parent.style.width = parentWidth + 'px'; 
						sizeToolDiv.style.left = left + 'px';
					}
					previousX = e.screenX;
					callback( parentWidth );
				}

				const onMouseUp = function(e) {
					document.body.removeEventListener( 'mousemove', onMouseMove );
					document.body.removeEventListener( 'mouseup', onMouseUp );
				} 

				document.body.addEventListener( 'mousemove', onMouseMove );
				document.body.addEventListener( 'mouseup', onMouseUp );		
			}
		);
	}
}