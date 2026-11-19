/**
 * E2E coverage for F-34: copying blocks out of a post must not carry that
 * post's suggestion state with them.
 *
 * A suggestion is a proposal about one post. Its inline `wp-suggestion-<kind>`
 * marker and the `metadata.noteId` link both point at a note comment attached
 * to that post's id, so pasting the blocks into a different post produces
 * permanently highlighted text with no note behind it and no Accept/Reject to
 * clear it. `setClipboardBlocks` runs the blocks through the
 * `blockEditor.copiedBlocks` filter, where the suggestion layer unwraps the
 * markers and drops the note link.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

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
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

test.describe( 'Suggestion mode clipboard', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'copied blocks carry no suggestion markers or note ids into another post', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
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
		await page.keyboard.type( ' COPIED' );

		/*
		 * A populated `data-suggestion-id` is race-free proof the note
		 * exists: the marker is only written once the note comment's id
		 * comes back.
		 */
		const marker = paragraph.locator( 'mark.wp-suggestion-add' );
		await expect( marker ).toContainText( 'COPIED' );
		await expect( marker ).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// The source post holds the marker and the note link, as it should.
		const sourceContent = await editor.getEditedPostContent();
		expect( sourceContent ).toContain( 'wp-suggestion' );
		expect( sourceContent ).toContain( 'noteId' );

		await editor.saveDraft();

		// Collapsed selection inside the block copies the whole block.
		await paragraph.click();
		await pageUtils.pressKeys( 'primary+c' );

		await admin.createNewPost();
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+v' );

		const pastedParagraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await expect( pastedParagraph ).toContainText(
			'Original content COPIED'
		);

		const pastedContent = await editor.getEditedPostContent();
		expect( pastedContent ).toContain( 'Original content COPIED' );
		expect( pastedContent ).not.toContain( 'wp-suggestion' );
		expect( pastedContent ).not.toContain( 'data-suggestion-id' );
		expect( pastedContent ).not.toContain( 'noteId' );

		// Nothing marked means nothing to review: no orphaned markers render.
		await expect(
			editor.canvas.locator(
				'mark:is(.wp-suggestion-add, .wp-suggestion-del, .wp-suggestion-format)'
			)
		).toHaveCount( 0 );
	} );

	/*
	 * Outside Suggest mode, pasting a URL over a text selection links the
	 * selection (the link format's paste rule). Suggest mode owns simple
	 * inline paste so it can mark the addition, and used to treat the URL as a
	 * type-over: the selected words were proposed for deletion and the URL
	 * proposed as new text. The paste must propose a link instead.
	 */
	test( 'pasting a URL over a selection proposes a link, not a replacement', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Read the docs today' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		// Select "today".
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );

		pageUtils.setClipboardData( {
			plainText: 'https://wordpress.org/',
		} );
		await pageUtils.pressKeys( 'primary+v' );

		const formatMark = paragraph.locator( 'mark.wp-suggestion-format' );
		await expect( formatMark ).toHaveText( 'today' );
		await expect( formatMark ).toHaveAttribute(
			'data-suggestion-id',
			/\d/
		);

		// The words stay, linked; nothing is proposed for deletion or added.
		await expect( paragraph ).toHaveText( 'Read the docs today' );
		await expect(
			paragraph.locator( 'a[href="https://wordpress.org/"]' )
		).toHaveText( 'today' );
		await expect(
			paragraph.locator(
				'mark:is(.wp-suggestion-add, .wp-suggestion-del)'
			)
		).toHaveCount( 0 );
	} );

	test( 'pasting a URL at a caret proposes linked text', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'See ' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );

		pageUtils.setClipboardData( {
			plainText: 'https://wordpress.org/',
		} );
		await pageUtils.pressKeys( 'primary+v' );

		const addMark = paragraph.locator( 'mark.wp-suggestion-add' );
		await expect( addMark ).toHaveText( 'https://wordpress.org/' );
		await expect( addMark ).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await expect(
			addMark.locator( 'a[href="https://wordpress.org/"]' )
		).toHaveText( 'https://wordpress.org/' );
	} );

	/*
	 * Suggestion mode only owns a paste the editor would insert as the exact
	 * plain text. Anything the editor's paste pipeline transforms (Markdown,
	 * auto-linked emails, plain-text-only blocks, pastes that become blocks)
	 * must come out the same as in Editing mode, proposed as a suggestion.
	 */
	test.describe( 'pastes the editor transforms match Editing mode', () => {
		async function pasteInto(
			{ admin, editor, page, pageUtils }: any,
			{
				block = 'core/paragraph',
				content,
				select = 0,
				clip,
			}: {
				block?: string;
				content: string;
				select?: number;
				clip: { plainText: string; html?: string };
			}
		) {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: block,
				attributes: { content },
			} );
			await switchIntent( page, 'Suggesting' );
			const target = editor.canvas
				.locator( `[data-type="${ block }"]` )
				.first();
			await target.click();
			await page.keyboard.press( 'End' );
			if ( select ) {
				await pageUtils.pressKeys( 'shift+ArrowLeft', {
					times: select,
				} );
			}
			pageUtils.setClipboardData( clip );
			await pageUtils.pressKeys( 'primary+v' );
			return target;
		}

		test( 'single-line Markdown is proposed with its formatting', async ( {
			admin,
			editor,
			page,
			pageUtils,
		} ) => {
			const paragraph = await pasteInto(
				{ admin, editor, page, pageUtils },
				{
					content: 'Start ',
					clip: { plainText: 'some **bold** and `code` here' },
				}
			);
			const addMark = paragraph.locator( 'mark.wp-suggestion-add' );
			await expect( addMark ).toHaveAttribute(
				'data-suggestion-id',
				/\d/
			);
			await expect( addMark ).toHaveText( 'some bold and code here' );
			await expect( addMark.locator( 'strong' ) ).toHaveText( 'bold' );
			await expect( addMark.locator( 'code' ) ).toHaveText( 'code' );
		} );

		test( 'formatted HTML pasted into a Code block is proposed as plain text', async ( {
			admin,
			editor,
			page,
			pageUtils,
		} ) => {
			const code = await pasteInto(
				{ admin, editor, page, pageUtils },
				{
					block: 'core/code',
					content: 'x ',
					clip: { plainText: 'bold text', html: '<b>bold text</b>' },
				}
			);
			const addMark = code.locator( 'mark.wp-suggestion-add' );
			await expect( addMark ).toHaveAttribute(
				'data-suggestion-id',
				/\d/
			);
			await expect( addMark ).toHaveText( 'bold text' );
			await expect( code.locator( 'strong, b' ) ).toHaveCount( 0 );
		} );

		test( 'an email pasted over a selection is proposed as a mailto link', async ( {
			admin,
			editor,
			page,
			pageUtils,
		} ) => {
			const paragraph = await pasteInto(
				{ admin, editor, page, pageUtils },
				{
					content: 'Mail me now',
					select: 3,
					clip: { plainText: 'a@example.com' },
				}
			);
			const addMark = paragraph.locator( 'mark.wp-suggestion-add' );
			await expect( addMark ).toHaveAttribute(
				'data-suggestion-id',
				/\d/
			);
			await expect(
				addMark.locator( 'a[href="mailto:a@example.com"]' )
			).toHaveText( 'a@example.com' );
			await expect(
				paragraph.locator( 'mark.wp-suggestion-del' )
			).toHaveText( 'now' );
		} );

		for ( const { title, clip, blockName } of [
			{
				title: 'a URL pasted into an empty paragraph is proposed as an Embed block',
				clip: {
					plainText: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				},
				blockName: 'core/embed',
			},
			{
				title: 'LaTeX pasted into an empty paragraph is proposed as a Math block',
				clip: { plainText: '\\frac{a}{b}' },
				blockName: 'core/math',
			},
		] ) {
			test( title, async ( { admin, editor, page, pageUtils } ) => {
				await pasteInto(
					{ admin, editor, page, pageUtils },
					{ content: '', clip }
				);
				// The paste is a block replacement: the paragraph is
				// proposed for removal and the new block for insertion,
				// as one suggestion group.
				await expect
					.poll( async () =>
						( await editor.getBlocks() ).map( ( block: any ) => [
							block.name,
							block.attributes?.metadata?.suggestion?.type,
						] )
					)
					.toEqual( [
						[ 'core/paragraph', 'pending-remove' ],
						[ blockName, 'pending-insert' ],
					] );
				const blocks: any[] = await editor.getBlocks();
				expect(
					blocks[ 0 ].attributes.metadata.suggestion.groupId
				).toBe( blocks[ 1 ].attributes.metadata.suggestion.groupId );
				// No intermediate text is proposed in the removed paragraph.
				expect( String( blocks[ 0 ].attributes.content ) ).toBe( '' );
			} );
		}
	} );
} );
