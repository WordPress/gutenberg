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
import { Description } from '../index';

describe( 'EmptyState.Description', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLParagraphElement >();

		render( <Description ref={ ref }>Description text</Description> );

		expect( ref.current ).toBeInstanceOf( HTMLParagraphElement );
	} );
} );
