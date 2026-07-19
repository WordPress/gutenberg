/**
 * External dependencies
 */
import { expect, test } from '@playwright/test';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

test.describe( 'NavigationMenu', () => {
	test( 'lays out flyout links as full-width rows', async ( { page } ) => {
		await gotoStoryId(
			page,
			'design-system-components-navigationmenu--flyout-navigation'
		);

		await page.getByRole( 'button', { name: 'Appearance' } ).click();

		const linkBoxes = await Promise.all(
			[ 'Themes', 'Patterns', 'WordPress.org' ].map( async ( name ) =>
				page
					.getByRole( 'link', { name: new RegExp( name ) } )
					.boundingBox()
			)
		);

		for ( const box of linkBoxes ) {
			expect( box ).not.toBeNull();
			expect( box?.width ).toBeGreaterThanOrEqual( 160 );
		}

		const widths = linkBoxes.map( ( box ) => box?.width ?? 0 );
		expect( Math.max( ...widths ) - Math.min( ...widths ) ).toBeLessThan(
			1
		);
	} );

	test( 'uses symmetric inline spacing for top-level links', async ( {
		page,
	} ) => {
		await gotoStoryId(
			page,
			'design-system-components-navigationmenu--flat-navigation'
		);

		const postsLink = page.getByRole( 'link', { name: 'Posts' } );
		const dimensions = await postsLink.evaluate( ( link ) => {
			const content = link.firstElementChild;
			if ( ! content ) {
				return null;
			}

			const linkRect = link.getBoundingClientRect();
			const contentRect = content.getBoundingClientRect();

			return {
				height: linkRect.height,
				leftInset: contentRect.left - linkRect.left,
				rightInset: linkRect.right - contentRect.right,
				width: linkRect.width,
			};
		} );

		expect( dimensions ).not.toBeNull();
		expect( dimensions?.width ).toBeGreaterThanOrEqual( 44 );
		expect( dimensions?.height ).toBeGreaterThanOrEqual( 44 );
		expect(
			Math.abs(
				( dimensions?.leftInset ?? 0 ) - ( dimensions?.rightInset ?? 0 )
			)
		).toBeLessThan( 1 );
	} );

	test( 'keeps the flyout open while moving from its trigger to its popup', async ( {
		page,
	} ) => {
		await gotoStoryId(
			page,
			'design-system-components-navigationmenu--flyout-navigation'
		);

		const trigger = page.getByRole( 'button', { name: 'Appearance' } );
		await trigger.hover();

		const popupLink = page.getByRole( 'link', { name: /Themes/ } );
		await popupLink.hover();

		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	} );

	test( 'starts the controlled example closed and closes demo hash links', async ( {
		page,
	} ) => {
		await gotoStoryId(
			page,
			'design-system-components-navigationmenu--controlled-root'
		);

		const trigger = page.getByRole( 'button', { name: 'Appearance' } );
		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

		await trigger.click();
		await page.getByRole( 'link', { name: /Themes/ } ).click();

		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	test( 'settles switched flyout content without a residual translation', async ( {
		page,
	} ) => {
		await gotoStoryId(
			page,
			'design-system-components-navigationmenu--switching-flyouts'
		);

		await page.getByRole( 'button', { name: 'Appearance' } ).click();
		await page.getByRole( 'button', { name: 'Help' } ).hover();
		await expect(
			page.getByRole( 'link', { name: 'Documentation' } )
		).toBeVisible();

		const content = page
			.getByRole( 'link', { name: 'Documentation' } )
			.locator( 'xpath=ancestor::*[@data-activation-direction][1]' );
		await expect( content ).toHaveCSS( 'translate', '0px' );

		const popupTransitionProperty = await content.evaluate( ( element ) => {
			const popup = element.parentElement?.parentElement;
			return popup ? getComputedStyle( popup ).transitionProperty : '';
		} );

		expect( popupTransitionProperty ).toContain( 'width' );
		expect( popupTransitionProperty ).toContain( 'height' );
	} );

	test( 'keeps tall flyout content reachable within the viewport', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 600, height: 320 } );
		await gotoStoryId(
			page,
			'design-system-components-navigationmenu--tall-flyout-content'
		);

		await page.getByRole( 'button', { name: 'Destinations' } ).click();

		const lastLink = page.getByRole( 'link', { name: 'Destination 20' } );
		await lastLink.scrollIntoViewIfNeeded();
		await expect( lastLink ).toBeInViewport();
	} );
} );
