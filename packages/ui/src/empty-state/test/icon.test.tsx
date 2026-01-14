/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Icon } from '../index';

describe( 'EmptyState.Icon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Icon ref={ ref } icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
