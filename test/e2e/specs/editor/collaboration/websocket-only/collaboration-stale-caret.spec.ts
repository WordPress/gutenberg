import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

function paragraph( content: string ): string {
	return `<!-- wp:paragraph -->\n<p>${ content }</p>\n<!-- /wp:paragraph -->`;
}

async function getParagraphContents( page: Page ): Promise< string[] > {
	return page.evaluate( () =>
		( window as any ).wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( ( block: { attributes: { content?: unknown } } ) =>
				String( block.attributes.content ?? '' )
			)
	);
}

test.describe( 'Collaboration - WebSocket stale caret', () => {
	test( 'keeps the caret after the typed character when a peer typed earlier in the same paragraph', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Stale caret',
			date_gmt: new Date().toISOString(),
			content: paragraph( 'hello' ),
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Put a real caret at the end of the paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectionStart().offset
				)
			)
			.toBe( 5 );

		// Type "!" at the caret in the gap between core-data receiving the
		// peer's change and the block editor rendering it. Like a keystroke,
		// the edit moves the caret and changes the text together.
		await page.evaluate( ( postId ) => {
			const { select, dispatch, subscribe } = window.wp.data;
			const unsubscribe = subscribe( () => {
				const record = select( 'core' ).getEditedEntityRecord(
					'postType',
					'post',
					postId
				);
				const content = record.blocks?.[ 0 ]?.attributes?.content;
				if ( content === undefined || String( content ) === 'hello' ) {
					return;
				}
				unsubscribe();
				const [ block ] = select( 'core/block-editor' ).getBlocks();
				const type = () => {
					dispatch( 'core/block-editor' ).selectionChange(
						block.clientId,
						'content',
						6,
						6
					);
					dispatch( 'core/block-editor' ).updateBlockAttributes(
						block.clientId,
						{ content: 'hello!' }
					);
				};
				const { batch } = window.wp.data as any;
				if ( typeof batch === 'function' ) {
					batch( type );
				} else {
					type();
				}
			}, 'core' );
		}, post.id );

		// The peer types "ABC" at the start of the same paragraph.
		await collaborationUtils.page2.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				block.clientId,
				{ content: 'ABChello' }
			);
		} );

		// Wait for both editors to agree on a text that holds the "!".
		await expect
			.poll( async () => {
				const [ a, b ] = await Promise.all( [
					getParagraphContents( page ),
					getParagraphContents( collaborationUtils.page2 ),
				] );
				return a[ 0 ] === b[ 0 ] && a[ 0 ].includes( '!' );
			} )
			.toBe( true );

		// Keep typing without moving the caret. The new character must land
		// right after the "!" typed before.
		await page.keyboard.type( '?' );
		await expect
			.poll( async () => ( await getParagraphContents( page ) )[ 0 ] )
			.toContain( '?' );
		const [ content ] = await getParagraphContents( page );
		expect( content ).toContain( '!?' );
	} );
} );
