/**
 * E2E coverage for the Suggestion mode fine tuning list (#87283): the flows of
 * the guided testing plan that passed in August and no longer did in the
 * 2026-11-22 run.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const SUMMARY = '.editor-collab-sidebar-panel__suggestion-summary';

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

async function openNotesSidebar( page: any ) {
	const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
	const allNotesToggle = topBar.getByRole( 'button', {
		name: 'All notes',
		exact: true,
	} );
	if (
		( await allNotesToggle.getAttribute( 'aria-expanded' ) ) === 'false'
	) {
		await allNotesToggle.click();
	}
	return page.getByRole( 'region', { name: 'Editor settings' } );
}

async function decideSuggestion( page: any, action: 'Accept' | 'Reject' ) {
	const sidebar = await openNotesSidebar( page );
	await sidebar
		.getByRole( 'button', { name: `${ action } suggestion` } )
		.first()
		.click();
	await expect(
		page
			.locator( '.components-snackbar-list' )
			.getByText(
				action === 'Accept'
					? 'Suggestion applied.'
					: 'Suggestion rejected.'
			)
			.first()
	).toBeVisible();
	return sidebar;
}

function firstParagraph( editor: any ) {
	return editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first();
}

test.describe( 'Suggestion mode fine tuning (#87283)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'a text alignment suggestion is named in its summary (F-53)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Align me' },
		} );
		await switchIntent( page, 'Suggesting' );

		await editor.selectBlocks( firstParagraph( editor ) );
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Align text' } )
			.click();
		const saved = suggestionSavedPromise( page );
		await page
			.getByRole( 'menuitemradio', { name: 'Align text center' } )
			.click();
		await saved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator( SUMMARY ).first();
		await expect( summary ).toContainText(
			'Change: text alignment default → center'
		);
		await expect( summary ).not.toContainText( 'style' );
	} );

	test( 'a decided inline suggestion still says what was decided (F-55, F-58)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await switchIntent( page, 'Suggesting' );

		await firstParagraph( editor ).click();
		await page.keyboard.press( 'End' );
		const saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' KEEPME' );
		await saved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator( SUMMARY ).first();
		await expect( summary ).toContainText( 'Add: “ KEEPME”' );

		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
		await expect( summary ).toContainText( 'Add: “ KEEPME”' );
		await expect( summary ).not.toContainText( 'Change: text' );

		// The label survives the save that makes the decision final.
		await editor.saveDraft();
		await page.reload();
		const reloaded = await openNotesSidebar( page );
		await expect( reloaded.locator( SUMMARY ).first() ).toContainText(
			'Add: “ KEEPME”'
		);
	} );

	test( 'a rejected block insertion keeps the text it held (F-58)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await switchIntent( page, 'Suggesting' );

		await firstParagraph( editor ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'NEW BLOCK' );

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator( SUMMARY ).first();
		await expect( summary ).toContainText(
			'Insert block: paragraph “NEW BLOCK”'
		);

		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Reject' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
		await expect( summary ).toContainText(
			'Insert block: paragraph “NEW BLOCK”'
		);
	} );

	test( 'a suggestion card does not offer Delete (F-54)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await switchIntent( page, 'Suggesting' );

		await firstParagraph( editor ).click();
		await page.keyboard.press( 'End' );
		const saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' DELNOTE' );
		await saved;

		const sidebar = await openNotesSidebar( page );
		await sidebar.locator( SUMMARY ).first().click();
		await sidebar.getByRole( 'button', { name: 'Actions' } ).click();
		const menu = page.getByRole( 'menu', { name: 'Actions' } );
		await expect(
			menu.getByRole( 'menuitem', { name: 'Edit', exact: true } )
		).toBeVisible();
		await expect(
			menu.getByRole( 'menuitem', { name: 'Delete', exact: true } )
		).toBeHidden();
	} );
} );
