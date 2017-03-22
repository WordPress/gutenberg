export default class Editor {
	constructor( id ) {
		const blocks = wp.blocks.findBlockNodes( document.getElementById( id ) );
		console.log( blocks ); // eslint-disable-line no-console
	}
}
