/*
import { IFCWALL, IFCWALLSTANDARDCASE, IFCDOOR, IFCWINDOW } from 'web-ifc';

export function initTypesList(typesListWindow) {
	typesListWindow.add(IFCWALL, 'Wall', true);
	typesListWindow.add(IFCWALLSTANDARDCASE, 'Wall Standard Case', true);
	typesListWindow.add(IFCDOOR, 'Door', true);
	typesListWindow.add(IFCWINDOW, 'Window', true);
}
*/

export function isoToUtf8( text ) {
	if( !text ) return '';
	 
	let isDecoded = false;
	let decoded = '';

	for( let i = 0 ; i < text.length-4 ; i++ ) {
		if( text[i] !== '\\' ) {
			decoded += text[i];
			continue;			
		}
		if( text[i+1] !== 'X' || text[i+2] !== '2' || text[i+3] !== '\\' ) continue;
		let j = i+4;
		for(  ; j < text.length-4 ; j+=4 ) {
			if( text[j] === '\\' ) break;
			let snum = text[j] + text[j+1] + text[j+2] + text[j+3];
			decoded += String.fromCharCode( parseInt(snum, 16));
			if( !isDecoded ) isDecoded = true;
		} 
		i = j+3;
	}
	if( isDecoded ) {
		return decoded;
	}
	return text;
}
