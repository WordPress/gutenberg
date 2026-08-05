/**
 * WordPress dependencies
 */
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

/**
 * Two-client collaboration through the intent-log sync engine.
 *
 * These specs flip the site's `wp_sync_engine` option to `intent-log` (the
 * server announces it; clients resolve the intent-log adapter) and exercise
 * the full stack: capture bridge → session → polling transport →
 * WP_Intent_Log_Engine → back. The suite restores the default engine when
 * done so the remaining collaboration specs keep exercising the yjs relay.
 */

async function setSyncEngine(
	requestUtils: RequestUtils,
	engine: string | null
) {
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: { wp_sync_engine: engine },
	} );
}

test.describe( 'Collaboration - intent-log engine', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await setSyncEngine( requestUtils, 'intent-log' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await setSyncEngine( requestUtils, null );
	} );

	test( 'syncs text edits between two users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Sync Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Existing content</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;

		// User 1 appends a paragraph.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Written by user one' },
		} );

		// User 2 sees both paragraphs.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Existing content' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Written by user one' },
				},
			] );
		} ).toPass( { timeout: 10000 } );

		// User 2 edits the first paragraph; user 1 sees the edit.
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await collaborationUtils.page2.keyboard.press( 'End' );
		await collaborationUtils.page2.keyboard.type( ' plus user two' );

		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks[ 0 ].attributes.content ).toBe(
				'Existing content plus user two'
			);
		} ).toPass( { timeout: 10000 } );
	} );

	test( 'appending to an existing paragraph keeps it visible and identity-stable on the peer', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// Regression: id-less editor blocks (freshly parsed post content)
		// used to re-mint a syncId every capture cycle, deriving
		// remove_block + insert_block per keystroke — the paragraph
		// flickered out of existence on the peer's CANVAS even though
		// store-level polling assertions eventually converged.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Append Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>Steady paragraph</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;
		const page1 = editor.page;

		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		await page1.keyboard.type( ' appended' );

		// The peer's CANVAS shows the appended text…
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' ).first()
		).toContainText( 'Steady paragraph appended', { timeout: 10000 } );
		// …and exactly one paragraph exists (no remove/insert churn residue).
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' )
		).toHaveCount( 1 );

		// A second append still targets the SAME block (identity adoption is
		// stable across capture cycles): the paragraph neither duplicates
		// nor flickers, and both canvases converge on the full text.
		await page1.keyboard.type( ' again' );
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' ).first()
		).toContainText( 'Steady paragraph appended again', {
			timeout: 10000,
		} );
		await expect(
			editor2.canvas.locator( '[data-type="core/paragraph"]' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator( '[data-type="core/paragraph"]' )
		).toHaveCount( 1 );
	} );

	test( 'both users typing on an EMPTY post converge without deleting each other', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// Regression: on a fresh post (empty genesis) each client seeds its
		// own paragraph; the peer's paragraph lands in the shared document
		// before the local editor renders it, and a stale capture used to
		// interpret its absence as a deletion — the clients silently deleted
		// each other's content forever.
		const post = await requestUtils.createPost( {
			title: 'Intent Log Empty Post Test',
			status: 'draft',
			content: '',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// Both users type into the empty canvas at once.
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page1.keyboard.type( 'First author paragraph' );
		await editor2.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page2.keyboard.type( 'Second author paragraph' );

		// Both editors converge on BOTH paragraphs (order may vary by
		// arrival; neither may vanish).
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				const contents = blocks.map(
					( block ) => block.attributes.content
				);
				expect( contents ).toEqual(
					expect.arrayContaining( [
						'First author paragraph',
						'Second author paragraph',
					] )
				);
			} ).toPass( { timeout: 15000 } );
		}

		// And they STAY converged (no delete/reinsert war): after a settle
		// window, both canvases still show both paragraphs.
		await page1.waitForTimeout( 3000 );
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect(
				currentEditor.canvas.locator( '[data-type="core/paragraph"]' )
			).toHaveCount( 2 );
		}
	} );

	test( 'concurrent edits to different blocks both survive', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Intent Log Concurrency Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>First</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Second</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const page1 = editor.page;

		// User 1 edits the first block, user 2 the second, immediately.
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await page1.keyboard.press( 'End' );
		await editor2.canvas
			.locator( '[data-type="core/paragraph"]' )
			.nth( 1 )
			.click();
		await page2.keyboard.press( 'End' );

		await page1.keyboard.type( ' from one' );
		await page2.keyboard.type( ' from two' );

		// Both editors converge on both edits.
		for ( const currentEditor of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await currentEditor.getBlocks();
				expect( blocks[ 0 ].attributes.content ).toBe(
					'First from one'
				);
				expect( blocks[ 1 ].attributes.content ).toBe(
					'Second from two'
				);
			} ).toPass( { timeout: 10000 } );
		}
	} );
} );
