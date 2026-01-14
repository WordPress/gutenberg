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
import { Title } from '../index';

describe( 'EmptyState.Title', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLHeadingElement >();

		render( <Title ref={ ref }>No results found</Title> );

		expect( ref.current ).toBeInstanceOf( HTMLHeadingElement );
	} );
} );
