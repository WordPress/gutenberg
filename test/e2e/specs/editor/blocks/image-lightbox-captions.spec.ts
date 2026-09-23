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
		await expect( caption ).toBeInViewport( { ratio: 1 } );
		await expect( caption ).toHaveCSS( 'clip-path', 'none' );
		await expect( dialog.locator( '[aria-live]' ) ).toBeEmpty();
		expect( await dialog.ariaSnapshot() ).toContain( 'credit' );

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

	test( 'resets a returning caption after restoring its scrolling box', async ( {
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
		await caption.evaluate( ( element ) => {
			element.scrollTop = element.scrollHeight;
		} );
		await expect
			.poll( () => caption.evaluate( ( element ) => element.scrollTop ) )
			.toBeGreaterThan( 0 );
		await next.click();
		await expect( caption ).toBeHidden();

		// A hidden caption has no scrolling box, so its scrollTop setter can
		// silently ignore a reset even though its getter reports zero.
		await caption.evaluate( ( element ) => {
			const descriptor = Object.getOwnPropertyDescriptor(
				Element.prototype,
				'scrollTop'
			)!;
			Object.defineProperty( element, 'scrollTop', {
				configurable: true,
				get() {
					return descriptor.get!.call( this );
				},
				set( value ) {
					this.setAttribute(
						'data-reset-with-scrolling-box',
						String( this.getClientRects().length > 0 )
					);
					descriptor.set!.call( this, value );
				},
			} );
		} );
		await dialog
			.getByRole( 'button', { name: 'Previous', exact: true } )
			.click();
		await expect( caption ).toBeVisible();
		await expect( caption ).toHaveAttribute(
			'data-reset-with-scrolling-box',
			'true'
		);
		await expect
			.poll( () => caption.evaluate( ( element ) => element.scrollTop ) )
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
			await page.setViewportSize( viewport );
			const dialog = page.getByRole( 'dialog' );
			await dialog
				.getByRole( 'button', { name: 'Next', exact: true } )
				.click();
			const caption = dialog.locator( 'figcaption' );
			await expect( caption ).toBeInViewport( { ratio: 1 } );
			await expect( caption ).toHaveAttribute( 'tabindex', '0' );
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
			await dialog
				.getByRole( 'button', { name: 'Previous', exact: true } )
				.focus();
			await page.keyboard.press( 'Tab' );
			await expect( caption ).toBeFocused();
			await page.keyboard.press( 'End' );
			await expect
				.poll( () =>
					caption.evaluate( ( element ) => element.scrollTop )
				)
				.toBeGreaterThan( 0 );
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
					caption.evaluate( ( element ) => element.scrollTop )
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
	} );
} );
