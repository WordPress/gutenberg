import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const PARAGRAPHS = [ 'First', 'Second', 'Third', 'Fourth', 'Fifth' ];

/**
 * Stores the `getBlock()` object of every block on the page, so a later call
 * to `getReplacedBlocks()` can tell which blocks got new objects.
 *
 * @param page The page to inspect.
 */
async function storeBlockObjects( page: Page ) {
	await page.evaluate( () => {
		const { getBlock, getClientIdsWithDescendants } = (
			window as any
		 ).wp.data.select( 'core/block-editor' );
		( window as any ).__storedBlocks = new Map(
			getClientIdsWithDescendants().map( ( clientId: string ) => [
				clientId,
				getBlock( clientId ),
			] )
		);
	} );
}

/**
 * Returns the text of each block whose `getBlock()` object differs from the
 * one stored by `storeBlockObjects()`, including added and removed blocks.
 *
 * @param page The page to inspect.
 */
async function getReplacedBlocks( page: Page ): Promise< string[] > {
	return page.evaluate( () => {
		const { getBlock, getClientIdsWithDescendants } = (
			window as any
		 ).wp.data.select( 'core/block-editor' );
		const stored: Map< string, any > = ( window as any ).__storedBlocks;
		const clientIds: string[] = getClientIdsWithDescendants();
		const describeBlock = ( block: any ) =>
			`${ block.name }: ${ String( block.attributes?.content ?? '' ) }`;
		return [
			...clientIds
				.filter(
					( clientId ) =>
						getBlock( clientId ) !== stored.get( clientId )
				)
				.map( ( clientId ) => describeBlock( getBlock( clientId ) ) ),
			...[ ...stored.keys() ]
				.filter( ( clientId ) => ! clientIds.includes( clientId ) )
				.map(
					( clientId ) =>
						`removed ${ describeBlock( stored.get( clientId ) ) }`
				),
		];
	} );
}

test.describe( 'Collaboration - Block identity', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	test( 'A remote keystroke only replaces the edited block on the other peer', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const pattern = ( await requestUtils.createBlock( {
			title: 'Block identity pattern',
			status: 'publish',
			content:
				'<!-- wp:paragraph --><p>Synced pattern paragraph</p><!-- /wp:paragraph -->',
		} ) ) as { id: number };
		const paragraphs = PARAGRAPHS.map(
			( text ) =>
				`<!-- wp:paragraph --><p>${ text } paragraph</p><!-- /wp:paragraph -->`
		);
		const post = await requestUtils.createPost( {
			title: 'Block identity',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: [
				...paragraphs.slice( 0, 3 ),
				'<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph --><p>Grouped paragraph</p><!-- /wp:paragraph --></div><!-- /wp:group -->',
				`<!-- wp:block {"ref":${ pattern.id }} /-->`,
				...paragraphs.slice( 3 ),
			].join( '\n\n' ),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;

		const waitForPatternContent = ( currentPage: Page ) =>
			expect
				.poll( () =>
					currentPage.evaluate( () => {
						const { getBlocks } = ( window as any ).wp.data.select(
							'core/block-editor'
						);
						const patternBlock = getBlocks().find(
							( block: { name: string } ) =>
								block.name === 'core/block'
						);
						return getBlocks( patternBlock?.clientId ).length;
					} )
				)
				.toBe( 1 );
		await waitForPatternContent( page );
		await waitForPatternContent( page2 );

		const thirdParagraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Third paragraph' } );
		await thirdParagraph.click();
		await page.keyboard.press( 'End' );

		// The typing peer's root tree does not list the synced pattern's
		// inner blocks, so `waitForConvergence()` never settles. Poll the
		// edited paragraph instead.
		const waitForThirdParagraph = ( content: string ) =>
			expect
				.poll( () =>
					page2.evaluate(
						() =>
							( window as any ).wp.data
								.select( 'core/block-editor' )
								.getBlocks()
								.map( ( block: any ) =>
									String( block.attributes.content ?? '' )
								)[ 2 ]
					)
				)
				.toBe( content );

		// The first remote change gives the other peer the document's client
		// IDs, and so new blocks, and the next one fills in the tree entry of
		// the re-created synced pattern. Store the objects after both, so the
		// test covers steady typing.
		await page.keyboard.type( ' one' );
		await waitForThirdParagraph( 'Third paragraph one' );
		await waitForPatternContent( page2 );
		await page.keyboard.type( ' two' );
		await waitForThirdParagraph( 'Third paragraph one two' );
		await storeBlockObjects( page2 );

		await page.keyboard.type( ' three four' );
		await waitForThirdParagraph( 'Third paragraph one two three four' );

		expect( await getReplacedBlocks( page2 ) ).toEqual( [
			'core/paragraph: Third paragraph one two three four',
		] );
		await waitForPatternContent( page2 );
	} );
} );
