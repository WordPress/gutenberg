const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

/*
 * Mirrors `test/e2e/specs/editor/various/sidebar-permalink.spec.js` with the
 * DataForm inspector experiment enabled; delete that spec when the experiment
 * graduates.
 */
// This tests are not together with the remaining sidebar tests,
// because we need to publish/save a post, to correctly test the permalink row.
// The sidebar test suit enforces that focus is never lost, but during save operations
// the focus is lost and a new element is focused once the save is completed.
test.describe( 'Sidebar Permalink (DataForm inspector)', () => {
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

	test( 'should not render URL when post is publicly queryable but not public', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_not_public' } );
		const summary = await openPostSummary( { editor, page } );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		// A hidden check passes on an empty sidebar, so wait for the summary first.
		await expect(
			summary.getByRole( 'button', { name: 'Edit Status' } )
		).toBeVisible();
		await expect(
			summary.getByRole( 'button', { name: 'Edit Slug' } )
		).toBeHidden();
	} );

	test( 'should not render URL when post is public but not publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'not_public_q_public' } );
		const summary = await openPostSummary( { editor, page } );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		// A hidden check passes on an empty sidebar, so wait for the summary first.
		await expect(
			summary.getByRole( 'button', { name: 'Edit Status' } )
		).toBeVisible();
		await expect(
			summary.getByRole( 'button', { name: 'Edit Slug' } )
		).toBeHidden();
	} );

	test( 'should render URL when post is public and publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_public' } );
		const summary = await openPostSummary( { editor, page } );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaaa' );
		await editor.publishPost();

		// Start editing again.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'aaaa (Updated)' );
		await expect(
			summary.getByRole( 'button', { name: 'Edit Slug' } )
		).toBeVisible();
	} );
} );
