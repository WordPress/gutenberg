/**
 * annezazu's question on #73411, end to end: Anne suggests adding a
 * sentence, Bob suggests bolding words in it, Carl suggests deleting words in
 * it, including one Bob bolded. Each kind of marker has its own format, so
 * Bob's and Carl's suggestions nest inside Anne's and resolve on their own:
 * rejecting Anne's addition takes them with it, accepting it leaves them
 * pending.
 *
 * The first test creates the three suggestions as three real users. The rest
 * seed the same state through REST and drive every accept/reject order through
 * the sidebar, comparing the canvas after each decision, and the published
 * post at the end, with a character model of the rules.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

type Kind = 'add' | 'del' | 'format';
type Decision = 'accept' | 'reject';
type Step = { id: 'a' | 'b' | 'c'; decision: Decision };

const USERS = {
	a: {
		username: 'overlap-anne',
		email: 'overlap.anne@example.com',
		password: 'overlapannepassword',
		name: 'Anne',
	},
	b: {
		username: 'overlap-bob',
		email: 'overlap.bob@example.com',
		password: 'overlapbobpassword',
		name: 'Bob',
	},
	c: {
		username: 'overlap-carl',
		email: 'overlap.carl@example.com',
		password: 'overlapcarlpassword',
		name: 'Carl',
	},
};

const KIND: Record< Step[ 'id' ], Kind > = { a: 'add', b: 'format', c: 'del' };

/*
 * A character model of the example: each character records the marker of
 * each kind covering it and, under Bob's formatting change, whether it was
 * bold before. Accepting a deletion or rejecting an addition removes
 * characters; a pending suggestion left with none is outdated.
 */
type Char = {
	ch: string;
	bold: boolean;
	add?: string;
	format?: string;
	del?: string;
	wasBold?: boolean;
};
type State = { chars: Char[]; status: Record< string, string > };

function initialState(): State {
	const chars: Char[] = [];
	const push = ( text: string, rest: Omit< Char, 'ch' > ) => {
		for ( const ch of text ) {
			chars.push( { ch, ...rest } );
		}
	};
	push( 'Intro.', { bold: false } );
	push( ' Bright ', { bold: false, add: 'a' } );
	push( 'red ', { bold: true, add: 'a', format: 'b', wasBold: false } );
	push( 'apples', {
		bold: true,
		add: 'a',
		format: 'b',
		wasBold: false,
		del: 'c',
	} );
	push( ' fell', { bold: false, add: 'a', del: 'c' } );
	push( '.', { bold: false, add: 'a' } );
	return {
		chars,
		status: { a: 'pending', b: 'pending', c: 'pending' },
	};
}

function decide( state: State, { id, decision }: Step ): State {
	const kind = KIND[ id ];
	let chars = state.chars.map( ( char ) => ( { ...char } ) );
	if (
		( kind === 'add' && decision === 'reject' ) ||
		( kind === 'del' && decision === 'accept' )
	) {
		chars = chars.filter( ( char ) => char[ kind ] !== id );
	} else {
		for ( const char of chars ) {
			if ( char[ kind ] !== id ) {
				continue;
			}
			if ( kind === 'format' && decision === 'reject' ) {
				char.bold = !! char.wasBold;
			}
			delete char[ kind ];
		}
	}
	const status = {
		...state.status,
		[ id ]: decision === 'accept' ? 'applied' : 'rejected',
	};
	for ( const other of [ 'a', 'b', 'c' ] as const ) {
		if (
			status[ other ] === 'pending' &&
			! chars.some( ( char ) => char[ KIND[ other ] ] === other )
		) {
			status[ other ] = 'outdated';
		}
	}
	return { chars, status };
}

