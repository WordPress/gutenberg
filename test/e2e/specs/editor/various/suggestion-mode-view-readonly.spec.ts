/**
 * E2E coverage for the Viewing intent being genuinely read-only (#73411,
 * findings F-01 and F-02). Viewing is described in the Mode menu as a
 * "Read-only preview of the content", so no keystroke and no header control
 * may mutate blocks or dirty the post.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const TEXT_EDITOR = '.editor-post-text-editor';

function optionsButton( page: Page ) {
	return page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } );
}

/*
 * A radio item keeps the Options menu open after a selection, so the menu
 * may already be showing. Options is a toggle: clicking it in that state
 * would close the menu rather than open it.
 */
async function openOptions( page: Page ) {
	const probe = page.getByRole( 'menuitemradio', { name: /^Visual editor/ } );
	if ( ! ( await probe.isVisible() ) ) {
		await optionsButton( page ).click();
	}
	await probe.waitFor( { state: 'visible', timeout: 10000 } );
}

async function closeOptions( page: Page ) {
	const probe = page.getByRole( 'menuitemradio', { name: /^Visual editor/ } );
	if ( await probe.isVisible() ) {
		await optionsButton( page ).click();
	}
	await expect( probe ).toBeHidden();
}

async function switchIntent( page: Page, intentLabel: string ) {
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );

	/*
	 * A radio item keeps the Options menu open after a selection, and Escape
	 * does not reliably dismiss it. Since Options is a toggle, clicking it
	 * while the menu is still mounted would close the menu rather than
	 * reopen it, so only click when the menu is not already showing.
	 */
	if ( ! ( await menuItem.isVisible() ) ) {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
	}

	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// Whether the dropdown survives the selection depends on the intent:
	// leaving the view intent remounts the canvas and takes the menu with it.
	// Each test asserts the effect of the switch instead.
}

