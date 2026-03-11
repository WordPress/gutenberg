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
} );