function sequences( state: State ): Step[][] {
	const pending = ( [ 'a', 'b', 'c' ] as const ).filter(
		( id ) => state.status[ id ] === 'pending'
	);
	if ( ! pending.length ) {
		return [ [] ];
	}
	return pending.flatMap( ( id ) =>
		( [ 'accept', 'reject' ] as Decision[] ).flatMap( ( decision ) =>
			sequences( decide( state, { id, decision } ) ).map( ( rest ) => [
				{ id, decision },
				...rest,
			] )
		)
	);
}

/**
 * Text with bold runs in `<b>`, the form every rendering is compared in.
 *
 * @param chars Characters and whether each is bold.
 */
function renderChars( chars: Array< { ch: string; bold: boolean } > ) {
	let out = '';
	let bold = false;
	for ( const { ch, bold: isBold } of chars ) {
		if ( isBold !== bold ) {
			out += isBold ? '<b>' : '</b>';
			bold = isBold;
		}
		out += ch;
	}
	return out + ( bold ? '</b>' : '' );
}

/**
 * The same rendering, read from HTML: text, and whether each character sits
 * in a `<strong>`. Markers and other tags only contribute their text.
 *
 * @param html HTML.
 */
function renderHTML( html: string ) {
	const chars: Array< { ch: string; bold: boolean } > = [];
	let depth = 0;
	for ( const token of html.match( /<[^>]+>|[^<]+/g ) ?? [] ) {
		if ( token.startsWith( '<' ) ) {
			if ( /^<strong\b/i.test( token ) ) {
				depth++;
			} else if ( /^<\/strong>/i.test( token ) ) {
				depth--;
			}
			continue;
		}
		for ( const ch of token
			.replace( /&nbsp;/g, ' ' )
			.replace( /&amp;/g, '&' ) ) {
			chars.push( { ch, bold: depth > 0 } );
		}
	}
	return renderChars( chars );
}

/**
 * The example as block content, in canonical marker order (add, then format,
 * then del, then bold), with each suggestion's note id.
 *
 * @param ids     Note ids by suggestion.
 * @param authors User ids by suggestion.
 */
function exampleContent(
	ids: Record< string, number >,
	authors: Record< string, number >
) {
	const open = ( key: 'a' | 'b' | 'c' ) =>
		`<mark data-suggestion-id="${ ids[ key ] }" data-suggestion-type="${
			KIND[ key ]
		}" data-author="${ authors[ key ] }" class="wp-suggestion-${
			KIND[ key ]
		}">`;
	const paragraph = `<p>Intro.${ open( 'a' ) } Bright ${ open(
		'b'
	) }<strong>red </strong>${ open(
		'c'
	) }<strong>apples</strong></mark></mark>${ open(
		'c'
	) } fell</mark>.</mark></p>`;
	const metadata = JSON.stringify( {
		noteId: [ ids.a, ids.b, ids.c ],
	} );
	return `<!-- wp:paragraph {"metadata":${ metadata }} -->\n${ paragraph }\n<!-- /wp:paragraph -->`;
}

function suggestionPayload( key: 'a' | 'b' | 'c' ) {
	return JSON.stringify( {
		schemaVersion: 2,
		blockName: 'core/paragraph',
		baseRevision: null,
		operations: [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: KIND[ key ],
				...( key === 'b' && {
					beforeHTML: 'red apples',
					afterHTML: '<strong>red apples</strong>',
				} ),
			},
		],
	} );
}

async function seed( requestUtils: any, authors: Record< string, number > ) {
	const post = await requestUtils.createPost( {
		title: 'Overlapping suggestions',
		content: '<!-- wp:paragraph --><p>Intro.</p><!-- /wp:paragraph -->',
		status: 'draft',
	} );
	const ids: Record< string, number > = {};
	for ( const key of [ 'a', 'b', 'c' ] as const ) {
		const note = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: post.id,
				content: '',
				type: 'note',
				status: 'hold',
				parent: 0,
				author: authors[ key ],
				meta: { _wp_suggestion: suggestionPayload( key ) },
			},
		} );
		ids[ key ] = note.id;
	}
	await requestUtils.rest( {
		method: 'PUT',
		path: `/wp/v2/posts/${ post.id }`,
		data: { content: exampleContent( ids, authors ) },
	} );
	return { postId: post.id, ids };
}

