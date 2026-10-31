import { test, expect } from './fixtures';

test.describe( 'Router HTML content', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		for ( const value of [ 'T', 'U', 'null', 'pending' ] ) {
			const next = await utils.addPostWithBlock( 'test/router-html', {
				alias: `kept ${ value } two`,
				attributes: { page: 'two', value },
			} );
			await utils.addPostWithBlock( 'test/router-html', {
				alias: `kept ${ value } one`,
				attributes: { page: 'one', value: 'T', next },
			} );
		}
		const fallbackDestination = await utils.addPostWithBlock(
			'test/router-html',
			{
				alias: 'fallback destination',
				attributes: { page: 'two', value: 'pending' },
			}
		);
		await utils.addPostWithBlock( 'test/router-html', {
			alias: 'fallback source',
			attributes: {
				page: 'one',
				value: 'T',
				next: fallbackDestination,
			},
		} );

		const mediaDestination = await utils.addPostWithBlock(
			'test/router-html',
			{
				alias: 'fallback media destination',
				attributes: {
					page: 'two',
					value: 'representation',
					resource: 'load',
				},
			}
		);
		await utils.addPostWithBlock( 'test/router-html', {
			alias: 'fallback media source',
			attributes: {
				page: 'one',
				value: 'T',
				next: mediaDestination,
				prefetch: true,
			},
		} );

		const prefetchDestination = await utils.addPostWithBlock(
			'test/router-html',
			{
				alias: 'fallback prefetch destination',
				attributes: {
					page: 'two',
					value: 'representation',
					resource: 'prefetch',
				},
			}
		);
		await utils.addPostWithBlock( 'test/router-html', {
			alias: 'fallback prefetch source',
			attributes: {
				page: 'one',
				value: 'T',
				next: prefetchDestination,
				prefetch: true,
			},
		} );

		const documentPageThree = await utils.addPostWithBlock(
			'test/router-html',
			{
				alias: 'fallback document three',
				attributes: { page: 'three', value: 'representation' },
			}
		);
		const documentPageTwo = await utils.addPostWithBlock(
			'test/router-html',
			{
				alias: 'fallback document two',
				attributes: {
					page: 'two',
					value: 'representation',
					next: documentPageThree,
				},
			}
		);
		await utils.addPostWithBlock( 'test/router-html', {
			alias: 'fallback document one',
			attributes: {
				page: 'one',
				value: 'representation',
				next: documentPageTwo,
			},
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	for ( const [ value, html ] of [
		[ 'T', '<p>T</p>' ],
		[ 'U', '<p>U</p>' ],
		[ 'null', '' ],
		[ 'pending', '<p>T</p>' ],
	] ) {
		test( `keeps node identity and follows the ${ value } destination without its fallback`, async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( `kept ${ value } one` ) );
			const kept = page.getByTestId( 'kept-html' );
			const never = page.getByTestId( 'never-html' );
			await expect.poll( () => kept.innerHTML() ).toBe( '<p>T</p>' );
			await expect.poll( () => never.innerHTML() ).toBe( '' );
			await expect( page.getByTestId( 'value' ) ).toHaveText( 'T' );
			const originalKept = await kept.evaluateHandle( ( el ) => el );
			// Observe content at each native DOM mutation, not merely at paint.
			const contents = await kept.evaluateHandle( ( el ) => {
				const seen = [ el.innerHTML ];
				const descriptor = Object.getOwnPropertyDescriptor(
					Element.prototype,
					'innerHTML'
				)!;
				Object.defineProperty( el, 'innerHTML', {
					configurable: true,
					get: () => descriptor.get!.call( el ),
					set: ( markup: string ) => {
						descriptor.set!.call( el, markup );
						seen.push( el.innerHTML );
					},
				} );
				new MutationObserver( () => seen.push( el.innerHTML ) ).observe(
					el,
					{ childList: true, subtree: true, characterData: true }
				);
				return seen;
			} );
			await page
				.getByRole( 'link', { name: 'Next', exact: true } )
				.click();
			await expect( page.getByTestId( 'page-content' ) ).toHaveText(
				'content from two'
			);
			await expect( page.getByTestId( 'value' ) ).toHaveText( value );
			await expect.poll( () => kept.innerHTML() ).toBe( html );
			await expect.poll( () => never.innerHTML() ).toBe( '' );
			expect(
				await kept.evaluate(
					( el, original ) => el === original,
					originalKept
				)
			).toBe( true );
			expect( await contents.jsonValue() ).toEqual(
				value === 'pending' ? [ '<p>T</p>' ] : expect.any( Array )
			);
			if ( value === 'null' || value === 'pending' ) {
				await page
					.getByRole( 'button', { name: 'Resolve HTML' } )
					.click();
			}
			await expect
				.poll( () => kept.innerHTML() )
				.toBe(
					value === 'null' || value === 'pending' ? '<p>U</p>' : html
				);
			expect(
				await kept.evaluate(
					( el, original ) => el === original,
					originalKept
				)
			).toBe( true );
			expect( await contents.jsonValue() ).not.toContain( '<i>two</i>' );
			await contents.dispose();
			await originalKept.dispose();
		} );
	}

	test( 'shows a script-free fallback every time navigation creates the element', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors: Error[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		await page.goto( utils.getLink( 'fallback source' ) );
		const nextLink = page.getByRole( 'link', {
			name: 'Next',
			exact: true,
		} );
		await nextLink.click();
		const fallback = page.getByTestId( 'added-html' );
		await expect
			.poll( () => fallback.innerHTML() )
			.toBe( '<p>B fallback</p>' );
		expect(
			await page.evaluate(
				() =>
					( window as typeof window & { fallbackRuns?: number } )
						.fallbackRuns
			)
		).toBeUndefined();

		await page.goBack();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from one'
		);
		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect
			.poll( () => fallback.innerHTML() )
			.toBe( '<p>B fallback</p>' );
		expect(
			await page.evaluate(
				() =>
					( window as typeof window & { fallbackRuns?: number } )
						.fallbackRuns
			)
		).toBeUndefined();
		expect( pageErrors ).toEqual( [] );
	} );

	test( 'requests hydrated fallback media once', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors: Error[] = [];
		const mediaUrl = new URL(
			'/wp-content/uploads/router-html-load.mp4',
			utils.getLink( 'fallback media destination' )
		).href;
		const mediaRequests: string[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		page.on( 'request', ( request ) => {
			if ( request.url() === mediaUrl ) {
				mediaRequests.push( request.url() );
			}
		} );
		await page.route( mediaUrl, ( route ) =>
			route.fulfill( {
				status: 200,
				contentType: 'video/mp4',
				headers: { 'Cache-Control': 'no-store' },
				body: '',
			} )
		);

		await page.goto( utils.getLink( 'fallback media destination' ) );
		await expect(
			page.getByTestId( 'fallback-media' ).locator( 'video' )
		).toHaveAttribute( 'src', mediaUrl );
		await expect.poll( () => mediaRequests.length ).toBe( 1 );
		expect( pageErrors ).toEqual( [] );
	} );

	test( 'does not request fallback media while prefetching a page', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors: Error[] = [];
		const destinationUrl = utils.getLink( 'fallback prefetch destination' );
		const destinationPath = new URL( destinationUrl ).pathname;
		const mediaUrl = new URL(
			'/wp-content/uploads/router-html-prefetch.mp4',
			destinationUrl
		).href;
		const mediaRequests: string[] = [];
		let releaseDestination!: () => void;
		const destinationGate = new Promise< void >( ( resolve ) => {
			releaseDestination = resolve;
		} );
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		page.on( 'request', ( request ) => {
			if ( request.url() === mediaUrl ) {
				mediaRequests.push( request.url() );
			}
		} );
		await page.route( mediaUrl, ( route ) =>
			route.fulfill( {
				status: 200,
				contentType: 'video/mp4',
				headers: { 'Cache-Control': 'no-store' },
				body: '',
			} )
		);
		await page.route(
			( url ) => url.pathname === destinationPath,
			async ( route ) => {
				await destinationGate;
				await route.continue();
			}
		);
		const destinationRequest = page.waitForRequest(
			( request ) => new URL( request.url() ).pathname === destinationPath
		);

		await page.goto( utils.getLink( 'fallback prefetch source' ) );
		await page.getByTestId( 'prefetch-next' ).click();
		await destinationRequest;
		await expect( page.getByTestId( 'prefetching' ) ).toHaveText( 'true' );
		releaseDestination();
		await expect( page.getByTestId( 'prefetching' ) ).toHaveText( 'false' );

		expect( mediaRequests ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
	} );

	test( 'does not keep documents from pages with HTML fallbacks alive', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors: Error[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		await page.goto( utils.getLink( 'fallback document one' ) );
		await expect( page.getByTestId( 'value' ) ).toHaveText(
			'representation'
		);

		const cdpSession = await page.context().newCDPSession( page );
		await cdpSession.send( 'HeapProfiler.enable' );
		/**
		 * Forces collection and counts live HTMLDocument wrappers in the page's
		 * JavaScript heap through the Chromium DevTools Protocol.
		 *
		 * @return The number of reachable HTMLDocument objects.
		 */
		const countHtmlDocuments = async (): Promise< number > => {
			await cdpSession.send( 'HeapProfiler.collectGarbage' );
			const prototype = await cdpSession.send( 'Runtime.evaluate', {
				expression: 'HTMLDocument.prototype',
			} );
			const documents = await cdpSession.send( 'Runtime.queryObjects', {
				prototypeObjectId: prototype.result.objectId!,
			} );
			const count = await cdpSession.send( 'Runtime.callFunctionOn', {
				objectId: documents.objects.objectId!,
				functionDeclaration: 'function() { return this.length; }',
				returnByValue: true,
			} );
			await cdpSession.send( 'Runtime.releaseObject', {
				objectId: prototype.result.objectId!,
			} );
			await cdpSession.send( 'Runtime.releaseObject', {
				objectId: documents.objects.objectId!,
			} );
			return count.result.value;
		};

		const documentsBefore = await countHtmlDocuments();
		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from two'
		);
		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from three'
		);
		await page.goBack();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from two'
		);
		const documentsAfter = await countHtmlDocuments();

		expect( documentsAfter ).toBe( documentsBefore );
		expect( pageErrors ).toEqual( [] );
		await cdpSession.detach();
	} );
} );
