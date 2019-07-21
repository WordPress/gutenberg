/**
 * WordPress dependencies
 */
import {
	insertBlock,
	textContentAreas,
} from '@wordpress/e2e-test-utils';

export async function insertAndPopulateBlock( blockName, content ) {
	await insertBlock( blockName );
	await page.keyboard.type( content );

	const blocks = await textContentAreas( { empty: true } );

	// the first contentEditable has focus - tab through and populate the rest:
	for ( let i = 0; i < blocks.length; i++ ) {
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( content );
	}
	await page.keyboard.press( 'Enter' );
}
