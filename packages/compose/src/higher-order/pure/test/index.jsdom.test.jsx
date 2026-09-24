import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { logged } from '@wordpress/deprecated';
import pure from '../';

const DEPRECATION_MESSAGE =
	'wp.compose.pure is deprecated since version 7.1. Please use Use `memo` or `PureComponent` instead instead.';

describe( 'pure', () => {
	beforeEach( () => {
		delete logged[ DEPRECATION_MESSAGE ];
	} );

	afterEach( () => {
		delete logged[ DEPRECATION_MESSAGE ];
	} );

	it( 'wraps a component and logs a deprecation warning', () => {
		const MyComp = pure( () => <p data-testid="content">content</p> );

		render( <MyComp /> );

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'content'
		);
	} );
} );