async function blockHTML( page: any ) {
	return page.evaluate( () => {
		const [ block ] = window.wp.data
			.select( 'core/block-editor' )
			.getBlocks();
		return String( block.attributes.content );
	} );
}

const label = ( sequence: Step[] ) =>
	sequence
		.map(
			( { id, decision } ) =>
				`${ decision === 'accept' ? '+' : '-' }${ id }`
		)
		.join( ' ' );

test.describe( 'Suggestion mode: overlapping suggestions (annezazu)', () => {
	const authors: Record< string, number > = {};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		for ( const [ key, user ] of Object.entries( USERS ) ) {
			const created = await requestUtils.createUser( {
				username: user.username,
				email: user.email,
				password: user.password,
				roles: [ 'editor' ],
			} );
			await requestUtils.rest( {
				method: 'PUT',
				path: `/wp/v2/users/${ created.id }`,
				data: { name: user.name },
			} );
			authors[ key ] = created.id;
		}
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllUsers();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'has 37 decision orders', () => {
		expect( sequences( initialState() ) ).toHaveLength( 37 );
	} );

	test( 'three people nest their suggestions in one addition', async ( {
		page,
		editor,
		pageUtils,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Overlapping suggestions',
			content: '<!-- wp:paragraph --><p>Intro.</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();

		async function loginAs( user: ( typeof USERS )[ 'a' ] ) {
			await page.context().clearCookies();
			await page.goto( '/wp-login.php' );
			await page.locator( '#user_login' ).fill( user.username );
			await page.locator( '#user_pass' ).fill( user.password );
			await page.getByRole( 'button', { name: 'Log In' } ).click();
			await page.waitForURL( '**/wp-admin/**' );
			await page.goto(
				`/wp-admin/post.php?post=${ post.id }&action=edit`
			);
			const takeOver = page.getByText( 'Take over', { exact: true } );
			if (
				await takeOver
					.waitFor( { state: 'visible', timeout: 4000 } )
					.then( () => true )
					.catch( () => false )
			) {
				await takeOver.click();
			}
			await page.waitForFunction( () => !! window?.wp?.data );
			const guide = page.getByRole( 'dialog', { name: /Welcome to/ } );
			if (
				await guide
					.waitFor( { state: 'visible', timeout: 3000 } )
					.then( () => true )
					.catch( () => false )
			) {
				await guide.getByRole( 'button', { name: 'Close' } ).click();
			}
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page
				.getByRole( 'menuitemradio', { name: /^Suggesting/ } )
				.click();
			await page.keyboard.press( 'Escape' );
		}

		const selectText = ( start: number, end: number ) =>
			page.evaluate(
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
		const noteSaved = () =>
			page.waitForResponse(
				( response: any ) =>
					/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
					[ 'POST', 'PUT' ].includes( response.request().method() ) &&
					response.ok()
			);

		// Anne suggests adding a sentence.
		await loginAs( USERS.a );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		let saved = noteSaved();
		await page.keyboard.type( ' Bright red apples fell.' );
		await saved;
		await expect(
			paragraph.locator( 'mark.wp-suggestion-add' )
		).toHaveText( ' Bright red apples fell.' );
		await editor.saveDraft();

		// Bob bolds "red apples" inside it.
		await loginAs( USERS.b );
		await paragraph.click();
		await selectText( 14, 24 );
		saved = noteSaved();
		await pageUtils.pressKeys( 'primary+b' );
		await saved;
		await expect(
			paragraph.locator(
				'mark.wp-suggestion-add mark.wp-suggestion-format'
			)
		).toHaveText( 'red apples' );
		await editor.saveDraft();

		// Carl deletes "apples fell", including the bolded "apples".
		await loginAs( USERS.c );
		await paragraph.click();
		await selectText( 18, 29 );
		saved = noteSaved();
		await page.keyboard.press( 'Backspace' );
		await saved;
		await expect(
			paragraph.locator( 'mark.wp-suggestion-add mark.wp-suggestion-del' )
		).toHaveText( [ 'apples', ' fell' ] );
		await editor.saveDraft();

		// Three suggestions, one per author, the text untouched.
		await expect( paragraph ).toHaveText(
			'Intro. Bright red apples fell.'
		);
		const notes = await requestUtils.rest( {
			path: '/wp/v2/comments',
			params: { post: post.id, type: 'note', status: 'hold' },
		} );
		expect( notes.map( ( note: any ) => note.author_name ).sort() ).toEqual(
			[ 'Anne', 'Bob', 'Carl' ]
		);
		// The canvas nests them in canonical order.
		expect( renderHTML( await blockHTML( page ) ) ).toBe(
			'Intro. Bright <b>red apples</b> fell.'
		);
		const html = await blockHTML( page );
		expect( html.indexOf( 'wp-suggestion-add' ) ).toBeLessThan(
			html.indexOf( 'wp-suggestion-format' )
		);
		expect( html.indexOf( 'wp-suggestion-format' ) ).toBeLessThan(
			html.indexOf( 'wp-suggestion-del' )
		);
	} );

	test.describe( 'every decision order', () => {
		for ( const sequence of sequences( initialState() ) ) {
			test(
				// eslint-disable-next-line playwright/valid-title -- One test per generated order.
				label( sequence ),
				async ( { admin, page, editor, requestUtils } ) => {
					const { postId, ids } = await seed( requestUtils, authors );
					await admin.editPost( postId );
					const sidebar = page.getByRole( 'region', {
						name: 'Editor settings',
					} );
					const toggle = page
						.getByRole( 'region', { name: 'Editor top bar' } )
						.getByRole( 'button', {
							name: 'All notes',
							exact: true,
						} );
					if (
						( await toggle.getAttribute( 'aria-expanded' ) ) ===
						'false'
					) {
						await toggle.click();
					}

					let state = initialState();
					expect( renderHTML( await blockHTML( page ) ) ).toBe(
						renderChars( state.chars )
					);
					for ( const step of sequence ) {
						const thread = sidebar.locator(
							`#note-thread-${ ids[ step.id ] }`
						);
						const decided = page.waitForResponse(
							( response: any ) =>
								response
									.url()
									.includes(
										`/wp/v2/comments/${ ids[ step.id ] }`
									) && response.ok()
						);
						await thread
							.getByRole( 'button', {
								name:
									step.decision === 'accept'
										? 'Accept suggestion'
										: 'Reject suggestion',
							} )
							.click();
						await decided;
						state = decide( state, step );
						await expect
							.poll( async () =>
								renderHTML( await blockHTML( page ) )
							)
							.toBe( renderChars( state.chars ) );
						// An outdated suggestion's markers left with its text.
						for ( const key of (
							[ 'a', 'b', 'c' ] as const
						 ).filter(
							( id ) => state.status[ id ] !== 'pending'
						) ) {
							await expect(
								editor.canvas.locator(
									`mark[data-suggestion-id="${ ids[ key ] }"]`
								)
							).toHaveCount( 0 );
						}
					}

					// Published, the post reads as the model says.
					await editor.saveDraft();
					const saved = await requestUtils.rest( {
						path: `/wp/v2/posts/${ postId }`,
					} );
					expect( renderHTML( saved.content.rendered.trim() ) ).toBe(
						renderChars( state.chars )
					);
					// Every decision is recorded on its note.
					for ( const step of sequence ) {
						const note = await requestUtils.rest( {
							path: `/wp/v2/comments/${ ids[ step.id ] }`,
							params: { context: 'edit' },
						} );
						expect( note.meta._wp_suggestion_status ).toBe(
							step.decision === 'accept' ? 'applied' : 'rejected'
						);
					}
				}
			);
		}
	} );
} );
