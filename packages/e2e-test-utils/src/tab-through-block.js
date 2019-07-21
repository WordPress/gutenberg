/**
 * WordPress dependencies
 */
import {
	externalWrapperHasFocus,
	inserterToggleHasFocus,
	tabThroughBlockMoverControl,
	tabThroughBlockToolbar,
} from '@wordpress/e2e-test-utils';

export async function tabThroughBlock( content, blockType ) {
	// Tab to the next block
	await page.keyboard.press( 'Tab' );
	await externalWrapperHasFocus( blockType );

	// Tab causes 'add block' button to receive focus
	await page.keyboard.press( 'Tab' );
	await inserterToggleHasFocus();

	await tabThroughBlockMoverControl();
	await tabThroughBlockToolbar();
}
