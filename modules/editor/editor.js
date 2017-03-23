export default class Editor {
	constructor( id, settings ) {
		const blocks = wp.blocks.parse( settings.content );
		console.log( blocks ); // eslint-disable-line no-console

		if ( ! blocks.length ) {
			return;
		}

		wp.element.render(
			wp.blocks.createBlockElement( blocks[ 1 ] ),
			document.getElementById( id )
		);
	}
}
