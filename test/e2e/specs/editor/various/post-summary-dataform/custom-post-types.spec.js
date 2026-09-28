const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors the 'should be able to create an hierarchical post without title
 * support' test of `test/e2e/specs/editor/plugins/custom-post-types.spec.js`
 * with the DataForm inspector experiment enabled; delete that test there when
 * the experiment graduates. The other tests of that classic file don't drive
 * the summary and stay where they are.
 */
test.describe( 'Test Custom Post Types (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should be able to create an hierarchical post without title support', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'hierar-no-title' } );
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Parent Post' );
		await editor.publishPost();

		// Create a post that is a child of the previously created post.
		await admin.createNewPost( { postType: 'hierar-no-title' } );
		const summary = await openPostSummary( {
			editor,
			page,
			tab: 'Hierarchical No Title',
		} );

		await summary.getByRole( 'button', { name: 'Edit Parent' } ).click();

		const parentPageLocator = page.getByRole( 'combobox', {
			name: 'Parent',
		} );

		await parentPageLocator.click();
		await page.getByRole( 'listbox' ).getByRole( 'option' ).first().click();
		const parentPage = await parentPageLocator.inputValue();
		await page.keyboard.press( 'Escape' );

		await expect(
			summary.getByText( parentPage, { exact: true } )
		).toBeVisible();

		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Child Post' );
		await editor.publishPost();
		await page.reload();

		const reloadedSummary = await openPostSummary( {
			editor,
			page,
			tab: 'Hierarchical No Title',
		} );
		await reloadedSummary
			.getByRole( 'button', { name: 'Edit Parent' } )
			.click();
		// The auto-focused combobox shows its (empty) filter text; blur it so
		// it renders the selected value.
		await page.getByRole( 'heading', { name: 'Parent' } ).click();

		// Confirm parent page selection matches after reloading.
		await expect( parentPageLocator ).toHaveValue( parentPage );
	} );
} );
