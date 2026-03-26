/**
 * External dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

/**
 * Helper: click into a content area, select all, and type replacement text.
 * @param page
 * @param locator
 * @param text
 */
async function clearAndType(
	page: import('@playwright/test').Page,
	locator: import('@playwright/test').Locator,
	text: string
) {
	await locator.click();
	await page.keyboard.press( 'ControlOrMeta+a' );
	await page.keyboard.type( text );
}

test.describe( 'Collaboration - Block Gauntlet', () => {
	test( 'Text blocks sync modifications between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		test.setTimeout( 30_000 );

		const post = await requestUtils.createPost( {
			title: 'Gauntlet - Text Blocks',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		// User A inserts all text blocks via slash commands.
		// For blocks where Enter creates a new paragraph (paragraph,
		// heading), we chain naturally. For blocks where Enter adds a
		// newline within (code, preformatted, verse), we press Escape
		// to deselect and then click the appender for a fresh paragraph.

		// Helper: insert a new default block (paragraph) after the
		// currently focused block using the editor keyboard shortcut.
		async function openFreshParagraph() {
			await page.keyboard.press( 'ControlOrMeta+Alt+y' );
		}

		// Helper: type a slash command in the current empty paragraph,
		// wait for the autocomplete, and confirm.
		async function slashInsert( command: string ) {
			await page.keyboard.type( '/' + command );
			await expect( page.locator( '[role="listbox"]' ) ).toBeVisible();
			await page.keyboard.press( 'Enter' );
		}

		// Paragraph: click the default block appender and type.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Gauntlet paragraph' );

		// Heading: Enter from paragraph creates a new paragraph for
		// the slash command.
		await page.keyboard.press( 'Enter' );
		await slashInsert( 'heading' );
		await page.keyboard.type( 'Gauntlet heading' );

		// Code: Enter from heading creates a new paragraph.
		await page.keyboard.press( 'Enter' );
		await slashInsert( 'code' );
		await page.keyboard.type( 'const x = 1;' );

		// Preformatted: Escape out of code, then appender.
		await openFreshParagraph();
		await slashInsert( 'preformatted' );
		await page.keyboard.type( 'preformatted text' );

		// Verse: Escape out of preformatted, then appender.
		await openFreshParagraph();
		await slashInsert( 'verse' );
		await page.keyboard.type( 'roses are red' );

		// Pullquote: Escape out of verse, then appender.
		await openFreshParagraph();
		await slashInsert( 'pullquote' );
		await page.keyboard.type( 'A great quote' );
		await editor.canvas
			.locator(
				'[data-type="core/pullquote"] .wp-block-pullquote__citation'
			)
			.click();
		await page.keyboard.type( 'Author A' );

		// User B joins after User A has inserted blocks.
		await collaborationUtils.joinUser( post.id, SECOND_USER );
		const { editor2, page2 } = collaborationUtils;

		// Wait for User B to see all 6 blocks.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10_000 } )
			.toHaveLength( 6 );

		// User B modifies each block via keyboard/UI.

		// Paragraph: click, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator( '[data-type="core/paragraph"]' ),
			'Paragraph edited by B'
		);

		// Heading: click, select all, type new content.
		await clearAndType(
			page2,
			editor2.canvas.locator( '[data-type="core/heading"]' ),
			'Heading edited by B'
		);
		// Change heading level to H3 via data API
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const heading = blocks.find(
				( b: { name: string } ) => b.name === 'core/heading'
			);
			if ( ! heading ) {
				throw new Error( 'Heading block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( heading.clientId, {
					level: 3,
				} );
		} );

		// Code: click into the code element, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/code"] code[contenteditable="true"]'
			),
			'const y = 2;'
		);

		// Preformatted: click, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator( '[data-type="core/preformatted"]' ),
			'preformatted edited by B'
		);

		// Verse: click, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator( '[data-type="core/verse"]' ),
			'violets are blue'
		);

		// Pullquote: click into quote text, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/pullquote"] blockquote p'
			),
			'Edited quote'
		);

		// Pullquote: click into citation, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/pullquote"] .wp-block-pullquote__citation'
			),
			'Author B'
		);

		// User A verifies all modifications synced.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 10_000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Paragraph edited by B' },
				},
				{
					name: 'core/heading',
					attributes: {
						content: 'Heading edited by B',
						level: 3,
					},
				},
				{
					name: 'core/code',
					attributes: { content: 'const y = 2;' },
				},
				{
					name: 'core/preformatted',
					attributes: { content: 'preformatted edited by B' },
				},
				{
					name: 'core/verse',
					attributes: { content: 'violets are blue' },
				},
				{
					name: 'core/pullquote',
					attributes: {
						value: 'Edited quote',
						citation: 'Author B',
					},
				},
			] );

		// Verify both users have identical final block state.
		const blocksA = await editor.getBlocks();
		const blocksB = await editor2.getBlocks();
		expect( stripClientIds( blocksA ) ).toEqual(
			stripClientIds( blocksB )
		);
	} );

	test( 'Container blocks sync modifications between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		test.setTimeout( 30_000 );

		const uploadedMedia = await requestUtils.uploadMedia(
			path.resolve(
				process.cwd(),
				'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
			)
		);

		const post = await requestUtils.createPost( {
			title: 'Gauntlet - Container Blocks',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		// User A inserts all container blocks with inner content.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Group child' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Column 1 text' },
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Column 2 text' },
						},
					],
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						text: 'Click me',
						url: 'https://example.com',
					},
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Details summary' },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Details body' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/quote',
			attributes: { citation: 'Quote author' },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Quote text' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: 'Item one' },
				},
				{
					name: 'core/list-item',
					attributes: { content: 'Item two' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/cover',
			attributes: { overlayColor: 'black', isDark: true },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Cover text' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/media-text',
			attributes: {
				mediaPosition: 'left',
				mediaType: 'image',
				mediaUrl: uploadedMedia.source_url,
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Media text content' },
				},
			],
		} );

		// User B joins after User A has inserted blocks.
		await collaborationUtils.joinUser( post.id, SECOND_USER );
		const { editor2, page2 } = collaborationUtils;

		// Wait for User B to see all 8 top-level blocks.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10_000 } )
			.toHaveLength( 8 );

		// User B modifies inner content of each container block via keyboard.

		// Group > Paragraph.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/group"] [data-type="core/paragraph"]'
			),
			'Group child edited by B'
		);

		// Columns > Column 1 > Paragraph.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/columns"] [data-type="core/column"]:first-child [data-type="core/paragraph"]'
			),
			'Column 1 edited by B'
		);

		// Buttons > Button text.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/buttons"] [data-type="core/button"] [contenteditable="true"]'
			),
			'Click B'
		);

		// Details > Summary.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/details"] summary [contenteditable="true"]'
			),
			'Summary edited by B'
		);
		// Details > Inner paragraph.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/details"] [data-type="core/paragraph"]'
			),
			'Details body edited by B'
		);

		// Quote > Inner paragraph.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/quote"] [data-type="core/paragraph"]'
			),
			'Quote text edited by B'
		);
		// Quote > Citation.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/quote"] [aria-label="Quote citation"]'
			),
			'Author B'
		);

		// List > First list-item.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/list"] [data-type="core/list-item"]:first-child [contenteditable="true"]'
			),
			'Item one edited by B'
		);
		// List > Second list-item.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/list"] [data-type="core/list-item"]:nth-child(2) [contenteditable="true"]'
			),
			'Item two edited by B'
		);

		// Cover > Inner paragraph.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/cover"] [data-type="core/paragraph"]'
			),
			'Cover edited by B'
		);

		// Media-text > Inner paragraph.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/media-text"] [data-type="core/paragraph"]'
			),
			'Media text edited by B'
		);

		// User A verifies all modifications synced.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 10_000 } )
			.toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Group child edited by B',
							},
						},
					],
				},
				{
					name: 'core/columns',
					innerBlocks: [
						{
							name: 'core/column',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: 'Column 1 edited by B',
									},
								},
							],
						},
						{
							name: 'core/column',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: 'Column 2 text',
									},
								},
							],
						},
					],
				},
				{
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: { text: 'Click B' },
						},
					],
				},
				{
					name: 'core/details',
					attributes: { summary: 'Summary edited by B' },
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Details body edited by B',
							},
						},
					],
				},
				{
					name: 'core/quote',
					attributes: { citation: 'Author B' },
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Quote text edited by B',
							},
						},
					],
				},
				{
					name: 'core/list',
					innerBlocks: [
						{
							name: 'core/list-item',
							attributes: {
								content: 'Item one edited by B',
							},
						},
						{
							name: 'core/list-item',
							attributes: {
								content: 'Item two edited by B',
							},
						},
					],
				},
				{
					name: 'core/cover',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Cover edited by B',
							},
						},
					],
				},
				{
					name: 'core/media-text',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'Media text edited by B',
							},
						},
					],
				},
			] );

		// Verify both users have identical final block state.
		const blocksA = await editor.getBlocks();
		const blocksB = await editor2.getBlocks();
		expect( stripClientIds( blocksA ) ).toEqual(
			stripClientIds( blocksB )
		);
	} );

	test( 'Media, embed, and utility blocks sync modifications between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		test.setTimeout( 30_000 );

		const uploadedMedia = await requestUtils.uploadMedia(
			path.resolve(
				process.cwd(),
				'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
			)
		);

		const post = await requestUtils.createPost( {
			title: 'Gauntlet - Media & Utility Blocks',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		// User A inserts all media/utility blocks.
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				id: uploadedMedia.id,
				url: uploadedMedia.source_url,
				alt: 'Test image',
				caption: 'Caption A',
			},
		} );
		await editor.insertBlock( {
			name: 'core/gallery',
			attributes: { caption: 'Gallery A' },
		} );
		await editor.insertBlock( {
			name: 'core/audio',
			attributes: { caption: 'Audio A' },
		} );
		await editor.insertBlock( {
			name: 'core/video',
			attributes: { caption: 'Video A' },
		} );
		await editor.insertBlock( {
			name: 'core/file',
			attributes: {
				href: uploadedMedia.source_url,
				fileName: 'File A',
			},
		} );
		await editor.insertBlock( {
			name: 'core/embed',
			attributes: { caption: 'Embed A' },
		} );
		await editor.insertBlock( {
			name: 'core/html',
			attributes: { content: '<p>Hello HTML</p>' },
		} );
		await editor.insertBlock( {
			name: 'core/shortcode',
			attributes: { text: '[gallery]' },
		} );
		await editor.insertBlock( {
			name: 'core/table',
			attributes: {
				caption: 'Table A',
				body: [
					{
						cells: [
							{ content: 'Cell 1', tag: 'td' },
							{ content: 'Cell 2', tag: 'td' },
						],
					},
				],
			},
		} );
		await editor.insertBlock( {
			name: 'core/more',
			attributes: { customText: 'Read more A' },
		} );

		// User B joins after User A has inserted blocks.
		await collaborationUtils.joinUser( post.id, SECOND_USER );
		const { editor2, page2 } = collaborationUtils;

		// Wait for User B to see all 10 blocks.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10_000 } )
			.toHaveLength( 10 );

		// User B modifies each block via keyboard/UI.

		// Image: edit caption.
		await clearAndType(
			page2,
			editor2.canvas.locator( '[data-type="core/image"] figcaption' ),
			'Caption B'
		);
		// Image: change alt text via sidebar.
		await editor2.canvas.locator( '[data-type="core/image"]' ).click();
		await editor2.openDocumentSettingsSidebar();
		const altTextInput = page2.getByRole( 'textbox', {
			name: /Alternative text/i,
		} );
		await altTextInput.fill( 'Alt by B' );

		// Gallery: edit caption via data API (empty gallery has no visible figcaption).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const gallery = blocks.find(
				( b: { name: string } ) => b.name === 'core/gallery'
			);
			if ( ! gallery ) {
				throw new Error( 'Gallery block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( gallery.clientId, {
					caption: 'Gallery edited by B',
				} );
		} );

		// Audio: edit caption via data API (no src means no figcaption in the DOM).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const audio = blocks.find(
				( b: { name: string } ) => b.name === 'core/audio'
			);
			if ( ! audio ) {
				throw new Error( 'Audio block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( audio.clientId, {
					caption: 'Audio edited by B',
				} );
		} );

		// Video: edit caption via data API (no src means no figcaption in the DOM).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const video = blocks.find(
				( b: { name: string } ) => b.name === 'core/video'
			);
			if ( ! video ) {
				throw new Error( 'Video block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( video.clientId, {
					caption: 'Video edited by B',
				} );
		} );

		// File: edit file name (first contenteditable is the file name link).
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/file"] a[contenteditable="true"]'
			),
			'File edited by B'
		);

		// Embed: edit caption via data API (embed without valid URL has no figcaption).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const embed = blocks.find(
				( b: { name: string } ) => b.name === 'core/embed'
			);
			if ( ! embed ) {
				throw new Error( 'Embed block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( embed.clientId, {
					caption: 'Embed edited by B',
				} );
		} );

		// HTML: edit via data API
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const html = blocks.find(
				( b: { name: string } ) => b.name === 'core/html'
			);
			if ( ! html ) {
				throw new Error( 'HTML block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( html.clientId, {
					content: '<div>Edited HTML</div>',
				} );
		} );

		// Shortcode: edit content in PlainText textarea.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/shortcode"] [aria-label="Shortcode text"]'
			),
			'[audio]'
		);

		// Table: edit caption.
		await clearAndType(
			page2,
			editor2.canvas.locator( '[data-type="core/table"] figcaption' ),
			'Table B'
		);

		// More: edit custom text (PlainText renders as a span with aria-label).
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/more"] [aria-label="\\"Read more\\" text"]'
			),
			'Read more B'
		);

		// User A verifies all modifications synced.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 10_000 } )
			.toMatchObject( [
				{
					name: 'core/image',
					attributes: {
						alt: 'Alt by B',
						caption: 'Caption B',
					},
				},
				{
					name: 'core/gallery',
					attributes: { caption: 'Gallery edited by B' },
				},
				{
					name: 'core/audio',
					attributes: { caption: 'Audio edited by B' },
				},
				{
					name: 'core/video',
					attributes: { caption: 'Video edited by B' },
				},
				{
					name: 'core/file',
					attributes: { fileName: 'File edited by B' },
				},
				{
					name: 'core/embed',
					attributes: { caption: 'Embed edited by B' },
				},
				{
					name: 'core/html',
					attributes: { content: '<div>Edited HTML</div>' },
				},
				{
					name: 'core/shortcode',
					attributes: { text: '[audio]' },
				},
				{
					name: 'core/table',
					attributes: { caption: 'Table B' },
				},
				{
					name: 'core/more',
					attributes: { customText: 'Read more B' },
				},
			] );

		// Verify both users have identical final block state.
		const blocksA = await editor.getBlocks();
		const blocksB = await editor2.getBlocks();
		expect( stripClientIds( blocksA ) ).toEqual(
			stripClientIds( blocksB )
		);
	} );

	test( 'Widget and dynamic blocks sync modifications between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		test.setTimeout( 30_000 );

		const post = await requestUtils.createPost( {
			title: 'Gauntlet - Widget Blocks',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		// User A inserts all widget/dynamic blocks.
		await editor.insertBlock( {
			name: 'core/archives',
			attributes: {
				displayAsDropdown: false,
				showPostCounts: false,
			},
		} );
		await editor.insertBlock( {
			name: 'core/calendar',
		} );
		await editor.insertBlock( {
			name: 'core/categories',
			attributes: {
				displayAsDropdown: false,
				showHierarchy: false,
			},
		} );
		await editor.insertBlock( {
			name: 'core/latest-posts',
			attributes: { postsToShow: 5, displayPostDate: false },
		} );
		await editor.insertBlock( {
			name: 'core/latest-comments',
			attributes: { commentsToShow: 5, displayAvatar: true },
		} );
		const siteUrl = new URL( page.url() ).origin;
		await editor.insertBlock( {
			name: 'core/rss',
			attributes: {
				feedURL: `${ siteUrl }/?feed=rss2`,
				itemsToShow: 5,
			},
		} );
		await editor.insertBlock( {
			name: 'core/search',
			attributes: { label: 'Search', buttonText: 'Search' },
		} );
		await editor.insertBlock( {
			name: 'core/tag-cloud',
			attributes: { numberOfTags: 45, showTagCounts: false },
		} );
		await editor.insertBlock( {
			name: 'core/social-links',
			innerBlocks: [
				{
					name: 'core/social-link',
					attributes: {
						service: 'wordpress',
						url: 'https://wordpress.org',
					},
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/separator',
		} );
		await editor.insertBlock( {
			name: 'core/spacer',
			attributes: { height: '100px' },
		} );

		// User B joins after User A has inserted blocks.
		await collaborationUtils.joinUser( post.id, SECOND_USER );
		const { editor2, page2 } = collaborationUtils;

		// Wait for User B to see all 11 blocks.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10_000 } )
			.toHaveLength( 11 );

		// User B modifies each block via sidebar controls.

		// Helper to select a block and open the sidebar.
		async function selectBlockAndOpenSidebar( blockType: string ) {
			const blockLocator = editor2.canvas.locator(
				`[data-type="${ blockType }"]`
			);
			await blockLocator.click();
			await editor2.openDocumentSettingsSidebar();
		}

		// Archives: toggle "Display as dropdown" and "Show post counts".
		await selectBlockAndOpenSidebar( 'core/archives' );
		await page2
			.getByRole( 'checkbox', { name: /Display as dropdown/i } )
			.click();
		await page2
			.getByRole( 'checkbox', { name: /Show post counts/i } )
			.click();

		// Calendar: set month and year via sidebar.
		// Calendar has limited sidebar controls; use data API.
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const calendar = blocks.find(
				( b: { name: string } ) => b.name === 'core/calendar'
			);
			if ( ! calendar ) {
				throw new Error( 'Calendar block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( calendar.clientId, {
					month: 6,
					year: 2025,
				} );
		} );

		// Categories: toggle "Display as dropdown" and "Show hierarchy".
		await selectBlockAndOpenSidebar( 'core/categories' );
		await page2
			.getByRole( 'checkbox', { name: /Display as dropdown/i } )
			.click();
		await page2
			.getByRole( 'checkbox', { name: /Show hierarchy/i } )
			.click();

		// Latest Posts: change number and toggle date.
		await selectBlockAndOpenSidebar( 'core/latest-posts' );
		const latestPostsNumber = page2.getByRole( 'spinbutton', {
			name: /Number of items/i,
		} );
		await latestPostsNumber.fill( '3' );
		await page2.getByRole( 'checkbox', { name: /Post date/i } ).click();

		// Latest Comments: change number and uncheck avatar.
		await selectBlockAndOpenSidebar( 'core/latest-comments' );
		const latestCommentsNumber = page2.getByRole( 'spinbutton', {
			name: /Number of comments/i,
		} );
		await latestCommentsNumber.fill( '3' );
		await page2.getByRole( 'checkbox', { name: /Avatar/i } ).click();

		// RSS: change number and toggle excerpt.
		await selectBlockAndOpenSidebar( 'core/rss' );
		const rssNumber = page2.getByRole( 'spinbutton', {
			name: /Number of items/i,
		} );
		await rssNumber.fill( '3' );
		await page2.getByRole( 'checkbox', { name: /Excerpt/i } ).click();

		// Search: edit label and button text via keyboard.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/search"] [aria-label="Label text"]'
			),
			'Find'
		);
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/search"] [aria-label="Button text"]'
			),
			'Go'
		);

		// Tag Cloud: change number and toggle counts.
		await selectBlockAndOpenSidebar( 'core/tag-cloud' );
		const tagCloudNumber = page2.getByRole( 'spinbutton', {
			name: /Number of tags/i,
		} );
		await tagCloudNumber.fill( '20' );
		await page2
			.getByRole( 'checkbox', { name: /Show tag counts/i } )
			.click();

		// Social Links > Social Link: update URL via data API (link editor is complex).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const socialLinks = blocks.find(
				( b: { name: string } ) => b.name === 'core/social-links'
			);
			if ( ! socialLinks || ! socialLinks.innerBlocks[ 0 ] ) {
				throw new Error(
					'Social Links block (or its inner block) not found on User B'
				);
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( socialLinks.innerBlocks[ 0 ].clientId, {
					url: 'https://edited.org',
				} );
		} );

		// Separator: data API fallback (no direct UI for opacity).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const separator = blocks.find(
				( b: { name: string } ) => b.name === 'core/separator'
			);
			if ( ! separator ) {
				throw new Error( 'Separator block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( separator.clientId, {
					opacity: 'css',
				} );
		} );

		// Spacer: data API fallback (resize handle is fragile).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const spacer = blocks.find(
				( b: { name: string } ) => b.name === 'core/spacer'
			);
			if ( ! spacer ) {
				throw new Error( 'Spacer block not found on User B' );
			}
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( spacer.clientId, {
					height: '200px',
				} );
		} );

		// User A verifies all modifications synced.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 10_000 } )
			.toMatchObject( [
				{
					name: 'core/archives',
					attributes: {
						displayAsDropdown: true,
						showPostCounts: true,
					},
				},
				{
					name: 'core/calendar',
					attributes: { month: 6, year: 2025 },
				},
				{
					name: 'core/categories',
					attributes: {
						displayAsDropdown: true,
						showHierarchy: true,
					},
				},
				{
					name: 'core/latest-posts',
					attributes: {
						postsToShow: 3,
						displayPostDate: true,
					},
				},
				{
					name: 'core/latest-comments',
					attributes: {
						commentsToShow: 3,
						displayAvatar: false,
					},
				},
				{
					name: 'core/rss',
					attributes: {
						itemsToShow: 3,
						displayExcerpt: true,
					},
				},
				{
					name: 'core/search',
					attributes: {
						label: 'Find',
						buttonText: 'Go',
					},
				},
				{
					name: 'core/tag-cloud',
					attributes: {
						numberOfTags: 20,
						showTagCounts: true,
					},
				},
				{
					name: 'core/social-links',
					innerBlocks: [
						{
							name: 'core/social-link',
							attributes: {
								url: 'https://edited.org',
							},
						},
					],
				},
				{
					name: 'core/separator',
					attributes: { opacity: 'css' },
				},
				{
					name: 'core/spacer',
					attributes: { height: '200px' },
				},
			] );

		// Verify both users have identical final block state.
		const blocksA = await editor.getBlocks();
		const blocksB = await editor2.getBlocks();
		expect( stripClientIds( blocksA ) ).toEqual(
			stripClientIds( blocksB )
		);
	} );
} );

/**
 * Strip clientIds from block trees so two editors' blocks can be compared
 * structurally, ignoring the per-session identifiers.
 *
 * @param blocks
 */
function stripClientIds(
	blocks: Record< string, unknown >[]
): Record< string, unknown >[] {
	return JSON.parse(
		JSON.stringify( blocks, ( key, value ) =>
			key === 'clientId' ? undefined : value
		)
	);
}
