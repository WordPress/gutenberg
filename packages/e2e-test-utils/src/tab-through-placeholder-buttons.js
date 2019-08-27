/**
 * WordPress dependencies
 */
import {
	getElementSelectorList,
} from '@wordpress/e2e-test-utils';

/**
 * Tabs through the file upload buttons that appear in a file content block's placeholder area
 * @return {Promise} A promise that resolves when the browser has completed tabbing through the placeholder buttons that are unique to blocks with file-upload features.
 */
export const tabThroughPlaceholderButtons = async () => {
	const placeholderButtons = await getElementSelectorList( '.wp-block.is-selected .block-editor-media-placeholder button:not([disabled])' );

	for ( const buttonClassName of placeholderButtons ) {
		await page.keyboard.press( 'Tab' );
		const focusePlaceholderButton = await page.evaluate( () =>
			document.activeElement.className
		);
		expect( focusePlaceholderButton ).toEqual( buttonClassName );
	}
};
