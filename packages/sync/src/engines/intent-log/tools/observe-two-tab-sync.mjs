/**
 * Manual two-tab sync observer for the intent-log engine.
 *
 *   WP_BASE_URL=http://localhost:8891 node observe-two-tab-sync.mjs [scenario]
 *
 * Drives two logged-in tabs (same user) against a freshly created post on a
 * LIVE environment — including dev bundles, which jest and the minified e2e
 * environment cannot exercise (the clientId rendering bug shipped green
 * through both) — and prints each tab's block store, canvas, and console
 * errors. Scenarios: type (default), split, split-settled, empty-race.
 *
 * Requires: the env's admin login (WP_USERNAME/WP_PASSWORD, default
 * admin/password), collaboration enabled, wp_sync_engine=intent-log, and
 * `@playwright/test` resolvable (run from the repo root).
 */
import { chromium } from '@playwright/test';

const BASE = process.env.WP_BASE_URL ?? 'http://localhost:8891';
const USER = process.env.WP_USERNAME ?? 'admin';
const PASS = process.env.WP_PASSWORD ?? 'password';
const scenario = process.argv[ 2 ] ?? 'type';

async function main() {
	const browser = await chromium.launch();
	const context = await browser.newContext();

	const pageA = await context.newPage();
	await pageA.goto( `${ BASE }/wp-login.php` );
	await pageA.fill( '#user_login', USER );
	await pageA.fill( '#user_pass', PASS );
	await pageA.click( '#wp-submit' );
	await pageA.waitForURL( /wp-admin/ );

	// Create a fresh post via the REST nonce-less route: use post-new and read
	// the id from the editor, avoiding wp-cli dependencies.
	await pageA.goto( `${ BASE }/wp-admin/post-new.php` );
	await pageA
		.getByRole( 'button', { name: /Close|Get started/i } )
		.first()
		.click( { timeout: 4000 } )
		.catch( () => {} );
	const postId = await pageA
		.waitForFunction( () =>
			window.wp?.data?.select( 'core/editor' )?.getCurrentPostId()
		)
		.then( ( handle ) => handle.jsonValue() );
	console.log( 'post:', postId );

	const pageB = await context.newPage();
	await pageB.goto(
		`${ BASE }/wp-admin/post.php?post=${ postId }&action=edit`
	);
	await pageB
		.getByRole( 'button', { name: /Close|Get started/i } )
		.first()
		.click( { timeout: 4000 } )
		.catch( () => {} );

	const errors = { A: [], B: [] };
	for ( const [ key, page ] of [
		[ 'A', pageA ],
		[ 'B', pageB ],
	] ) {
		page.on( 'pageerror', ( error ) =>
			errors[ key ].push( String( error ) )
		);
		page.on( 'console', ( message ) => {
			if ( 'error' === message.type() ) {
				errors[ key ].push( message.text() );
			}
		} );
	}
	await pageA.waitForTimeout( 5000 );

	const canvas = ( page ) =>
		page.frameLocator( 'iframe[name="editor-canvas"]' );
	const read = async ( page, label ) => {
		const blocks = await page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.map( ( block ) => ( {
					content: String( block.attributes.content ?? '' ),
					syncId: block.attributes.metadata?.syncId?.slice( 0, 8 ),
				} ) )
		);
		console.log( label, JSON.stringify( blocks ) );
		return blocks;
	};

	const typeTwoParagraphs = async () => {
		await canvas( pageA )
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageA.keyboard.type( 'HelloWorld' );
		await pageA.keyboard.press( 'Enter' );
		await pageA.keyboard.type( 'SecondBlock' );
	};

	const splitFirstParagraph = async () => {
		await canvas( pageA )
			.locator( '[data-type="core/paragraph"]' )
			.first()
			.click();
		await pageA.keyboard.press( 'End' );
		for ( let i = 0; i < 5; i++ ) {
			await pageA.keyboard.press( 'ArrowLeft' );
		}
		await pageA.keyboard.press( 'Enter' );
	};

	switch ( scenario ) {
		case 'split':
			await typeTwoParagraphs();
			await splitFirstParagraph();
			break;
		case 'split-settled':
			await typeTwoParagraphs();
			await pageA.waitForTimeout( 7000 );
			await read( pageA, 'A settled:' );
			await splitFirstParagraph();
			await canvas( pageB )
				.locator( '[data-type="core/paragraph"]' )
				.nth( 1 )
				.click();
			await pageB.keyboard.press( 'End' );
			await pageB.keyboard.type( '-B' );
			break;
		case 'empty-race':
			await canvas( pageA )
				.locator( 'role=button[name="Add default block"i]' )
				.click();
			await pageA.keyboard.type( 'From tab A' );
			await canvas( pageB )
				.locator( 'role=button[name="Add default block"i]' )
				.click();
			await pageB.keyboard.type( 'From tab B' );
			break;
		default:
			await typeTwoParagraphs();
	}

	await pageA.waitForTimeout( 10000 );
	await read( pageA, 'A final:' );
	await read( pageB, 'B final:' );
	console.log( 'A errors:', errors.A.length ? errors.A : 'none' );
	console.log( 'B errors:', errors.B.length ? errors.B : 'none' );
	await browser.close();
}

main();
