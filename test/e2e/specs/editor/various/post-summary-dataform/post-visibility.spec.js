const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors `test/e2e/specs/editor/various/post-visibility.spec.js` with the
 * DataForm inspector experiment enabled; delete that spec when the experiment
 * graduates.
 */
test.describe( 'Post visibility (DataForm inspector)', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	[ 'large', 'small' ].forEach( ( viewport ) => {
		test( `can be changed when the viewport is ${ viewport }`, async ( {
			page,
			admin,
			pageUtils,
			editor,
		} ) => {
			await pageUtils.setBrowserViewport( viewport );

			await admin.createNewPost();

			const summary = await openPostSummary( { editor, page } );

			await summary
				.getByRole( 'button', { name: 'Edit Status' } )
				.click();
			await page.getByRole( 'radio', { name: 'Private' } ).click();

			const currentStatus = await page.evaluate( () => {
				return window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( 'private' );
		} );
	} );

	test( 'visibility remains private even if the publish date is in the future', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

		// Enter a title for this post.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title' );

		const summary = await openPostSummary( { editor, page } );

		// Set a publish date for the next month.
		await summary.getByRole( 'button', { name: 'Edit Date' } ).click();
		const nextMonth = new Date();
		nextMonth.setDate( 15 );
		nextMonth.setMonth( nextMonth.getMonth() + 1 );
		const pad = ( number ) => String( number ).padStart( 2, '0' );
		await page
			.getByLabel( 'Date time' )
			.fill(
				`${ nextMonth.getFullYear() }-${ pad(
					nextMonth.getMonth() + 1
				) }-${ pad( nextMonth.getDate() ) }T10:00`
			);
		await page.keyboard.press( 'Escape' );

		await summary.getByRole( 'button', { name: 'Edit Status' } ).click();
		await page.getByRole( 'radio', { name: 'Private' } ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', {
				name: 'Save',
				exact: true,
			} )
			.click();

		const currentStatus = await page.evaluate( () => {
			return window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' );
		} );

		expect( currentStatus ).toBe( 'private' );
	} );
} );
