/**
 * External dependencies
 */
import { expect, test } from '@playwright/test';

/**
 * Internal dependencies
 */
import { gotoStoryId } from '../utils';

test.describe( 'Development Storybook', () => {
	test( 'renders the Button story without browser errors', async ( {
		page,
	} ) => {
		const browserErrors: string[] = [];

		page.on( 'console', ( message ) => {
			if ( message.type() === 'error' ) {
				browserErrors.push( message.text() );
			}
		} );
		page.on( 'pageerror', ( error ) => {
			browserErrors.push( error.message );
		} );

		await gotoStoryId( page, 'components-button--variant-states' );
		await expect(
			page.getByRole( 'button', { name: 'Code is poetry' } ).first()
		).toBeVisible();

		expect( browserErrors ).toEqual( [] );
	} );
} );
