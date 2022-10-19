/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Truncate } from '..';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Truncate>Lorem ipsum.</Truncate> );
		expect( container.firstChild ).toHaveTextContent( 'Lorem ipsum.' );
	} );

	test( 'should render limit', () => {
		const { container } = render(
			<Truncate limit={ 1 } ellipsizeMode="tail">
				Lorem ipsum.
			</Truncate>
		);
		expect( container.firstChild ).toHaveTextContent( 'L…' );
	} );

	test( 'should render custom ellipsis', () => {
		const { container } = render(
			<Truncate ellipsis="!!!" limit={ 5 } ellipsizeMode="tail">
				Lorem ipsum.
			</Truncate>
		);
		expect( container.firstChild ).toHaveTextContent( 'Lorem!!!' );
	} );

	test( 'should render custom ellipsizeMode', () => {
		const { container } = render(
			<Truncate ellipsis="!!!" ellipsizeMode="middle" limit={ 5 }>
				Lorem ipsum.
			</Truncate>
		);
		expect( container.firstChild ).toHaveTextContent( 'Lo!!!m.' );
	} );
} );
