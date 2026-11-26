/**
 * E2E coverage for formatting suggestions in rich text other than a block's
 * `content`, using the image caption (#87434).
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const CAPTION = 'Ten days, two base towns, and many switchbacks.';
const REFUSED =
	'This change overlaps a pending suggestion, so it was not captured. Accept or reject that suggestion first.';

async function switchIntent( page: any, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` keeps its dropdown open on selection.
	await page.keyboard.press( 'Escape' );
}

// Call BEFORE the edit: attaching afterwards races the auto-save debounce.
function suggestionSavedPromise( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

// Selects the caption's last word from the keyboard.
async function selectLastWord( page: any, pageUtils: any ) {
	await page.keyboard.press( 'End' );
	await pageUtils.pressKeys( 'shift+ArrowLeft', {
		times: 'switchbacks.'.length,
	} );
}

function imageAttributes( page: any ) {
	return page.evaluate( () => {
		const { caption, metadata } = window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()[ 0 ].attributes;
		return { caption: String( caption ), metadata };
	} );
}

test.describe( 'Suggestion mode: image caption (#87434)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				url: '/wp-includes/images/media/default.png',
				alt: 'Placeholder',
				caption: CAPTION,
			},
		} );
		await switchIntent( page, 'Suggesting' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'italics can be suggested in a caption that already has a suggestion', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const caption = editor.canvas.getByRole( 'textbox', {
			name: 'Image caption text',
		} );
		await caption.click();
		await page.keyboard.press( 'Home' );
		let saved = suggestionSavedPromise( page );
		await page.keyboard.type( 'About ' );
		await saved;
		await expect( caption.locator( 'mark.wp-suggestion-add' ) ).toHaveText(
			'About '
		);

		await selectLastWord( page, pageUtils );
		saved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+i' );
		await saved;

		await expect(
			caption.locator( 'mark.wp-suggestion-format em' )
		).toHaveText( 'switchbacks.' );
		await expect( caption.locator( 'mark.wp-suggestion-add' ) ).toHaveText(
			'About '
		);
		await expect(
			page.locator( '.components-snackbar-list' ).getByText( REFUSED )
		).toBeHidden();

		// Each suggestion is decided by itself.
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await topBar
			.getByRole( 'button', { name: 'All notes', exact: true } )
			.click();
		const formatting = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.editor-collab-sidebar-panel__thread' )
			.filter( { hasText: 'Add formatting: italic' } );
		await formatting.click();
		await formatting
			.getByRole( 'button', { name: 'Accept suggestion' } )
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion accepted.' )
		).toBeVisible();
		await expect( caption.locator( 'em' ) ).toHaveText( 'switchbacks.' );
		await expect(
			caption.locator( 'mark.wp-suggestion-format' )
		).toHaveCount( 0 );
		await expect( caption.locator( 'mark.wp-suggestion-add' ) ).toHaveText(
			'About '
		);
	} );

	test( 'italics in a caption are suggested inline, so later typing stays visible', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const caption = editor.canvas.getByRole( 'textbox', {
			name: 'Image caption text',
		} );
		await caption.click();
		await selectLastWord( page, pageUtils );
		let saved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+i' );
		await saved;

		await expect(
			caption.locator( 'mark.wp-suggestion-format em' )
		).toHaveText( 'switchbacks.' );
		// Not a whole-caption proposal, which would hide any later marker.
		expect(
			( await imageAttributes( page ) ).metadata?.suggestion
		).toBeUndefined();

		await page.keyboard.press( 'Home' );
		saved = suggestionSavedPromise( page );
		await page.keyboard.type( 'About ' );
		await saved;
		await expect( caption.locator( 'mark.wp-suggestion-add' ) ).toHaveText(
			'About '
		);
		await expect(
			caption.locator( 'mark.wp-suggestion-format em' )
		).toHaveText( 'switchbacks.' );
		await expect(
			page.locator( '.components-snackbar-list' ).getByText( REFUSED )
		).toBeHidden();
	} );
} );
