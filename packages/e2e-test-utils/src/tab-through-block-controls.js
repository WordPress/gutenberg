/**
 * Internal dependencies
 */
import { externalWrapperHasFocus } from './external-wrapper-has-focus';
import { tabThroughBlockMovers } from './tab-through-block-movers';
import { tabThroughBlockToolbar } from './tab-through-block-toolbar';

/**
 * Asserts that a content block's inserter toggle has keyboard focus
 *
 * @return {Promise} A promise that's resolved when the active element is evaluated and asserted to have the inserter toggle's classname.
 */

const inserterToggleHasFocus = async function() {
	const isFocusedInserterToggle = await page.evaluate( () => document.activeElement.classList.contains( 'block-editor-inserter__toggle' ) );
	expect( isFocusedInserterToggle ).toBe( true );
};

/**
 * Tabs through a content block and asserts that the external wrapper, inserter toggle, mover controls, and toolbar buttons all receive keyboard focus.
 *
 * @param {string} blockType  The expected value of the data-type attribute of the block's external wrapper
 * @return {Promise} A promise that's resolved when the browser has finished tabbing through the major components of a common block.
 */

export async function tabThroughBlockControls( blockType ) {
	// Tab to the next block
	await page.keyboard.press( 'Tab' );
	await externalWrapperHasFocus( blockType );

	// Tab causes 'add block' button to receive focus
	await page.keyboard.press( 'Tab' );
	await inserterToggleHasFocus();

	await tabThroughBlockMovers();
	await tabThroughBlockToolbar();
}
