/**
 * Internal dependencies
 */
import { wpDataSelect } from './wp-data-select';

/**
 * Returns an array with all blocks; Equivalent to calling wp.data.select( 'core/block-editor' ).getBlocks();
 *
 * @return {Promise} Promise resolving with an array containing all blocks in the document.
 */
export async function getAllBlocks() {
	const blocks = wpDataSelect( 'core/block-editor', 'getBlocks' );
	//if ( typeof blocks === 'undefined' ) {
	const listener = ( message ) => {
		// eslint-disable-next-line no-console
		console.log( message.text() );
	};
	page.on( 'console', listener );
	await page.evaluate( () => {
		const _blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		// eslint-disable-next-line no-console
		console.log( _blocks, JSON.stringify( _blocks ) );
	} );
	page.off( 'console', listener );
	//}
	return blocks;
}
