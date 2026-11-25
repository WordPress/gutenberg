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
					? 'Suggestion accepted.'
					: 'Suggestion rejected.'
			)
			.first()
	).toBeVisible();
	return sidebar;
}

// Saves the post and returns the content the save request stored.
async function saveAndReadContent( page: any ) {
	const [ response ] = await Promise.all( [
		page.waitForResponse(
			( candidate: any ) =>
				/\/wp\/v2\/posts\/\d+/.test( candidate.url() ) &&
				candidate.request().method() === 'POST'
		),
		page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } )
			.click(),
	] );
	return ( await response.json() ).content.raw as string;
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

	test( 'a color and a font size suggestion on one block are both kept (F-41)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Style me' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = firstParagraph( editor );
		await editor.selectBlocks( paragraph );
		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		let saved = suggestionSavedPromise( page );
		await settings
			.getByRole( 'button', { name: 'Color', exact: true } )
			.first()
			.click();
		await page
			.getByRole( 'option', { name: 'Luminous vivid orange' } )
			.click();
		await saved;
		await page.keyboard.press( 'Escape' );

		saved = suggestionSavedPromise( page );
		await settings
			.getByRole( 'radio', { name: 'Large', exact: true } )
			.click();
		await saved;

		// Both proposals preview on the block, and neither is committed.
		await expect( paragraph ).toHaveClass( /has-large-font-size/ );
		await expect( paragraph ).toHaveClass(
			/has-luminous-vivid-orange-color/
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'has-large-font-size"' );

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator( SUMMARY );
		await expect( summary ).toHaveCount( 1 );
		await expect( summary ).toContainText(
			'text color default → luminous-vivid-orange'
		);
		await expect( summary ).toContainText( 'font size default → large' );

		// The reverse order, on top: a second color keeps the font size.
		await editor.openDocumentSettingsSidebar();
		await editor.selectBlocks( paragraph );
		saved = suggestionSavedPromise( page );
		await settings
			.getByRole( 'button', { name: 'Color', exact: true } )
			.first()
			.click();
		await page.getByRole( 'option', { name: 'Vivid purple' } ).click();
		await saved;
		await expect( paragraph ).toHaveClass( /has-large-font-size/ );
		await expect( paragraph ).toHaveClass( /has-vivid-purple-color/ );
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
			sidebar.getByText( 'Accepted', { exact: true } )
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

	test( 'a suggestion card offers neither Edit nor Delete (F-54)', async ( {
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
		// The card is selected once it offers a reply.
		await expect(
			sidebar.getByRole( 'textbox', { name: /reply/i } )
		).toBeVisible();
		// Nothing is left for the menu to offer while the suggestion is
		// pending, so the card has no Actions button.
		await expect(
			sidebar.getByRole( 'button', { name: 'Actions' } )
		).toBeHidden();
	} );

	test( 'formatting your own added text opens a suggestion of its own', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph.' },
		} );
		// A block's toolbar covers the block above it, so the two edited
		// paragraphs are kept one apart.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Third paragraph' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = firstParagraph( editor );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		let saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' New sentence.' );
		await saved;

		// Another suggestion further down, then back to the first one.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 2 )
			.click();
		await page.keyboard.press( 'End' );
		saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' MORE' );
		await saved;

		// Bold exactly the added text.
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', {
			times: ' New sentence.'.length,
		} );
		saved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+b' );
		await saved;

		// The formatting change sits inside the addition.
		const formatted = paragraph.locator(
			'mark.wp-suggestion-add mark.wp-suggestion-format'
		);
		await expect( formatted.locator( 'strong' ) ).toHaveText(
			' New sentence.'
		);

		// A second format on the same words revises that one suggestion.
		saved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+i' );
		await saved;
		await expect( formatted.locator( 'em' ) ).toHaveText(
			' New sentence.'
		);

		const sidebar = await openNotesSidebar( page );
		const summaries = sidebar.locator( SUMMARY );
		await expect( summaries ).toHaveCount( 3 );
		const addition = summaries.filter( {
			hasText: 'Add: “ New sentence.”',
		} );
		await expect( addition ).toHaveCount( 1 );
		await expect( addition ).not.toContainText( 'formatting' );
		const formatting = sidebar
			.locator( '.editor-collab-sidebar-panel__thread' )
			.filter( { hasText: 'Add formatting: bold, italic' } );
		await expect( formatting ).toHaveCount( 1 );

		// Each is decided by itself: rejecting the formatting keeps the text.
		await formatting.click();
		await formatting
			.getByRole( 'button', { name: 'Reject suggestion' } )
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion rejected.' )
		).toBeVisible();
		await expect(
			paragraph.locator( 'mark.wp-suggestion-add' )
		).toHaveText( ' New sentence.' );
		await expect( paragraph.locator( 'strong, em' ) ).toHaveCount( 0 );
		await expect(
			paragraph.locator( 'mark.wp-suggestion-format' )
		).toHaveCount( 0 );
	} );

	test( 'rejecting added text takes its formatting suggestion with it', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph.' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = firstParagraph( editor );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		let saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' New sentence.' );
		await saved;
		await pageUtils.pressKeys( 'shift+ArrowLeft', {
			times: ' New sentence.'.length,
		} );
		saved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+b' );
		await saved;

		const sidebar = await openNotesSidebar( page );
		const threads = sidebar.locator(
			'.editor-collab-sidebar-panel__thread'
		);
		await expect( threads ).toHaveCount( 2 );
		const addition = threads.filter( { hasText: 'Add: “ New sentence.”' } );
		await addition.click();
		await addition
			.getByRole( 'button', { name: 'Reject suggestion' } )
			.click();

		await expect( paragraph ).toHaveText( 'First paragraph.' );
		await expect(
			threads.filter( { hasText: 'Add formatting: bold' } )
		).toHaveCount( 0 );
	} );

	test( 'text typed after turning bold on is suggested in bold', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph.' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = firstParagraph( editor );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'primary+b' );
		const saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' Bold words.' );
		await saved;

		const addition = paragraph.locator( 'mark.wp-suggestion-add' );
		await expect( addition ).toHaveCount( 1 );
		await expect( addition.locator( 'strong' ) ).toHaveText(
			' Bold words.'
		);

		// Turning bold off again ends the bold run, not the suggestion.
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( ' Plain.' );
		await expect( addition ).toHaveCount( 1 );
		await expect( addition ).toHaveText( ' Bold words. Plain.' );
		await expect( addition.locator( 'strong' ) ).toHaveText(
			' Bold words.'
		);

		// One card for the text and the formatting it arrives with.
		const sidebar = await openNotesSidebar( page );
		const threads = sidebar.locator(
			'.editor-collab-sidebar-panel__thread'
		);
		await expect( threads ).toHaveCount( 1 );
		await expect( threads ).toContainText( 'Add: “ Bold words. Plain.”' );
		await expect( threads ).toContainText( 'Add formatting: bold' );

		await decideSuggestion( page, 'Accept' );
		await expect
			.poll( () => editor.getBlocks() )
			.toMatchObject( [
				{
					attributes: {
						content:
							'First paragraph.<strong> Bold words.</strong> Plain.',
					},
				},
			] );
	} );

	test( 'text typed into bold text is suggested in bold', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Some <strong>bold</strong> text.' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = firstParagraph( editor );
		await paragraph.click();
		await page.keyboard.press( 'Home' );
		// One of the presses crosses into the bold text without moving.
		await pageUtils.pressKeys( 'ArrowRight', {
			times: 'Some b'.length + 1,
		} );
		const saved = suggestionSavedPromise( page );
		await page.keyboard.type( 'XY' );
		await saved;

		await expect(
			paragraph.locator( 'mark.wp-suggestion-add strong' )
		).toHaveText( 'XY' );

		// The bold is the surrounding text's, so the card proposes none.
		const sidebar = await openNotesSidebar( page );
		const summaries = sidebar.locator( SUMMARY );
		await expect( summaries ).toHaveCount( 1 );
		await expect( summaries ).toContainText( 'Add: “XY”' );
		await expect( summaries ).not.toContainText( 'formatting' );

		await decideSuggestion( page, 'Accept' );
		await expect
			.poll( () => editor.getBlocks() )
			.toMatchObject( [
				{
					attributes: {
						content: 'Some <strong>bXYold</strong> text.',
					},
				},
			] );
	} );

	test( 'opening the Template panel raises no refusal (F-68)', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		// The classic default theme has no template to preview.
		await requestUtils.activateTheme( 'twentytwentyfour' );
		try {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'First paragraph' },
			} );
			await editor.saveDraft();
			await page.reload();
			await switchIntent( page, 'Suggesting' );

			await editor.openDocumentSettingsSidebar();
			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await settings.getByRole( 'tab', { name: 'Post' } ).click();
			await settings
				.getByRole( 'button', { name: /^Template:/ } )
				.click();
			/*
			 * The previewed Navigation block attaches its menu once the
			 * request for it resolves, by writing its `ref`: the write that
			 * was refused. A named menu says it landed.
			 */
			await expect(
				settings
					.locator( '.editor-template-actions-panel__preview' )
					.frameLocator( 'iframe' )
					.locator( '.wp-block-navigation__description' )
					.first()
			).toHaveText( /Navigation Menu: ".+"/ );

			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( 'This block is saved outside this post' )
			).toBeHidden();
		} finally {
			await requestUtils.activateTheme( 'twentytwentyone' );
		}
	} );

	test( 'a synced pattern opened from a post requests no notes (F-69)', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		// Requests, not responses: a request is on record as soon as it is
		// sent, so nothing has to wait for the refusal.
		const noteRequests: string[] = [];
		const { id } = ( await requestUtils.createBlock( {
			title: 'Synced pattern',
			status: 'publish',
			content:
				'<!-- wp:paragraph --><p>In the pattern</p><!-- /wp:paragraph -->',
		} ) ) as { id: number };
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		page.on( 'request', ( request: any ) => {
			const url = new URL( request.url() );
			if (
				/\/wp\/v2\/comments/.test( url.pathname + url.search ) &&
				url.searchParams.get( 'post' ) === String( id )
			) {
				noteRequests.push( request.url() );
			}
		} );
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Edit original' } )
			.click();

		// The editor now holds the pattern.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'In the pattern' );
		expect( noteRequests ).toEqual( [] );
	} );

	test( 'an empty block added while suggesting is not saved into the post (F-51)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );
		await editor.saveDraft();
		await switchIntent( page, 'Suggesting' );

		// The selected block's toolbar covers its neighbour.
		const clearSelection = () =>
			page.evaluate( () =>
				( window as any ).wp.data
					.dispatch( 'core/block-editor' )
					.clearSelectedBlock()
			);
		await clearSelection();
		await firstParagraph( editor ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: /Empty block|Block: Paragraph/,
			} )
		).toHaveCount( 3 );
		await clearSelection();
		await editor.canvas.getByText( 'Second paragraph' ).click();

		// Nothing was typed, so there is no suggestion and no note.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'All notes', exact: true } )
		).toBeHidden();

		const saved = await saveAndReadContent( page );
		expect( saved ).toContain( 'First paragraph' );
		expect( saved ).not.toContain( '<p></p>' );

		await page.reload();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toHaveCount( 2 );
	} );

	test( 'a block typed into while suggesting is still saved as a suggestion (F-51)', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.saveDraft();
		await switchIntent( page, 'Suggesting' );

		await firstParagraph( editor ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		const saved = suggestionSavedPromise( page );
		await page.keyboard.type( 'Typed block' );
		await saved;

		const content = await saveAndReadContent( page );
		expect( content ).toContain( 'Typed block' );
		expect( content ).toContain( '"type":"pending-insert"' );
	} );

	test.describe( 'a deletion across blocks (F-52)', () => {
		// Deletes from inside the first paragraph to inside the third.
		async function deleteAcrossBlocks( {
			editor,
			page,
			pageUtils,
		}: {
			editor: any;
			page: any;
			pageUtils: any;
		} ) {
			for ( const content of [
				'First block text',
				'Second block text',
				'Third block text',
			] ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content },
				} );
			}
			await switchIntent( page, 'Suggesting' );
			await page.evaluate( () =>
				( window as any ).wp.data
					.dispatch( 'core/block-editor' )
					.clearSelectedBlock()
			);
			await firstParagraph( editor ).click();
			await page.keyboard.press( 'Home' );
			await pageUtils.pressKeys( 'ArrowRight', { times: 5 } );
			await pageUtils.pressKeys( 'shift+ArrowDown', { times: 2 } );
			await expect
				.poll( () =>
					page.evaluate(
						() =>
							( window as any ).wp.data
								.select( 'core/block-editor' )
								.getMultiSelectedBlockClientIds().length
					)
				)
				.toBe( 3 );
			await page.keyboard.press( 'Backspace' );

			// One note per block: the rewritten first, the two removed.
			const sidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await expect
				.poll( async () => {
					await openNotesSidebar( page );
					return sidebar.locator( SUMMARY ).count();
				} )
				.toBe( 3 );
			await expect(
				sidebar.locator( SUMMARY ).filter( { hasText: 'Replace:' } )
			).toHaveCount( 1 );
			await expect(
				sidebar
					.locator( SUMMARY )
					.filter( { hasText: 'Remove block:' } )
			).toHaveCount( 2 );
			return sidebar;
		}

		test( 'is one change to review', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const sidebar = await deleteAcrossBlocks( {
				editor,
				page,
				pageUtils,
			} );
			await expect(
				sidebar.getByText( 'Its suggestions resolve together.', {
					exact: false,
				} )
			).toHaveCount( 3 );
		} );

		test( 'accepting one part accepts them all', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const sidebar = await deleteAcrossBlocks( {
				editor,
				page,
				pageUtils,
			} );
			await switchIntent( page, 'Editing' );
			// A removal, not the rewrite: taken alone it would drop the
			// end of the last paragraph.
			await sidebar
				.locator( '.editor-collab-sidebar-panel__thread' )
				.filter( { hasText: 'Remove block:' } )
				.first()
				.getByRole( 'button', { name: 'Accept suggestion' } )
				.click();

			await expect(
				sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
			).toHaveCount( 0 );
			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphs ).toHaveCount( 1 );
			await expect( paragraphs ).toHaveText( /^First.*block text$/ );
			await expect( paragraphs ).not.toHaveClass(
				/is-suggestion-pending/
			);
		} );

		test( 'rejecting one part rejects them all', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const sidebar = await deleteAcrossBlocks( {
				editor,
				page,
				pageUtils,
			} );
			await switchIntent( page, 'Editing' );
			await sidebar
				.locator( '.editor-collab-sidebar-panel__thread' )
				.filter( { hasText: 'Replace:' } )
				.getByRole( 'button', { name: 'Reject suggestion' } )
				.click();

			await expect(
				sidebar.getByRole( 'button', { name: 'Reject suggestion' } )
			).toHaveCount( 0 );
			await expect
				.poll( () => editor.getBlocks() )
				.toMatchObject( [
					{ attributes: { content: 'First block text' } },
					{ attributes: { content: 'Second block text' } },
					{ attributes: { content: 'Third block text' } },
				] );
			const serialized = await editor.getEditedPostContent();
			expect( serialized ).not.toContain( '"suggestion"' );
		} );
	} );

	test( 'text typed while offline is kept and suggested on reconnect (F-44)', async ( {
		editor,
		page,
		context,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = firstParagraph( editor );
		await paragraph.click();
		await page.keyboard.press( 'End' );

		let failedRequests = 0;
		page.on( 'requestfailed', ( request: any ) => {
			if ( /\/wp\/v2\/comments/.test( request.url() ) ) {
				failedRequests++;
			}
		} );

		await context.setOffline( true );
		try {
			await page.keyboard.type( ' OFFLINE', { delay: 50 } );

			// One notice, however many keys were pressed.
			const notices = page.locator( '.components-snackbar' ).filter( {
				hasText: /offline|Unable to connect/i,
			} );
			await expect( notices ).toHaveCount( 1 );
			await expect( notices ).toContainText(
				'Your suggestion will be added when you reconnect.'
			);
			// And one request, not one per keystroke.
			expect( failedRequests ).toBe( 1 );
		} finally {
			await context.setOffline( false );
		}

		// The whole run arrives as one suggestion once the note can be saved.
		const marker = paragraph.locator( 'mark.wp-suggestion-add' );
		await expect( marker ).toHaveText( ' OFFLINE', { timeout: 15000 } );
		await expect( paragraph ).toHaveText( 'First paragraph OFFLINE' );
		await expect(
			page.locator( '.components-snackbar' ).filter( {
				hasText: 'Your suggestion will be added',
			} )
		).toBeHidden();

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator( SUMMARY );
		await expect( summary ).toHaveCount( 1 );
		await expect( summary ).toContainText( 'Add: “ OFFLINE”' );
	} );
} );
