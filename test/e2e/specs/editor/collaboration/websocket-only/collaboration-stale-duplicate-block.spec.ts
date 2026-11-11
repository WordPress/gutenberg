import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const CONTENT = `<!-- wp:group -->
<div class="wp-block-group"></div>
<!-- /wp:group -->

<!-- wp:paragraph -->
<p>hell</p>
<!-- /wp:paragraph -->`;

interface BlockSummary {
	clientId: string;
	name: string;
	content?: string;
	innerBlocks: BlockSummary[];
}

/**
 * The blocks of the edited post as core-data holds them. This is the list
 * the editor renders and saves.
 *
 * @param page   The page to read from.
 * @param postId The post to read.
 */
async function getPostBlocks(
	page: Page,
	postId: number
): Promise< BlockSummary[] > {
	return page.evaluate( ( id ) => {
		const summarize = ( blocks: any[] ): any[] =>
			blocks.map( ( block ) => ( {
				clientId: block.clientId,
				name: block.name,
				content:
					block.attributes.content === undefined
						? undefined
						: String( block.attributes.content ),
				innerBlocks: summarize( block.innerBlocks ?? [] ),
			} ) );
		const record = ( window as any ).wp.data
			.select( 'core' )
			.getEditedEntityRecord( 'postType', 'post', id );
		return summarize( record.blocks ?? [] );
	}, postId );
}

function flatten( blocks: BlockSummary[] ): BlockSummary[] {
	return blocks.flatMap( ( block ) => [
		block,
		...flatten( block.innerBlocks ),
	] );
}

test.describe( 'Collaboration - WebSocket stale duplicate block', () => {
	test( 'does not duplicate a block a peer moved into a group while the user types in it', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Stale duplicate block',
			date_gmt: new Date().toISOString(),
			content: CONTENT,
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;

		// A first edit makes both editors hold the same client IDs, as they
		// do in any session where someone has already typed.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ , block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				block.clientId,
				{ content: 'hello' }
			);
		} );
		await expect
			.poll( async () => {
				const [ a, b ] = await Promise.all( [
					getPostBlocks( page, post.id ),
					getPostBlocks( page2, post.id ),
				] );
				return (
					a.length === 2 &&
					a[ 1 ].content === 'hello' &&
					JSON.stringify(
						flatten( a ).map( ( x ) => x.clientId )
					) ===
						JSON.stringify(
							flatten( b ).map( ( x ) => x.clientId )
						)
				);
			} )
			.toBe( true );

		// Type "!" in the paragraph in the gap between core-data receiving
		// the peer's move and the block editor rendering it.
		await page.evaluate( ( postId ) => {
			const { select, dispatch, subscribe } = window.wp.data;
			const unsubscribe = subscribe( () => {
				const record = select( 'core' ).getEditedEntityRecord(
					'postType',
					'post',
					postId
				);
				if ( ! record.blocks || record.blocks.length === 2 ) {
					return;
				}
				unsubscribe();
				const [ , block ] = select( 'core/block-editor' ).getBlocks();
				dispatch( 'core/block-editor' ).updateBlockAttributes(
					block.clientId,
					{ content: 'hello!' }
				);
			}, 'core' );
		}, post.id );

		// The peer moves the paragraph into the group.
		await page2.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ group, block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).moveBlocksToPosition(
				[ block.clientId ],
				'',
				group.clientId,
				0
			);
		} );

		// Wait for both editors to agree on a document that holds the "!".
		await expect
			.poll( async () => {
				const [ a, b ] = await Promise.all( [
					getPostBlocks( page, post.id ),
					getPostBlocks( page2, post.id ),
				] );
				return (
					JSON.stringify( a ) === JSON.stringify( b ) &&
					flatten( a ).some( ( x ) => x.content === 'hello!' )
				);
			} )
			.toBe( true );

		for ( const blocks of [
			await getPostBlocks( page, post.id ),
			await getPostBlocks( page2, post.id ),
		] ) {
			const all = flatten( blocks );
			const clientIds = all.map( ( block ) => block.clientId );
			expect( new Set( clientIds ).size ).toBe( clientIds.length );
			expect(
				all.filter( ( block ) => block.name === 'core/paragraph' )
			).toHaveLength( 1 );
		}
	} );
} );
