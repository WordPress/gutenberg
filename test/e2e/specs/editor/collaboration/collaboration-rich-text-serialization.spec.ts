/**
 * Rich-text values a peer reads from the shared document keep their HTML
 * serialization, so syncing a local edit back does not rebuild the HTML of
 * every rich-text value in the post.
 */
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const CONTENT = [
	'<!-- wp:paragraph --><p>First <strong>bold</strong> paragraph</p><!-- /wp:paragraph -->',
	'<!-- wp:paragraph --><p>Second <em>italic <strong>nested</strong></em> paragraph</p><!-- /wp:paragraph -->',
	'<!-- wp:paragraph --><p>A <a href="https://example.com">link</a> and a<br>line break</p><!-- /wp:paragraph -->',
	'<!-- wp:paragraph --><p>Entities &amp; &lt;code&gt; and <code>inline code</code></p><!-- /wp:paragraph -->',
].join( '\n\n' );

/*
 * Counts the paragraphs whose value has no kept serialization, and those whose
 * kept serialization differs from serializing the value afresh.
 */
function countUncachedParagraphs( page: Page ) {
	return page.evaluate( () => {
		const { data, richText } = ( window as any ).wp;
		const contents = data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( ( block: any ) => block.attributes.content );
		return {
			total: contents.length,
			uncached: contents.filter(
				( content: any ) => typeof content?.originalHTML !== 'string'
			).length,
			mismatched: contents.filter(
				( content: any ) =>
					content.toHTMLString() !==
					new richText.RichTextData( {
						text: content.text,
						formats: content.formats,
						replacements: content.replacements,
					} ).toHTMLString()
			).length,
		};
	} );
}

test.describe( 'Collaboration - Rich text serialization', () => {
	test( 'Values from the shared document keep their serialization', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Rich text serialization',
			content: CONTENT,
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;

		// User A types at the end of the first paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' typed by A' );

		await expect
			.poll( async () => ( await editor2.getBlocks() )[ 0 ], {
				timeout: 10_000,
			} )
			.toMatchObject( {
				attributes: {
					content: 'First <strong>bold</strong> paragraph typed by A',
				},
			} );

		// User B's values now come from the shared document.
		await expect( countUncachedParagraphs( page2 ) ).resolves.toEqual( {
			total: 4,
			uncached: 0,
			mismatched: 0,
		} );

		// User B types in the second paragraph; both peers converge.
		await editor2.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.type( ' typed by B' );

		const state = await collaborationUtils.waitForConvergence();
		expect(
			state.blocks.map( ( block ) => block.attributes.content )
		).toEqual( [
			'First <strong>bold</strong> paragraph typed by A',
			'Second <em>italic <strong>nested</strong></em> paragraph typed by B',
			'A <a href="https://example.com">link</a> and a<br>line break',
			'Entities &amp; &lt;code> and <code>inline code</code>',
		] );

		await expect( countUncachedParagraphs( page ) ).resolves.toEqual( {
			total: 4,
			uncached: 0,
			mismatched: 0,
		} );

		// Both peers would save the same post content.
		const [ contentA, contentB ] = await Promise.all(
			[ page, page2 ].map( ( pg ) =>
				pg.evaluate( () =>
					( window as any ).wp.data
						.select( 'core/editor' )
						.getEditedPostContent()
				)
			)
		);
		expect( contentB ).toBe( contentA );
		expect( contentA ).toContain(
			'<p>Second <em>italic <strong>nested</strong></em> paragraph typed by B</p>'
		);
	} );
} );
