import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Keeps server directive processing on, so the server renders each token's
 * HTML into its element, as a site does.
 *
 * @param link A fixture URL.
 * @return The URL without the parameter that disables the processing.
 */
const withServerProcessing = ( link: string ) => {
	const url = new URL( link );
	url.searchParams.delete( 'disable_server_directive_processing' );
	return url.href;
};

/** Test IDs of the elements whose content differs on each page. */
const changing = [ 'state-html', 'pending-html' ];

/** Test IDs of the elements whose content is the same on every page. */
const same = [ 'same-html', 'same-pending-html' ];

/**
 * Reads the content of the given elements.
 *
 * @param page    The page holding the elements.
 * @param testIds Test IDs of the elements.
 * @return The HTML of each element, in order.
 */
const contentOf = ( page: Page, testIds: string[] ) =>
	Promise.all(
		testIds.map( ( testId ) => page.getByTestId( testId ).innerHTML() )
	);

test.describe( 'Router server-rendered HTML content', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		for ( const name of [ 'history', 'trusted types' ] ) {
			const two = await utils.addPostWithBlock(
				'test/router-html-server',
				{ alias: `${ name } two`, attributes: { page: 'two' } }
			);
			await utils.addPostWithBlock( 'test/router-html-server', {
				alias: `${ name } one`,
				attributes: { page: 'one', next: withServerProcessing( two ) },
			} );
		}
		const syncTwo = await utils.addPostWithBlock(
			'test/router-html-server',
			{
				alias: 'sync two',
				attributes: { page: 'two' },
			}
		);
		await utils.addPostWithBlock( 'test/router-html-server', {
			alias: 'sync one',
			attributes: {
				page: 'one',
				next: withServerProcessing( syncTwo ),
				syncedNull: true,
			},
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'shows each page’s server-rendered content in the same elements, keeping equal content', async ( {
		page,
		interactivityUtils: utils,
		requestUtils,
	} ) => {
		await page.goto(
			withServerProcessing( utils.getLink( 'history one' ) )
		);
		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
		expect( await contentOf( page, [ ...changing, ...same ] ) ).toEqual( [
			'<p>One</p>',
			'<p>One</p>',
			'<p>Same</p>',
			'<p>Same</p>',
		] );
		// Records the elements and their content at each DOM update, and the
		// child list changes of the elements whose content is the same.
		const recording = await page.evaluateHandle(
			( [ changingIds, sameIds ] ) => {
				const byTestId = ( testId: string ) =>
					document.querySelector( `[data-testid="${ testId }"]` )!;
				const elements = [ ...changingIds, ...sameIds ].map( byTestId );
				const firstChildren = sameIds.map(
					( testId ) => byTestId( testId ).firstChild
				);
				const updates: string[][] = [];
				const sameChanges: number[] = sameIds.map( () => 0 );
				new MutationObserver( () =>
					updates.push( [
						byTestId( 'page-content' ).textContent!,
						...changingIds.map(
							( testId ) => byTestId( testId ).innerHTML
						),
					] )
				).observe( byTestId( 'page-content' ).parentElement!, {
					childList: true,
					subtree: true,
					characterData: true,
				} );
				sameIds.forEach( ( testId, index ) =>
					new MutationObserver( ( records ) => {
						sameChanges[ index ] += records.length;
					} ).observe( byTestId( testId ), {
						childList: true,
						subtree: true,
						characterData: true,
					} )
				);
				return {
					updates,
					sameChanges,
					/**
					 * Checks that every element is the one the page hydrated, and
					 * that the same content kept its first nodes.
					 *
					 * @return Whether the elements and those nodes are kept.
					 */
					isKept: () =>
						[ ...changingIds, ...sameIds ].every(
							( testId, index ) =>
								byTestId( testId ) === elements[ index ]
						) &&
						sameIds.every(
							( testId, index ) =>
								byTestId( testId ).firstChild ===
								firstChildren[ index ]
						),
				};
			},
			[ changing, same ]
		);
		const isKept = () =>
			recording.evaluate( ( { isKept: kept } ) => kept() );
		const pageContent = page.getByTestId( 'page-content' );

		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( pageContent ).toHaveText( 'content from two' );
		await expect
			.poll( () => contentOf( page, changing ) )
			.toEqual( [ '<p>Two</p>', '<p>Two</p>' ] );
		expect(
			await recording.evaluate( ( { updates } ) => updates )
		).not.toContainEqual(
			expect.arrayContaining( [ 'content from two', '<p>One</p>' ] )
		);

		for ( const [ move, name, html ] of [
			[ 'back', 'one', '<p>One</p>' ],
			[ 'forward', 'two', '<p>Two</p>' ],
			[ 'back', 'one', '<p>One</p>' ],
			[ 'forward', 'two', '<p>Two</p>' ],
		] ) {
			await ( move === 'back' ? page.goBack() : page.goForward() );
			await expect( pageContent ).toHaveText( `content from ${ name }` );
			await expect
				.poll( () => contentOf( page, changing ) )
				.toEqual( [ html, html ] );
		}

		// The server renders other content for the page shown.
		const shown = withServerProcessing( utils.getLink( 'history two' ) );
		const posts = await requestUtils.rest<
			Array< { id: number; link: string } >
		>( {
			path: '/wp/v2/posts',
			params: { per_page: 100, _fields: 'id,link' },
		} );
		const post = posts.find( ( { link } ) => link === shown )!;
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ post.id }`,
			data: {
				content:
					'<!-- wp:test/router-html-server {"page":"two","label":"three"} /-->',
			},
		} );
		await page.getByRole( 'button', { name: 'Refresh' } ).click();
		await expect
			.poll( () => contentOf( page, changing ) )
			.toEqual( [ '<p>Three</p>', '<p>Three</p>' ] );

		expect( await isKept() ).toBe( true );
		expect( await contentOf( page, same ) ).toEqual( [
			'<p>Same</p>',
			'<p>Same</p>',
		] );
		expect(
			await recording.evaluate( ( { sameChanges } ) => sameChanges )
		).toEqual( [ 0, 0 ] );
		await recording.dispose();
	} );

	test( 'shows the new page’s server-rendered content once a data-wp-watch callback syncs the value', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		// One element's state is copied from `getServerState()`, the other's
		// context from `getServerContext()` and read through a getter. Both are
		// null on page one.
		const synced = [ 'synced-state-html', 'synced-context-html' ];
		await page.goto( withServerProcessing( utils.getLink( 'sync one' ) ) );
		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
		expect( await contentOf( page, synced ) ).toEqual( [ '', '' ] );
		const elements = await page.evaluateHandle(
			( testIds ) =>
				testIds.map( ( testId ) =>
					document.querySelector( `[data-testid="${ testId }"]` )
				),
			synced
		);

		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from two'
		);
		await expect
			.poll( () => contentOf( page, synced ) )
			.toEqual( [ '<p>Two</p>', '<p>Two</p>' ] );

		expect(
			await elements.evaluate(
				( kept, testIds ) =>
					testIds.every(
						( testId, index ) =>
							document.querySelector(
								`[data-testid="${ testId }"]`
							) === kept[ index ]
					),
				synced
			)
		).toBe( true );
		await elements.dispose();
	} );

	test( 'shows the new page’s server-rendered content without a Trusted Types policy call', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors: Error[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		await page.addInitScript( () => {
			const tracked = window as typeof window & {
				policyCalls: string[];
				violations: string[];
				trustedTypes: {
					createPolicy: ( name: string, rules: object ) => unknown;
				};
			};
			tracked.policyCalls = [];
			tracked.violations = [];
			document.addEventListener( 'securitypolicyviolation', ( event ) =>
				tracked.violations.push( event.sample )
			);
			// Accepts whole documents, as the router parses, and nothing else.
			tracked.trustedTypes.createPolicy( 'default', {
				createHTML: ( html: string, type: string, sink: string ) => {
					tracked.policyCalls.push( sink );
					return html.startsWith( '<!DOCTYPE html>' ) ? html : null;
				},
			} );
		} );
		const url = new URL(
			withServerProcessing( utils.getLink( 'trusted types one' ) )
		);
		url.searchParams.set( 'require_trusted_types', 'true' );
		const response = await page.goto( url.href );
		expect( response?.headers()[ 'content-security-policy' ] ).toBe(
			"require-trusted-types-for 'script'"
		);
		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
		const readTracked = () =>
			page.evaluate( async () => {
				// Let queued violation events fire first.
				await new Promise( ( resolve ) =>
					requestAnimationFrame( () =>
						requestAnimationFrame( resolve )
					)
				);
				const tracked = window as typeof window & {
					policyCalls: string[];
					violations: string[];
				};
				return {
					policyCalls: tracked.policyCalls.splice( 0 ),
					violations: tracked.violations.splice( 0 ),
				};
			} );
		// Only the navigation is checked: at load, WordPress's emoji loader
		// starts a worker from a blob URL, which this policy doesn't allow.
		await readTracked();

		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from two'
		);
		await expect
			.poll( () => contentOf( page, changing ) )
			.toEqual( [ '<p>Two</p>', '<p>Two</p>' ] );

		expect( await readTracked() ).toEqual( {
			policyCalls: [ 'DOMParser parseFromString' ],
			violations: [],
		} );
		expect( pageErrors ).toEqual( [] );
	} );
} );
