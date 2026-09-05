/**
 * E2E coverage for F-04: the code editor must not be reachable while the
 * Suggest intent is active.
 *
 * The code editor edits raw `post_content`. It has nowhere to render an
 * inline marker, and the document it hands back is re-parsed from scratch,
 * so an edit made there both escapes suggestion capture and destroys the
 * markers already in the post. Suggesting therefore reports the visual
 * editor whatever the stored `editorMode` preference says, and the three
 * routes into the code editor - the Options menu, the toggle-mode keyboard
 * shortcut, and the command palette - are all closed off.
 *
 * The preference itself is left alone, so a user who was in the code editor
 * before suggesting lands back in it when they return to Editing - unless
 * they leave a suggestion unresolved behind them, which keeps the code editor
 * shut until it is accepted or rejected.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const TEXT_EDITOR = '.editor-post-text-editor';
const SUGGESTION_MARK = 'mark.wp-suggestion';

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
	// `MenuItemsChoice` keeps its dropdown open on selection; close it so a
	// later `Options` click reopens rather than toggles it shut.
	await page.keyboard.press( 'Escape' );
}

async function switchEditorMode( page: any, modeLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	await page
		.getByRole( 'menuitemradio', { name: new RegExp( `^${ modeLabel }` ) } )
		.click();
	await page.keyboard.press( 'Escape' );
}

test.describe( 'Suggest mode: the code editor', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	/*
	 * `editorMode` is persisted per user, so it is shared with every other
	 * test in this worker. Reset it over REST rather than through the UI at
	 * the end of a test body: a failure part-way through would otherwise
	 * leave the worker in the code editor and take unrelated specs down with
	 * it.
	 */
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setPreferences( 'core', { editorMode: 'visual' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'is offered as disabled in the Options menu while suggesting', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		// In the Edit intent the code editor is a normal, selectable choice.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		const codeEditorChoice = page.getByRole( 'menuitemradio', {
			name: /^Code editor/,
		} );
		await expect( codeEditorChoice ).toBeVisible();
		await expect( codeEditorChoice ).toBeEnabled();
		await page.keyboard.press( 'Escape' );

		await switchIntent( page, 'Suggesting' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Code editor/ } )
		).toBeDisabled();
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Visual editor/ } )
		).toHaveAttribute( 'aria-checked', 'true' );
		await page.keyboard.press( 'Escape' );

		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();
	} );

	test( 'leaves the code editor on the way in and gives it back on the way out', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchEditorMode( page, 'Code editor' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeVisible();

		// Entering Suggesting from the code editor must not leave a writable
		// raw-HTML textarea behind: that is the bypass F-04 reports.
		await switchIntent( page, 'Suggesting' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		).toBeVisible();

		// The preference was masked, not rewritten, so Editing restores it.
		await switchIntent( page, 'Editing' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeVisible();
	} );

	test( 'stays closed after returning to Editing with suggestions still pending', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' plus suggested' );
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toContainText( 'plus suggested' );

		// Back in Editing the intent no longer forbids the code editor, but
		// the marker is still in the document and re-parsing an edited
		// document is what destroys it - whoever made the edit.
		await switchIntent( page, 'Editing' );

		await pageUtils.pressKeys( 'secondary+m' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();

		// The menu item stays enabled here: answering it up front would mean
		// serializing the document on every render. The refusal happens on
		// dispatch instead, so it has to be on screen and not only spoken -
		// a shortcut that silently does nothing reads as a broken editor.
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'The code editor is unavailable' } )
		).toBeVisible();

		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
	} );

	test( 'does not hand the code editor back with a suggestion still pending', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		// A user whose stored preference is the code editor.
		await switchEditorMode( page, 'Code editor' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeVisible();

		await switchIntent( page, 'Suggesting' );
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' plus suggested' );
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toContainText( 'plus suggested' );

		/*
		 * Returning to Editing lifts the mask, and nothing dispatches
		 * `switchEditorMode` on the way - so its refusal never runs and the
		 * restored `text` preference would put the pending marker on screen
		 * as writable raw HTML. Suggestions still to resolve outrank the
		 * preference until they are gone.
		 */
		await switchIntent( page, 'Editing' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();
		await expect( paragraph ).toBeVisible();

		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
	} );

	test( 'puts focus back in the editor when the canvas swap orphans it', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchEditorMode( page, 'Code editor' );
		await page.locator( TEXT_EDITOR ).click();
		expect(
			await page.evaluate( () => document.activeElement?.tagName )
		).toBe( 'TEXTAREA' );

		// Suggesting swaps the canvas out from under the textarea. Nothing
		// in the incoming visual editor claims focus back, so it would fall
		// to `<body>` and keyboard navigation would restart from the top of
		// the page.
		await pageUtils.pressKeys( 'secondary+x' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();

		expect(
			await page.evaluate( () => document.activeElement?.className ?? '' )
		).toContain( 'interface-interface-skeleton__content' );
	} );

	test( 'takes no focus when the mode settles and the editor never had it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Untouched',
			content:
				'<!-- wp:paragraph --><p>Original content</p><!-- /wp:paragraph -->',
			status: 'draft',
		} as any );
		await admin.editPost( post.id );

		// Nothing has been clicked, so nothing in the editor holds focus -
		// which is also true part-way through boot, while the settled mode
		// is still resolving. A swap in that state has no focus to restore,
		// and helping itself to some drags the reader off the top of the
		// page and scrolls the canvas into view.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).switchEditorMode( 'text' )
		);
		await expect( page.locator( TEXT_EDITOR ) ).toBeVisible();

		expect(
			await page.evaluate(
				() => document.activeElement === document.body
			)
		).toBe( true );
	} );

	test( 'the toggle-mode shortcut cannot expose a pending suggestion as raw HTML', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' plus suggested' );

		const marker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
		);
		await expect( marker ).toContainText( 'plus suggested' );

		// The Options menu item is disabled, but the shortcut reaches
		// `switchEditorMode` directly and has to be refused there too:
		// otherwise the pending marker is handed to the user as editable raw
		// markup, and re-parsing what comes back is what corrupts the post.
		await pageUtils.pressKeys( 'secondary+m' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();
		await expect( marker ).toContainText( 'plus suggested' );

		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
	} );
} );
