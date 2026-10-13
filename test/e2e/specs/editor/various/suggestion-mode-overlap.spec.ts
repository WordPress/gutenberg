/**
 * Suggesting over another author's pending suggestion (#73411). Each marker
 * kind has its own format, so a deletion or a formatting change can sit
 * inside someone's addition, and a deletion and a formatting change can
 * share text. Two suggestions of one kind on the same text still cannot, and
 * neither can formatting that crosses the edge of someone's addition: those
 * are refused with the other author named and a way to reply to them.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

type Kind = 'add' | 'del' | 'format';

const AUTHORS = {
	anne: { username: 'matrix-anne', name: 'Anne' },
	bob: { username: 'matrix-bob', name: 'Bob' },
	carl: { username: 'matrix-carl', name: 'Carl' },
};

async function switchToSuggesting( page: any ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	await page.getByRole( 'menuitemradio', { name: /^Suggesting/ } ).click();
	await page.keyboard.press( 'Escape' );
}

function noteSaved( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

/**
 * Select `[start, end)` of the first paragraph through the block editor
 * store, which RichText mirrors onto the DOM. Arrow keys step over the
 * screen-reader decoration's boundaries, so they cannot count offsets.
 *
 * @param page  Playwright page.
 * @param start Range start.
 * @param end   Range end.
 */
async function selectText( page: any, start: number, end = start ) {
	await page.evaluate(
		( [ s, e ]: number[] ) => {
			const { select, dispatch } = window.wp.data;
			const [ block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).selectionChange(
				block.clientId,
				'content',
				s,
				e
			);
		},
		[ start, end ]
	);
}

function refusal( page: any, text: string ) {
	return page.locator( '.components-snackbar-list' ).getByText( text );
}

