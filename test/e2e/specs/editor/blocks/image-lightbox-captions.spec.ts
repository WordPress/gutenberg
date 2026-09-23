import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Image lightbox captions @webkit @firefox', () => {
	let media: { id: number; source_url: string };
	let postId: number;

	test.beforeAll( async ( { requestUtils } ) => {
		media = await requestUtils.uploadMedia(
			'./assets/1024x768_e2e_test_image.png'
		);
		const captions = [
			'First <strong>rich &amp; safe</strong> <a href="#caption-credit">credit</a> &lt;caption&gt;',
			`${ 'Long caption with <em>formatting</em>.<br>'.repeat( 40 ) }<a href="#caption-end">Last credit</a>`,
			'',
		];
		const images = captions.map( ( caption, index ) => {
			const alt = [ 'First landscape', '', 'Uncaptioned landscape' ][
				index
			];
			const img = `<img src="${ media.source_url }" alt="${ alt }" class="wp-image-${ media.id }"/>`;
			return `<!-- wp:image {"id":${ media.id },"lightbox":{"enabled":true}} -->
				<figure class="wp-block-image">${
					index === 0
						? `<picture style="display:contents">${ img }</picture>`
						: img
				}${ caption ? `<figcaption class="wp-element-caption">${ caption }</figcaption>` : '' }</figure>
				<!-- /wp:image -->`;
		} );
		const post = await requestUtils.createPost( {
			status: 'publish',
			date_gmt: '2026-01-01T00:00:00',
			content: `<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped">${ images.join( '' ) }</figure><!-- /wp:gallery -->`,
		} );
		postId = post.id;
	} );

	test.beforeEach( async ( { page } ) => {
		await page.goto( `/?p=${ postId }` );
		await page
			.getByRole( 'button', { name: 'Enlarge 1 of 3', exact: true } )
			.click();
		await expect( page.getByRole( 'dialog' ) ).toBeVisible();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteMedia( media.id );
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/posts/${ postId }`,
			params: { force: true },
		} );
	} );

	test( 'keeps touch Enlarge buttons visible without hover or keyboard focus', async ( {
		page,
		browser,
	} ) => {
		const touchContext = await browser.newContext( {
			hasTouch: true,
			viewport: { width: 390, height: 844 },
		} );
		try {
			const touchPage = await touchContext.newPage();
			await touchPage.goto( page.url() );
			const triggers = touchPage.getByRole( 'button', {
				name: /^Enlarge [1-3] of 3$/,
			} );
			await expect( triggers ).toHaveCount( 3 );
			for ( const trigger of await triggers.all() ) {
				await expect( trigger ).not.toBeFocused();
				expect(
					await trigger.evaluate( ( element ) =>
						element.parentElement!.matches(
							':hover, :focus-within'
						)
					)
				).toBe( false );
				await expect( trigger ).toHaveCSS( 'opacity', '1' );
			}
			await touchPage
				.getByRole( 'button', { name: 'Enlarge 2 of 3', exact: true } )
				.tap();
			const dialog = touchPage.getByRole( 'dialog' );
			await expect( dialog ).toBeVisible();
			await expect( dialog.locator( 'figcaption' ) ).toContainText(
				'Long caption'
			);
		} finally {
			await touchContext.close();
		}
	} );

	test( 'reveals Enlarge buttons on hover or keyboard focus with a mouse', async ( {
		page,
	} ) => {
		await page.mouse.move( 0, 0 );
		await page.goto( `/?p=${ postId }` );
		const trigger = page.getByRole( 'button', {
			name: 'Enlarge 3 of 3',
			exact: true,
		} );
		await expect( trigger ).not.toBeFocused();
		await expect( trigger ).toHaveCSS( 'opacity', '0' );
		await page
			.locator( '.wp-lightbox-container' )
			.nth( 2 )
			.locator( 'img' )
			.hover();
		await expect( trigger ).toHaveCSS( 'opacity', '1' );
		await page.mouse.move( 0, 0 );
		await expect( trigger ).toHaveCSS( 'opacity', '0' );
		await trigger.focus();
		await expect( trigger ).toHaveCSS( 'opacity', '1' );
	} );

	test( 'preserves a visible rich caption and exposes only the enlarged image', async ( {
		page,
	} ) => {
		const dialog = page.getByRole( 'dialog' );
		const caption = dialog.locator( 'figcaption' );
		await expect( dialog.getByRole( 'figure' ) ).toHaveCount( 1 );
		await expect( dialog.getByRole( 'img' ) ).toHaveCount( 1 );
		await expect( dialog.getByRole( 'img' ) ).toHaveAttribute(
			'alt',
			'First landscape'
		);
		await expect(
			dialog.locator( '.lightbox-image-container' ).first()
		).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( caption ).toHaveText(
			'First rich & safe credit <caption>'
		);
		await expect( caption.locator( 'strong' ) ).toHaveText( 'rich & safe' );
		await expect( caption ).not.toHaveAttribute( 'data-wp-on--click' );
		await expect( caption ).toBeInViewport( { ratio: 1 } );
		await expect( caption ).toHaveCSS( 'clip-path', 'none' );
		await expect( dialog.locator( '[aria-live]' ) ).toBeEmpty();
		expect( await dialog.ariaSnapshot() ).toContain( 'credit' );
		await caption.locator( 'strong' ).click();
		await expect( dialog ).toBeVisible();
		await caption.click( { position: { x: 1, y: 1 } } );
		await expect( dialog ).toBeVisible();

		const credit = caption.getByRole( 'link', {
			name: 'credit',
			exact: true,
		} );
		await credit.click();
		await expect( page ).toHaveURL( /#caption-credit$/ );
		await expect( dialog ).toBeVisible();
		await credit.press( 'ArrowRight' );
		await expect( caption ).toContainText( 'First rich' );
		await credit.press( 'Tab' );
		await expect(
			dialog.getByRole( 'button', { name: 'Next', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Tab' );
		await expect(
			dialog.getByRole( 'button', { name: 'Close', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect(
			dialog.getByRole( 'button', { name: 'Next', exact: true } )
		).toBeFocused();
	} );

	test( 'still closes from the enlarged image, backdrop, and Close button', async ( {
		page,
	} ) => {
		const dialog = page.getByRole( 'dialog' );
		for ( const target of [
			dialog.getByRole( 'img' ),
			dialog.locator( '.scrim' ),
			dialog.getByRole( 'button', { name: 'Close', exact: true } ),
		] ) {
			await target.click( { position: { x: 1, y: 1 } } );
			await expect( dialog ).toBeHidden();
			await page
				.getByRole( 'button', { name: 'Enlarge 1 of 3', exact: true } )
				.click();
			await expect( dialog ).toBeVisible();
		}
	} );

	test( 'updates and clears captions on navigation and reopening', async ( {
		page,
	} ) => {
		const dialog = page.getByRole( 'dialog' );
		const caption = dialog.locator( 'figcaption' );
		await dialog
			.getByRole( 'button', { name: 'Next', exact: true } )
			.click();
		await expect( caption ).toContainText( 'Long caption' );
		await expect(
			dialog
				.locator( '.lightbox-image-container' )
				.last()
				.locator( 'img' )
		).toHaveAttribute( 'alt', '' );
		await expect( dialog.locator( '[aria-live]' ) ).toHaveText(
			'Enlarged image 2 of 3'
		);
		await dialog
			.getByRole( 'button', { name: 'Next', exact: true } )
			.click();
		await expect( caption ).toBeHidden();
		await expect( caption ).toBeEmpty();
		expect( await dialog.ariaSnapshot() ).not.toContain( 'Last credit' );
		await dialog
			.getByRole( 'button', { name: 'Previous', exact: true } )
			.click();
		await expect( caption ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( dialog ).toBeHidden();
		await page
			.getByRole( 'button', { name: 'Enlarge 1 of 3', exact: true } )
			.click();
		await expect( caption ).toHaveText(
			'First rich & safe credit <caption>'
		);
		await expect( dialog.locator( '[aria-live]' ) ).toBeEmpty();
	} );

	test( 'resets the dialog scroll position on navigation and reopening', async ( {
		page,
	} ) => {
		const dialog = page.getByRole( 'dialog' );
		const caption = dialog.locator( 'figcaption' );
		const next = dialog.getByRole( 'button', {
			name: 'Next',
			exact: true,
		} );
		await next.click();
		await expect( caption ).toContainText( 'Long caption' );
		await dialog.evaluate( ( element ) => {
			element.scrollTop = element.scrollHeight;
		} );
		await expect
			.poll( () => dialog.evaluate( ( element ) => element.scrollTop ) )
			.toBeGreaterThan( 0 );
		await next.click();
		await expect( caption ).toBeHidden();
		await expect
			.poll( () => dialog.evaluate( ( element ) => element.scrollTop ) )
			.toBe( 0 );
		await dialog
			.getByRole( 'button', { name: 'Previous', exact: true } )
			.click();
		await expect( caption ).toBeVisible();
		await expect
			.poll( () => dialog.evaluate( ( element ) => element.scrollTop ) )
			.toBe( 0 );
		await dialog.evaluate( ( element ) => {
			element.scrollTop = element.scrollHeight;
		} );
		await page.keyboard.press( 'Escape' );
		await expect( dialog ).toBeHidden();
		await page
			.getByRole( 'button', { name: 'Enlarge 2 of 3', exact: true } )
			.click();
		await expect( caption ).toContainText( 'Long caption' );
		await expect
			.poll( () => dialog.evaluate( ( element ) => element.scrollTop ) )
			.toBe( 0 );
	} );

	test( 'traps focus on a standalone image without hidden navigation buttons', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			status: 'publish',
			date_gmt: '2026-01-01T00:00:00',
			content: `<!-- wp:image {"id":${ media.id },"lightbox":{"enabled":true}} --><figure class="wp-block-image"><img src="${ media.source_url }" alt="Standalone landscape" class="wp-image-${ media.id }"/><figcaption><a href="#credit">Standalone credit</a></figcaption></figure><!-- /wp:image -->`,
		} );
		await page.goto( `/?p=${ post.id }` );
		const trigger = page.getByRole( 'button', {
			name: 'Enlarge',
			exact: true,
		} );
		await trigger.click();
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toBeFocused();
		await expect( dialog.getByRole( 'button' ) ).toHaveCount( 1 );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( dialog.getByRole( 'link' ) ).toBeFocused();
		await page.keyboard.press( 'Tab' );
		await expect(
			dialog.getByRole( 'button', { name: 'Close', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Tab' );
		await expect( dialog.getByRole( 'link' ) ).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect( trigger ).toBeFocused();
	} );

	for ( const viewport of [
		{ width: 1280, height: 800 },
		{ width: 390, height: 844 },
		{ width: 844, height: 390 },
		{ width: 320, height: 256 },
	] ) {
		test( `keeps a long caption readable at ${ viewport.width }x${ viewport.height }`, async ( {
			page,
		} ) => {
			await page.emulateMedia( { reducedMotion: 'reduce' } );
			await page.setViewportSize( viewport );
			const dialog = page.getByRole( 'dialog' );
			await dialog
				.getByRole( 'button', { name: 'Next', exact: true } )
				.click();
			const caption = dialog.locator( 'figcaption' );
			await expect( caption ).toBeInViewport();
			await expect( caption ).not.toHaveAttribute( 'tabindex' );
			await expect( caption ).toHaveCSS( 'overflow-y', 'visible' );
			await expect( caption ).toHaveCSS( 'transform', 'none' );
			await expect(
				dialog.getByRole( 'button', { name: 'Close', exact: true } )
			).toBeInViewport( { ratio: 1 } );
			const imageBounds = await dialog
				.locator( '.lightbox-image-container' )
				.last()
				.boundingBox();
			const captionBounds = await caption.boundingBox();
			expect( imageBounds!.height ).toBeGreaterThan( 0 );
			expect( captionBounds!.y ).toBeGreaterThanOrEqual(
				imageBounds!.y + imageBounds!.height
			);
			const pageScroll = await page.evaluate( () => window.scrollY );
			await dialog
				.getByRole( 'button', { name: 'Next', exact: true } )
				.focus();
			await page.keyboard.press( 'Tab' );
			await expect( dialog ).toBeFocused();
			await page.keyboard.press( 'End' );
			await expect
				.poll( () =>
					dialog.evaluate( ( element ) => element.scrollTop )
				)
				.toBeGreaterThan( 0 );
			for ( const name of [ 'Close', 'Previous', 'Next' ] ) {
				const button = dialog.getByRole( 'button', {
					name,
					exact: true,
				} );
				await expect( button ).toBeInViewport( { ratio: 1 } );
				const buttonBounds = await button.boundingBox();
				expect(
					buttonBounds!.x + buttonBounds!.width <= captionBounds!.x ||
						buttonBounds!.x >=
							captionBounds!.x + captionBounds!.width
				).toBe( true );
			}
			expect(
				await caption.evaluate( ( element ) => element.scrollTop )
			).toBe( 0 );
			expect( await page.evaluate( () => window.scrollY ) ).toBe(
				pageScroll
			);
			await page.keyboard.press( 'Home' );
			await expect
				.poll( () =>
					dialog.evaluate( ( element ) => element.scrollTop )
				)
				.toBe( 0 );
			await dialog
				.getByRole( 'button', { name: 'Previous', exact: true } )
				.focus();
			await page.keyboard.press( 'Tab' );
			await expect(
				caption.getByRole( 'link', { name: 'Last credit' } )
			).toBeFocused();
			await expect(
				caption.getByRole( 'link', { name: 'Last credit' } )
			).toBeInViewport( { ratio: 1 } );
			await dialog
				.getByRole( 'button', { name: 'Previous', exact: true } )
				.click();
			await dialog
				.getByRole( 'button', { name: 'Next', exact: true } )
				.click();
			await expect
				.poll( () =>
					dialog.evaluate( ( element ) => element.scrollTop )
				)
				.toBe( 0 );
		} );
	}

	test( 'does not cancel caption touch scrolling or interpret it as gallery navigation', async ( {
		page,
	} ) => {
		const dialog = page.getByRole( 'dialog' );
		await dialog
			.getByRole( 'button', { name: 'Next', exact: true } )
			.click();
		const caption = dialog.locator( 'figcaption' );
		// Desktop Firefox has no Touch constructor. Supply the event properties
		// consumed by the handlers; real touch scrolling needs device testing.
		await caption.evaluate( ( element ) => {
			element.dispatchEvent(
				Object.assign( new Event( 'touchstart', { bubbles: true } ), {
					touches: [ { clientX: 200, clientY: 100 } ],
				} )
			);
		} );
		const prevented = await caption.evaluate( ( element ) => {
			const event = new Event( 'touchmove', {
				bubbles: true,
				cancelable: true,
			} );
			element.dispatchEvent( event );
			return event.defaultPrevented;
		} );
		expect( prevented ).toBe( false );
		await caption.evaluate( ( element ) => {
			element.dispatchEvent(
				Object.assign(
					new Event( 'touchend', {
						bubbles: true,
						cancelable: true,
					} ),
					{ changedTouches: [ { clientX: 20, clientY: 100 } ] }
				)
			);
		} );
		await expect( caption ).toContainText( 'Long caption' );
		const image = dialog
			.locator( '.lightbox-image-container' )
			.last()
			.locator( 'img' );
		const imageScrollPrevented = await image.evaluate( ( element ) => {
			element.dispatchEvent(
				Object.assign( new Event( 'touchstart', { bubbles: true } ), {
					touches: [ { clientX: 200, clientY: 300 } ],
				} )
			);
			const move = new Event( 'touchmove', {
				bubbles: true,
				cancelable: true,
			} );
			element.dispatchEvent( move );
			element.dispatchEvent(
				Object.assign(
					new Event( 'touchend', {
						bubbles: true,
						cancelable: true,
					} ),
					{ changedTouches: [ { clientX: 190, clientY: 100 } ] }
				)
			);
			return move.defaultPrevented;
		} );
		expect( imageScrollPrevented ).toBe( false );
		await expect( caption ).toContainText( 'Long caption' );
	} );
} );
