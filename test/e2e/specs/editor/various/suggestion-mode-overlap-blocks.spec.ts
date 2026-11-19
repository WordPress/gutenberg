/**
 * Block suggestions over another author's (#73411, phase C). Anne's
 * suggestion is seeded on the block; the admin, suggesting, acts on the same
 * block. Each suggestion keeps its own note and is decided on its own.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import {
	createOverlapUsers,
	decideSuggestion,
	openNotesSidebar,
} from './suggestion-mode-overlap-utils';

const ANNE = 'overlap-anne';

async function switchToSuggesting( page: any ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	await page.getByRole( 'menuitemradio', { name: /^Suggesting/ } ).click();
	await page.keyboard.press( 'Escape' );
}

/**
 * The id of the next suggestion note the editor creates.
 *
 * @param page Playwright page.
 * @return Note id.
 */
async function nextNoteId( page: any ): Promise< number > {
	const response = await page.waitForResponse(
		( candidate: any ) =>
			/\/wp\/v2\/comments(\?|$)/.test( candidate.url() ) &&
			candidate.request().method() === 'POST' &&
			candidate.ok()
	);
	return ( await response.json() ).id;
}

/**
 * The block markers on the first block of a type, outer first.
 *
 * @param page Playwright page.
 * @param name Block name.
 * @return Markers.
 */
async function markersOf( page: any, name: string ) {
	return page.evaluate( ( blockName: string ) => {
		const block = window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.find( ( candidate: any ) => candidate.name === blockName );
		const marker = block?.attributes?.metadata?.suggestion;
		if ( ! marker ) {
			return [];
		}
		const { nested = [], ...outer } = marker;
		return [ outer, ...nested ];
	}, name );
}