test.describe( 'Suggestion mode: suggesting over another author', () => {
	const authorIds: Record< string, number > = {};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		for ( const [ key, user ] of Object.entries( AUTHORS ) ) {
			const created = await requestUtils.createUser( {
				username: user.username,
				email: `${ user.username }@example.com`,
				password: `${ user.username }-password`,
				roles: [ 'editor' ],
			} );
			await requestUtils.rest( {
				method: 'PUT',
				path: `/wp/v2/users/${ created.id }`,
				data: { name: user.name },
			} );
			authorIds[ key ] = created.id;
		}
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllUsers();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	/**
	 * Create a post whose paragraph holds markers by other authors, each with
	 * its note, then open it.
	 *
	 * @param fixtures              Fixtures.
	 * @param fixtures.admin        Admin fixture.
	 * @param fixtures.requestUtils Request utils.
	 * @param markers               The suggestions, in order of their `%n` slot.
	 * @param html                  Paragraph HTML; `{n}` opens the n-th marker.
	 * @return Note ids, in order.
	 */
	async function openWithSuggestions(
		{ admin, requestUtils }: any,
		markers: Array< {
			kind: Kind;
			author: keyof typeof AUTHORS;
			beforeHTML?: string;
		} >,
		html: string
	) {
		const post = await requestUtils.createPost( {
			title: 'Overlap',
			content: '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		const ids: number[] = [];
		for ( const { kind, author, beforeHTML } of markers ) {
			const note = await requestUtils.rest( {
				method: 'POST',
				path: '/wp/v2/comments',
				data: {
					post: post.id,
					content: '',
					type: 'note',
					status: 'hold',
					parent: 0,
					author: authorIds[ author ],
					meta: {
						_wp_suggestion: JSON.stringify( {
							schemaVersion: 2,
							blockName: 'core/paragraph',
							baseRevision: null,
							operations: [
								{
									type: 'inline-suggestion',
									attribute: 'content',
									suggestionType: kind,
									...( beforeHTML !== undefined && {
										beforeHTML,
									} ),
								},
							],
						} ),
					},
				},
			} );
			ids.push( note.id );
		}
		const paragraph = html.replace( /\{(\d)\}/g, ( _match, index ) => {
			const { kind, author } = markers[ Number( index ) ];
			return `<mark data-suggestion-id="${
				ids[ Number( index ) ]
			}" data-suggestion-type="${ kind }" data-author="${
				authorIds[ author ]
			}" class="wp-suggestion-${ kind }">`;
		} );
		await requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/posts/${ post.id }`,
			data: {
				content: `<!-- wp:paragraph {"metadata":{"noteId":[${ ids.join(
					','
				) }]}} -->\n<p>${ paragraph }</p>\n<!-- /wp:paragraph -->`,
			},
		} );
		await admin.editPost( post.id );
		return ids;
	}

	const paragraphOf = ( editor: any ) =>
		editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();

	test.describe( 'allowed', () => {
		test( 'deleting inside another author’s addition nests a deletion in it', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const [ addId ] = await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'add', author: 'anne' } ],
				'Intro.{0} Bright red apples fell.</mark>'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 18, 24 );
			const saved = noteSaved( page );
			await page.keyboard.press( 'Backspace' );
			await saved;
			const nested = paragraph.locator(
				`mark.wp-suggestion-add[data-suggestion-id="${ addId }"] mark.wp-suggestion-del`
			);
			await expect( nested ).toHaveText( 'apples' );
			await expect( paragraph ).toHaveText(
				'Intro. Bright red apples fell.'
			);
		} );

		test( 'formatting inside another author’s addition nests a formatting change in it', async ( {
			admin,
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'add', author: 'anne' } ],
				'Intro.{0} Bright red apples fell.</mark>'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 14, 17 );
			const saved = noteSaved( page );
			await pageUtils.pressKeys( 'primary+b' );
			await saved;
			await expect(
				paragraph.locator(
					'mark.wp-suggestion-add mark.wp-suggestion-format strong'
				)
			).toHaveText( 'red' );
		} );

		test( 'deleting inside another author’s formatting change nests a deletion in it', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'format', author: 'bob', beforeHTML: 'red apples' } ],
				'Intro. {0}<strong>red apples</strong></mark> fell.'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 11, 17 );
			const saved = noteSaved( page );
			await page.keyboard.press( 'Backspace' );
			await saved;
			await expect(
				paragraph.locator(
					'mark.wp-suggestion-format mark.wp-suggestion-del'
				)
			).toHaveText( 'apples' );
		} );

		test( 'formatting inside another author’s deletion wraps it in a formatting change', async ( {
			admin,
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'del', author: 'carl' } ],
				'Intro. {0}red apples</mark> fell.'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 7, 10 );
			const saved = noteSaved( page );
			await pageUtils.pressKeys( 'primary+b' );
			await saved;
			// Canonical order: the formatting change outside the deletion.
			await expect(
				paragraph.locator(
					'mark.wp-suggestion-format mark.wp-suggestion-del strong'
				)
			).toHaveText( 'red' );
		} );

		test( 'one deletion spans plain text and another author’s addition', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'add', author: 'anne' } ],
				'Intro.{0} Bright red apples fell.</mark>'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 3, 13 );
			const saved = noteSaved( page );
			await page.keyboard.press( 'Backspace' );
			await saved;
			const deletion = paragraph.locator( 'mark.wp-suggestion-del' );
			// One suggestion, split around the addition's edge.
			await expect( deletion ).toHaveText( [ 'ro.', ' Bright' ] );
			const ids = await deletion.evaluateAll( ( marks: Element[] ) =>
				marks.map( ( mark ) =>
					mark.getAttribute( 'data-suggestion-id' )
				)
			);
			expect( new Set( ids ).size ).toBe( 1 );
		} );

		test( 'typing inside another author’s formatting change adds next to it', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const [ formatId ] = await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'format', author: 'bob', beforeHTML: 'red apples' } ],
				'Intro. {0}<strong>red apples</strong></mark> fell.'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 11 );
			const saved = noteSaved( page );
			await page.keyboard.type( 'X' );
			await saved;
			await expect(
				paragraph.locator( 'mark.wp-suggestion-add' )
			).toHaveText( 'X' );
			// The formatting change keeps exactly its own characters.
			await expect(
				paragraph.locator(
					`mark.wp-suggestion-format[data-suggestion-id="${ formatId }"]`
				)
			).toHaveText( [ 'red ', 'apples' ] );
		} );
	} );

	test.describe( 'refused', () => {
		test( 'typing inside another author’s addition names them and offers a reply', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const [ addId ] = await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'add', author: 'anne' } ],
				'Intro.{0} Bright red apples fell.</mark>'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 14 );
			await page.keyboard.type( 'X' );
			await expect(
				refusal(
					page,
					'Anne suggested adding this text. Reply to their suggestion to propose a change.'
				)
			).toBeVisible();
			await expect( paragraph ).toHaveText(
				'Intro. Bright red apples fell.'
			);
			await page
				.locator( '.components-snackbar-list' )
				.getByRole( 'button', { name: 'Reply to this suggestion' } )
				.click();
			const thread = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.locator( `#note-thread-${ addId }` );
			await expect( thread ).toBeVisible();
			await expect( thread ).toBeFocused();
		} );

		test( 'deleting over another author’s deletion names them', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'del', author: 'carl' } ],
				'Intro. {0}red apples</mark> fell.'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 5, 10 );
			await page.keyboard.press( 'Backspace' );
			await expect(
				refusal( page, 'Carl already suggested deleting this text.' )
			).toBeVisible();
			await expect(
				paragraph.locator( 'mark[data-suggestion-id]' )
			).toHaveCount( 1 );
		} );

		test( 'typing inside another author’s deletion names them', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'del', author: 'carl' } ],
				'Intro. {0}red apples</mark> fell.'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 9 );
			await page.keyboard.type( 'X' );
			await expect(
				refusal(
					page,
					'Carl suggested deleting this text. Reply to their suggestion to propose a change.'
				)
			).toBeVisible();
			await expect( paragraph ).toHaveText( 'Intro. red apples fell.' );
		} );

		test( 'formatting over another author’s formatting change names them', async ( {
			admin,
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'format', author: 'bob', beforeHTML: 'red apples' } ],
				'Intro. {0}<strong>red apples</strong></mark> fell.'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 7, 10 );
			await pageUtils.pressKeys( 'primary+i' );
			await expect(
				refusal( page, 'Bob already suggested formatting this text.' )
			).toBeVisible();
			await expect( paragraph.locator( 'em' ) ).toHaveCount( 0 );
		} );

		test( 'formatting across the edge of another author’s addition names them', async ( {
			admin,
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			await openWithSuggestions(
				{ admin, requestUtils },
				[ { kind: 'add', author: 'anne' } ],
				'Intro.{0} Bright red apples fell.</mark>'
			);
			await switchToSuggesting( page );
			const paragraph = paragraphOf( editor );
			await paragraph.click();
			await selectText( page, 2, 13 );
			await pageUtils.pressKeys( 'primary+b' );
			await expect(
				refusal(
					page,
					'This formatting crosses a suggested addition by Anne. Format the added text and the text around it separately.'
				)
			).toBeVisible();
			await expect( paragraph.locator( 'strong' ) ).toHaveCount( 0 );
		} );
	} );

	test.describe( 'reviewing nested suggestions', () => {
		const annezazu =
			'Intro.{0} Bright {1}<strong>red </strong>{2}<strong>apples</strong></mark></mark>{2} fell</mark>.</mark>';
		const markers = [
			{ kind: 'add' as Kind, author: 'anne' as const },
			{
				kind: 'format' as Kind,
				author: 'bob' as const,
				beforeHTML: 'red apples',
			},
			{ kind: 'del' as Kind, author: 'carl' as const },
		];

		async function openSidebar( page: any ) {
			const toggle = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'All notes', exact: true } );
			if (
				( await toggle.getAttribute( 'aria-expanded' ) ) === 'false'
			) {
				await toggle.click();
			}
			return page.getByRole( 'region', { name: 'Editor settings' } );
		}

		test( 'the sidebar says where each suggestion sits and what rejecting the addition does', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const [ a, b, c ] = await openWithSuggestions(
				{ admin, requestUtils },
				markers,
				annezazu
			);
			const sidebar = await openSidebar( page );
			const thread = ( id: number ) =>
				sidebar.locator( `#note-thread-${ id }` );
			await expect( thread( a ) ).toContainText(
				'Includes 2 suggestions from others'
			);
			await expect( thread( a ) ).toContainText(
				'Rejecting also makes 2 suggestions outdated.'
			);
			await expect( thread( b ) ).toContainText(
				'Inside a suggested addition by Anne'
			);
			await expect( thread( c ) ).toContainText(
				'Inside a suggested addition by Anne'
			);
		} );

		test( 'undo brings back the suggestions a rejected addition took with it', async ( {
			admin,
			editor,
			page,
			pageUtils,
			requestUtils,
		} ) => {
			const [ a, b, c ] = await openWithSuggestions(
				{ admin, requestUtils },
				markers,
				annezazu
			);
			const sidebar = await openSidebar( page );
			const rejected = page.waitForResponse(
				( response: any ) =>
					response.url().includes( `/wp/v2/comments/${ a }` ) &&
					response.ok()
			);
			await sidebar
				.locator( `#note-thread-${ a }` )
				.getByRole( 'button', { name: 'Reject suggestion' } )
				.click();
			await rejected;
			const paragraph = paragraphOf( editor );
			await expect( paragraph ).toHaveText( 'Intro.' );
			for ( const id of [ b, c ] ) {
				await expect(
					paragraph.locator( `mark[data-suggestion-id="${ id }"]` )
				).toHaveCount( 0 );
			}

			await pageUtils.pressKeys( 'primary+z' );
			await expect( paragraph ).toHaveText(
				'Intro. Bright red apples fell.'
			);
			for ( const id of [ a, b, c ] ) {
				await expect(
					paragraph.locator( `mark[data-suggestion-id="${ id }"]` )
				).not.toHaveCount( 0 );
			}
			// Nobody's nested suggestion was trashed along the way.
			for ( const id of [ b, c ] ) {
				const note = await requestUtils.rest( {
					path: `/wp/v2/comments/${ id }`,
					params: { context: 'edit' },
				} );
				expect( note.status ).toBe( 'hold' );
			}
		} );
	} );
} );
