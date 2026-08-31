const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Covers the status field of the DataForm summary. This is net-new coverage:
 * there is no classic spec these tests supersede.
 */
test.describe( 'Post status', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'shows Draft for a new post before it has been saved', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		const summary = await openPostSummary( { editor, page } );

		// A new post is an `auto-draft`, which should be presented as
		// a Draft.
		const editButton = summary.getByRole( 'button', {
			name: 'Edit Status',
		} );
		await expect( editButton ).toHaveAccessibleDescription( 'Draft' );

		await editButton.click();
		await expect(
			page.getByRole( 'radio', { name: 'Draft' } )
		).toBeChecked();
	} );
} );
