import { parse } from './grammar';

export default class Editor {
	constructor( id, settings ) {
		const blocks = parse( settings.content );
		console.log( blocks ); // eslint-disable-line no-console

		document.getElementById( id ).innerHTML = settings.content;
	}
}
