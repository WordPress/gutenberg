import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Distraction free mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test( 'should hide the inserter beside an empty paragraph', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const emptyBlockInserter = page.locator(
			'.block-editor-block-list__empty-block-inserter'
		);

		await editor.insertBlock( { name: 'core/paragraph' } );
		await expect( emptyBlockInserter ).toBeVisible();

		// Toggle distraction free mode on.
		await pageUtils.pressKeys( 'primaryShift+\\' );
		await expect( page.locator( '.editor-editor-interface' ) ).toHaveClass(
			/is-distraction-free/
		);
		await editor.canvas
			.getByRole( 'document', { name: 'Empty block' } )
			.click();
		await expect( emptyBlockInserter ).toBeHidden();

		// Toggle distraction free mode off.
		await pageUtils.pressKeys( 'primaryShift+\\' );
		await expect(
			page.locator( '.editor-editor-interface' )
		).not.toHaveClass( /is-distraction-free/ );
		await editor.canvas
			.getByRole( 'document', { name: 'Empty block' } )
			.click();
		await expect( emptyBlockInserter ).toBeVisible();
	} );
} );
