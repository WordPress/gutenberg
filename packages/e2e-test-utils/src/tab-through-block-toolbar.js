/**
 * Navigate through a block's toolbar using the keyboard. Asserts that each button receives focus.
 * @return {Promise} A promise that resolves when it's finished tabbing through the buttons in a block's toolbar, asserting that each one received focus.
 */

export async function tabThroughBlockToolbar() {
	const blockToolbarButtons = await page.$$eval( '.block-editor-block-contextual-toolbar button:not([disabled])',
		( elements ) => elements.map( ( elem ) => elem.className ) );

	for ( const buttonClassName of blockToolbarButtons ) {
		await page.keyboard.press( 'Tab' );
		const focusedBlockToolBarButton = await page.evaluate( () =>
			document.activeElement.className
		);
		expect( focusedBlockToolBarButton ).toEqual( buttonClassName );
	}
}