test.describe( 'Suggestion mode: block suggestions over another author', () => {
	let userIds: Record< string, number > = {};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		userIds = await createOverlapUsers( requestUtils );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllUsers();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	/**
	 * Create a post with Anne's suggestion on its first block, then open it.
	 *
	 * @param fixtures              Fixtures.
	 * @param fixtures.admin        Admin fixture.
	 * @param fixtures.requestUtils Request utils.
	 * @param args                  What Anne suggested.
	 * @param args.blockName        First block's name.
	 * @param args.blockHTML        First block's inner HTML.
	 * @param args.attributes       First block's attributes, `metadata` aside.
	 * @param args.marker           Anne's marker, without author and note.
	 * @param args.operations       Her note's payload operations.
	 * @return Anne's note id.
	 */
	async function openWithAnnesSuggestion(
		{ admin, requestUtils }: any,
		{
			blockName,
			blockHTML,
			attributes = {},
			marker,
			operations,
		}: {
			blockName: string;
			blockHTML: string;
			attributes?: Record< string, unknown >;
			marker: Record< string, unknown >;
			operations: any[];
		}
	) {
		const post = await requestUtils.createPost( {
			title: 'Block overlap',
			content: '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		const note = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: post.id,
				content: '',
				type: 'note',
				status: 'hold',
				parent: 0,
				author: userIds[ ANNE ],
				meta: {
					_wp_suggestion: JSON.stringify( {
						schemaVersion: 2,
						blockName,
						baseRevision: null,
						operations,
					} ),
				},
			},
		} );
		const attrs = JSON.stringify( {
			...attributes,
			metadata: {
				noteId: [ note.id ],
				suggestion: {
					...marker,
					authorId: userIds[ ANNE ],
					commentId: note.id,
				},
			},
		} );
		const name = blockName.replace( /^core\//, '' );
		await requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/posts/${ post.id }`,
			data: {
				content: `<!-- wp:${ name } ${ attrs } -->\n${ blockHTML }\n<!-- /wp:${ name } -->\n\n<!-- wp:paragraph -->\n<p>Second</p>\n<!-- /wp:paragraph -->`,
			},
		} );
		await admin.editPost( post.id );
		return note.id as number;
	}

	const anneInserted = {
		blockName: 'core/paragraph',
		blockHTML: '<p>Anne’s new paragraph</p>',
		marker: { type: 'pending-insert' },
		operations: [
			{
				type: 'block-insert-after',
				clientId: 'seeded',
				blockName: 'core/paragraph',
				anchorClientId: null,
				parentClientId: null,
			},
		],
	};

	const anneHeadingLevel = {
		blockName: 'core/heading',
		blockHTML: '<h2 class="wp-block-heading">A heading</h2>',
		marker: { type: 'pending-attributes', after: { level: 3 } },
		operations: [
			{
				type: 'attribute-set',
				attribute: 'level',
				before: 2,
				after: 3,
			},
		],
	};

	const anneMoved = {
		blockName: 'core/paragraph',
		blockHTML: '<p>Anne moved this</p>',
		marker: {
			type: 'pending-move',
			fromAnchorClientId: null,
			fromParentClientId: null,
			fromIndex: 1,
			crossedParents: false,
		},
		operations: [
			{
				type: 'block-move',
				clientId: 'seeded',
				blockName: 'core/paragraph',
				fromAnchorClientId: null,
				fromParentClientId: null,
				fromIndex: 1,
				toAnchorClientId: null,
				toParentClientId: null,
			},
		],
	};

	test( 'removing another author’s suggested block nests a removal on it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const anneId = await openWithAnnesSuggestion(
			{ admin, requestUtils },
			anneInserted
		);
		await switchToSuggesting( page );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		);
		const created = nextNoteId( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		const removalId = await created;

		await expect
			.poll( () => markersOf( page, 'core/paragraph' ) )
			.toMatchObject( [
				{ type: 'pending-insert', commentId: anneId },
				{ type: 'pending-remove', commentId: removalId },
			] );
		await expect(
			editor.canvas.getByText( 'Anne’s new paragraph' )
		).toBeVisible();

		// Rejecting the removal leaves Anne's suggested block pending.
		const sidebar = await openNotesSidebar( page );
		await expect(
			sidebar
				.locator( `#note-thread-${ removalId }` )
				.getByText( 'Anne suggested adding this block' )
		).toBeVisible();
		await decideSuggestion( page, sidebar, removalId, 'reject' );
		await expect
			.poll( () => markersOf( page, 'core/paragraph' ) )
			.toMatchObject( [ { type: 'pending-insert', commentId: anneId } ] );
	} );

	test( 'accepting a removal nested on a suggested block removes it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openWithAnnesSuggestion( { admin, requestUtils }, anneInserted );
		await switchToSuggesting( page );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		);
		const created = nextNoteId( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		const removalId = await created;

		const sidebar = await openNotesSidebar( page );
		await decideSuggestion( page, sidebar, removalId, 'accept' );
		await expect(
			editor.canvas.getByText( 'Anne’s new paragraph' )
		).toBeHidden();
	} );

	test( 'a second heading level change is its own proposal, shown on top', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const anneId = await openWithAnnesSuggestion(
			{ admin, requestUtils },
			anneHeadingLevel
		);
		await switchToSuggesting( page );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		const created = nextNoteId( page );
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading \d$/ } )
			.click();
		await page.getByRole( 'menuitem', { name: /^Heading 4/ } ).click();
		const levelId = await created;

		await expect
			.poll( () => markersOf( page, 'core/heading' ) )
			.toMatchObject( [
				{
					type: 'pending-attributes',
					commentId: anneId,
					after: { level: 3 },
				},
				{
					type: 'pending-attributes',
					commentId: levelId,
					after: { level: 4 },
				},
			] );
		// The later note's proposal shows.
		await expect(
			editor.canvas.locator( 'h4.wp-block-heading' )
		).toHaveText( 'A heading' );

		// Accepting it leaves Anne's proposal pending, still a change.
		const sidebar = await openNotesSidebar( page );
		await decideSuggestion( page, sidebar, levelId, 'accept' );
		await expect
			.poll( () => markersOf( page, 'core/heading' ) )
			.toMatchObject( [
				{
					type: 'pending-attributes',
					commentId: anneId,
					after: { level: 3 },
				},
			] );
	} );

	test( 'removing a block another author suggested moving keeps the move', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const anneId = await openWithAnnesSuggestion(
			{ admin, requestUtils },
			anneMoved
		);
		await switchToSuggesting( page );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		);
		const created = nextNoteId( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		const removalId = await created;

		await expect
			.poll( () => markersOf( page, 'core/paragraph' ) )
			.toMatchObject( [
				{ type: 'pending-move', commentId: anneId },
				{ type: 'pending-remove', commentId: removalId },
			] );
	} );

	test( 'moving a block another author suggested moving puts it back', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const anneId = await openWithAnnesSuggestion(
			{ admin, requestUtils },
			anneMoved
		);
		await switchToSuggesting( page );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Anne moved this' } )
			.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Move down' } )
			.click();

		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText(
					'Someone else has already suggested moving this block.'
				)
		).toBeVisible();
		await expect
			.poll( () => markersOf( page, 'core/paragraph' ) )
			.toMatchObject( [ { type: 'pending-move', commentId: anneId } ] );
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		).toContainText( 'Anne moved this' );
	} );
} );
