/**
 * External dependencies
 */
import { test, expect } from '@playwright/experimental-ct-react';

/**
 * Internal dependencies
 */
import Button from '../index';

test( 'should work', async ( { mount } ) => {
	const component = await mount( <Button>Button</Button> );

	await expect( component ).toHaveText( 'Button' );
} );
