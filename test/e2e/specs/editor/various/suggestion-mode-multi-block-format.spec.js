/**
 * E2E coverage for finding F-30 of the Suggest mode guided testing pass
 * (#73411): an inline-format shortcut pressed across a multi-block selection
 * is refused, correctly, but used to be refused in complete silence.
 *
 * The refusal itself belongs to the block editor — the writing-flow wrapper is
 * the editing host for a multi-block selection and cancels its `beforeinput`,
 * so nothing commits. These tests pin the missing half: Suggest mode now says
 * why nothing happened, and still writes nothing.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function switchIntent( page, intentLabel ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

// Select from inside the first paragraph down into the second, which is what
// makes the block editor promote the selection to a multi-block one.
async function selectAcrossTwoBlocks( editor, page, pageUtils ) {
	// Click the last paragraph rather than the first: the selected block's
	// toolbar floats over the block above it and would swallow the click.
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.last()
		.click();
	await page.keyboard.press( 'ArrowUp' );
	await page.keyboard.press( 'Home' );
	await pageUtils.pressKeys( 'shift+ArrowDown' );
	await pageUtils.pressKeys( 'shift+End' );
	// The wrapper carries the flag only while the selection genuinely spans
	// blocks, so this is the positive signal that the fixture is real.
	await expect(
		editor.canvas.locator( '[data-has-multi-selection="true"]' )
	).toBeVisible();
}

test.describe( 'Suggestion mode: formatting across blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'explains why bold does nothing across a multi-block selection', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await switchIntent( page, 'Suggesting' );
		await selectAcrossTwoBlocks( editor, page, pageUtils );

		// Scope to the snackbar list: the notice is also announced in a live
		// region, which would make a bare text match ambiguous.
		const snackbarList = page.locator( '.components-snackbar-list' );
		await pageUtils.pressKeys( 'primary+b' );
		await expect(
			snackbarList.getByText(
				'Formatting suggestions apply to a selection within a single block.'
			)
		).toBeVisible();

		// The refusal still holds: no marker anywhere, and the serialized
		// content is exactly what it was before the keystroke.
		await expect(
			editor.canvas.locator( 'mark.wp-suggestion' )
		).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'wp-suggestion' );
		expect( serialized ).not.toContain( '<strong>' );
	} );

	test( 'stays silent when the same shortcut lands inside one block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await switchIntent( page, 'Suggesting' );

		// The last paragraph, for the same toolbar-overlap reason as above.
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.last();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 9 } );
		await pageUtils.pressKeys( 'primary+b' );

		// Anchor on the suggestion actually being captured before asserting
		// the notice is absent, so the absence is measured after the flow has
		// had its turn rather than before it started.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="format"]'
			)
		).toContainText( 'paragraph' );
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText(
					'Formatting suggestions apply to a selection within a single block.'
				)
		).toHaveCount( 0 );
	} );
} );
