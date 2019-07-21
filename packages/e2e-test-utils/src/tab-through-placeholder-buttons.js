/**
 * WordPress dependencies
 */
import {
	getElementSelectorList,
} from '@wordpress/e2e-test-utils';

export const tabThroughPlaceholderButtons = async () => {
	const placeholderButtons = await getElementSelectorList( '.wp-block.is-selected .block-editor-media-placeholder button:not([disabled])' );

	for ( const buttonClassName of placeholderButtons ) {
		await page.keyboard.press( 'Tab' );
		const focusePlaceholderButton = await page.evaluate( () =>
			document.activeElement.className
		);
		await expect( focusePlaceholderButton ).toEqual( buttonClassName );
	}
};
