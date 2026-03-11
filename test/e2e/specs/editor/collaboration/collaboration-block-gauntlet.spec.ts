/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

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
	} ) => {
		test.setTimeout( 60_000 );

		const post = await requestUtils.createPost( {
			title: 'Gauntlet - Text Blocks',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		// User A inserts all text blocks.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Gauntlet paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Gauntlet heading', level: 2 },
		} );
		await editor.insertBlock( {
			name: 'core/code',
			attributes: { content: 'const x = 1;' },
		} );
		await editor.insertBlock( {
			name: 'core/preformatted',
			attributes: { content: 'preformatted text' },
		} );
		await editor.insertBlock( {
			name: 'core/verse',
			attributes: { content: 'roses are red' },
		} );
		await editor.insertBlock( {
			name: 'core/pullquote',
			attributes: { value: 'A great quote', citation: 'Author A' },
		} );

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
		// Change heading level to H3 via data API (toolbar is unreliable in iframe context).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const heading = blocks.find(
				( b: { name: string } ) => b.name === 'core/heading'
			);
			if ( heading ) {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.updateBlockAttributes( heading.clientId, {
						level: 3,
					} );
			}
		} );

		// Code: click into the code element, select all, type.
		await clearAndType(
			page2,
			editor2.canvas.locator(
				'[data-type="core/code"] code[contenteditable="true"]'
			),
			'const y = 2;'
		);

		// Preformatted: use data API (RichText contenteditable not reliably selectable in iframe).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const pre = blocks.find(
				( b: { name: string } ) => b.name === 'core/preformatted'
			);
			if ( pre ) {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.updateBlockAttributes( pre.clientId, {
						content: 'preformatted edited by B',
					} );
			}
		} );

		// Verse: use data API (blocks below fold not reliably clickable in iframe).
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const verse = blocks.find(
				( b: { name: string } ) => b.name === 'core/verse'
			);
			if ( verse ) {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.updateBlockAttributes( verse.clientId, {
						content: 'violets are blue',
					} );
			}
		} );

		// Pullquote: use data API for both value and citation.
		await page2.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const pullquote = blocks.find(
				( b: { name: string } ) => b.name === 'core/pullquote'
			);
			if ( pullquote ) {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.updateBlockAttributes( pullquote.clientId, {
						value: 'Edited quote',
						citation: 'Author B',
					} );
			}
		} );

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
	} );

	test( 'Container blocks sync modifications between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		test.setTimeout( 60_000 );

		const post = await requestUtils.createPost( {
			title: 'Gauntlet - Container Blocks',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

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
				mediaUrl: 'https://example.com/img.jpg',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Media text content' },
				},
			],
		} );

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
	} );
} );
