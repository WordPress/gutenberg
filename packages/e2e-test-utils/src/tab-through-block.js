/**
 * WordPress dependencies
 */
import {
	externalWrapperHasFocus,
	inserterToggleHasFocus,
	tabThroughBlockMoverControl,
	tabThroughBlockToolbar,
} from '@wordpress/e2e-test-utils';

/**
 * Tabs through a content block and asserts that the external wrapper, inserter toggle, mover controls, and toolbar buttons all receive keyboard focus.
 *
 * @param {string} blockType  The expected value of the data-type attribute of the block's external wrapper
 * @returns {Promise} A promise that's resolved when the browser has finished tabbing through the major components of a common block.
 */

export async function tabThroughBlock( blockType ) {
	// Tab to the next block
	await page.keyboard.press( 'Tab' );
	await externalWrapperHasFocus( blockType );

	// Tab causes 'add block' button to receive focus
	await page.keyboard.press( 'Tab' );
	await inserterToggleHasFocus();

	await tabThroughBlockMoverControl();
	await tabThroughBlockToolbar();
}
