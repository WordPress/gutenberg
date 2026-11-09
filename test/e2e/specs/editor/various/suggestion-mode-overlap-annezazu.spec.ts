/**
 * annezazu's question on #73411, end to end: Anne suggests adding a
 * sentence, Bob suggests bolding words in it, Carl suggests deleting words in
 * it, including one Bob bolded. Each kind of marker has its own format, so
 * Bob's and Carl's suggestions nest inside Anne's and resolve on their own.
 *
 * This spec creates the three suggestions as three real users. Every
 * accept/reject order of the same state is driven by
 * `suggestion-mode-overlap-orders.spec.ts`, from the shared `annezazu`
 * fixture.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import {
	OVERLAP_USERS,
	createOverlapUsers,
	firstBlockHTML,
	renderOverlapHTML,
} from './suggestion-mode-overlap-utils';

const USERS = {
	a: OVERLAP_USERS[ 'overlap-anne' ],
	b: OVERLAP_USERS[ 'overlap-bob' ],
	c: OVERLAP_USERS[ 'overlap-carl' ],
};

test.describe( 'Suggestion mode: overlapping suggestions (annezazu)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		await createOverlapUsers( requestUtils );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllUsers();
		await requestUtils.setGutenbergExperiments( [] );
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
		expect( renderOverlapHTML( await firstBlockHTML( page ) ) ).toBe(
			'Intro. Bright <b>red apples</b> fell.'
		);
		const html = await firstBlockHTML( page );
		expect( html.indexOf( 'wp-suggestion-add' ) ).toBeLessThan(
			html.indexOf( 'wp-suggestion-format' )
		);
		expect( html.indexOf( 'wp-suggestion-format' ) ).toBeLessThan(
			html.indexOf( 'wp-suggestion-del' )
		);
	} );
} );
