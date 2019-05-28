/**
 * Navigate through a block's toolbar using the keyboard. Asserts that each button receives focus.
 */

export async function tabThroughBlockToolbar() {
	const blockToolbarButtons = await page.evaluate( () => {
		// return an array with the classNames of the block toolbar's buttons
		return [].slice.call(
			document.querySelectorAll( '.block-editor-block-contextual-toolbar button:not([disabled])' )
		).map( ( elem ) => elem.className );
	} );

	for ( const buttonClassName of blockToolbarButtons ) {
		await page.keyboard.press( 'Tab' );
		const focusedBlockToolBarButton = await page.evaluate( () =>
			document.activeElement.className
		);
		await expect( focusedBlockToolBarButton ).toEqual( buttonClassName );
	}
}