test.describe( 'Suggestion mode - Viewing intent is read-only', () => {
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

	/*
	 * `editorMode` is a per-user preference shared with every other test in
	 * this worker. Reset it over REST rather than through the UI, so a
	 * failure part-way through a test body cannot strand the worker in the
	 * code editor and take unrelated specs down with it.
	 */
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setPreferences( 'core', { editorMode: 'visual' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'no keystroke changes the blocks in Viewing mode', async ( {
		editor,
		page,
	} ) => {
		// F-01 was reported as the post going dirty, so start from a clean one.
		await editor.saveDraft();

		/*
		 * Select across both paragraphs before switching. Preview mode drops
		 * the per-block selection state, so a click in the read-only canvas
		 * places no caret and a keystroke reaches no handler at all. A
		 * selection carried in from Editing is what keeps the cross-block
		 * branch of `useInput` live, and on Enter that branch hands the whole
		 * selection to `replaceBlocks` - which is exactly what a stale
		 * `canInsertBlockType` lets through.
		 */
		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraphs.first(), paragraphs.last() );

		await switchIntent( page, 'Viewing' );

		// The writing flow ref lands on the iframed canvas' body element.
		const writingFlow = editor.canvas.locator( 'body' );
		await expect( writingFlow ).toHaveAttribute(
			'data-has-multi-selection',
			'true'
		);
		await writingFlow.focus();

		for ( const key of [ 'Enter', 'a', 'Backspace', 'Delete' ] ) {
			await page.keyboard.press( key );
		}

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].attributes.content ).toBe( 'First paragraph' );
		expect( blocks[ 1 ].attributes.content ).toBe( 'Second paragraph' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isEditedPostDirty()
				)
			)
			.toBe( false );
	} );

	test( 'the block inserter is disabled in Viewing mode', async ( {
		page,
	} ) => {
		const inserterToggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Block Inserter' } );

		await expect( inserterToggle ).toBeEnabled();

		await switchIntent( page, 'Viewing' );
		await expect( inserterToggle ).toBeDisabled();

		// Returning to Editing restores it: the read-only state follows the
		// intent rather than being a one-way trip.
		await switchIntent( page, 'Editing' );
		await expect( inserterToggle ).toBeEnabled();
	} );

	test( 'an inserter opened over a Viewing canvas offers nothing', async ( {
		editor,
		page,
	} ) => {
		await switchIntent( page, 'Viewing' );

		// The header toggle is disabled by now, so drive the inserter open
		// through the store: that proves insertion is refused by the editor
		// itself and not only hidden behind a disabled control.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).setIsInserterOpened( true )
		);

		const library = page.getByRole( 'region', { name: 'Block Library' } );
		await expect( library ).toBeVisible();
		await expect( library.getByRole( 'option' ) ).toHaveCount( 0 );

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
	} );

	test( 'the code editor is closed off in Viewing mode', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.saveDraft();

		await switchIntent( page, 'Viewing' );

		/*
		 * The code editor is the one editing surface the read-only canvas
		 * does not cover: it is a raw `post_content` textarea, so preview
		 * rendering leaves it fully writable. Viewing therefore reports the
		 * visual editor whatever the stored preference says, and closes all
		 * three routes in - the Options menu, the toggle-mode shortcut, and
		 * the command palette.
		 */
		await openOptions( page );
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Code editor/ } )
		).toBeDisabled();
		await expect(
			page.getByRole( 'menuitemradio', { name: /^Visual editor/ } )
		).toHaveAttribute( 'aria-checked', 'true' );
		// Close through the same toggle: Escape does not reliably dismiss
		// the dropdown, and a stale menu swallows the next click.
		await closeOptions( page );

		/*
		 * The menu item is disabled, but the shortcut reaches
		 * `switchEditorMode` directly, so the refusal has to live in the
		 * action too. It has to be on screen and not only spoken: a shortcut
		 * that silently does nothing reads as a broken editor.
		 */
		await pageUtils.pressKeys( 'secondary+m' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeHidden();
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'The code editor is unavailable' } )
		).toBeVisible();

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].attributes.content ).toBe( 'First paragraph' );
		expect( blocks[ 1 ].attributes.content ).toBe( 'Second paragraph' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isEditedPostDirty()
				)
			)
			.toBe( false );

		// The refusal is scoped to the intent, not a one-way trip: Editing
		// hands the code editor back.
		await switchIntent( page, 'Editing' );
		await pageUtils.pressKeys( 'secondary+m' );
		await expect( page.locator( TEXT_EDITOR ) ).toBeVisible();
	} );

	test( 'undo and redo leave the post alone in Viewing mode', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		/*
		 * Save so the post starts clean while the two block insertions stay
		 * on the undo stack. An undo that got through would drop a paragraph
		 * and dirty the post - the same symptom F-01 reported for keystrokes,
		 * reached through a header button instead.
		 */
		await editor.saveDraft();

		const undoButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Undo' } );
		await expect( undoButton ).toHaveAttribute( 'aria-disabled', 'false' );

		await switchIntent( page, 'Viewing' );

		// The buttons stay mounted rather than disappearing - they are
		// `aria-disabled` so keyboard users keep their place - so they must
		// stop advertising an action the store would decline.
		await expect( undoButton ).toHaveAttribute( 'aria-disabled', 'true' );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Redo' } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		/*
		 * Disabling the buttons only hides the affordance. Drive the actions
		 * the two ways that reach them regardless - the keyboard shortcuts,
		 * which dispatch directly, and the store itself - so this proves the
		 * editor refuses undo rather than that a button was greyed out.
		 */
		await pageUtils.pressKeys( 'primary+z' );
		await pageUtils.pressKeys( 'primaryShift+z' );
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).undo();
			window.wp.data.dispatch( 'core/editor' ).redo();
		} );

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].attributes.content ).toBe( 'First paragraph' );
		expect( blocks[ 1 ].attributes.content ).toBe( 'Second paragraph' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isEditedPostDirty()
				)
			)
			.toBe( false );

		// Returning to Editing restores the history rather than discarding it.
		await switchIntent( page, 'Editing' );
		await expect( undoButton ).toHaveAttribute( 'aria-disabled', 'false' );
		await undoButton.click();
		await expect
			.poll( async () => ( await editor.getBlocks() ).length )
			.toBe( 1 );
	} );

	test( 'switching to Viewing closes an open inserter', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Block Inserter' } )
			.click();
		const library = page.getByRole( 'region', { name: 'Block Library' } );
		await expect( library ).toBeVisible();

		await switchIntent( page, 'Viewing' );
		await expect( library ).toBeHidden();
	} );
} );
