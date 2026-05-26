/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { logged } from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import pure from '../';

describe( 'pure', () => {
	afterEach( () => {
		for ( const key in logged ) {
			delete logged[ key ];
		}
	} );

	it( 'wraps a component and logs a deprecation warning', () => {
		const MyComp = pure( () => <p data-testid="content">content</p> );

		render( <MyComp /> );

		expect( console ).toHaveWarnedWith(
			'wp.compose.pure is deprecated since version 7.1. Please use Use `memo` or `PureComponent` instead instead.'
		);
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'content'
		);
	} );
} );
