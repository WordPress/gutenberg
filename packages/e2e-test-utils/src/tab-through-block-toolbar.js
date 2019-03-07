/**
 * Navigate through a block's toolbar using the keyboard
 */

export async function tabThroughBlockToolbar() {
	const blockToolbarButtons = await page.evaluate( () => {
		// return an array with the classNames of the block toolbar's buttons
		return [].slice.call(
			document.querySelectorAll( '.editor-block-contextual-toolbar button' )
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
