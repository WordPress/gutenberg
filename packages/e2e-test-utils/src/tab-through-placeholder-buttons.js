/**
 * Tabs through the file upload buttons that appear in a file content block's placeholder area
 *
 * @return {Promise} A promise that resolves when the browser has completed tabbing through the placeholder buttons that are unique to blocks with file-upload features.
 */
export const tabThroughPlaceholderButtons = async () => {
	const placeholderButtons = await page.$$eval( '.wp-block.is-selected .block-editor-media-placeholder button:not([disabled])',
		( elements ) => elements.map( ( elem ) => elem.className ) );

	for ( const buttonClassName of placeholderButtons ) {
		await page.keyboard.press( 'Tab' );
		const focusedPlaceholderButton = await page.evaluate( () =>
			document.activeElement.className
		);
		expect( focusedPlaceholderButton ).toEqual( buttonClassName );
	}
};
