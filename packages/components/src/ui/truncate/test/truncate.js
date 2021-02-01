/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Truncate from '../truncate';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Truncate>Some people are worth melting for.</Truncate>
		);
		expect( container.firstChild.textContent ).toEqual(
			'Some people are worth melting for.'
		);
	} );

	test( 'should render limit', () => {
		const { container } = render(
			<Truncate limit={ 1 } ellipsizeMode="tail">
				Some
			</Truncate>
		);
		expect( container.firstChild.textContent ).toEqual( 'S…' );
	} );

	test( 'should render custom ellipsis', () => {
		const { container } = render(
			<Truncate ellipsis="!!!" limit={ 5 } ellipsizeMode="tail">
				Some people are worth melting for.
			</Truncate>
		);
		expect( container.firstChild.textContent ).toEqual( 'Some !!!' );
	} );

	test( 'should render custom ellipsizeMode', () => {
		const { container } = render(
			<Truncate ellipsis="!!!" ellipsizeMode="middle" limit={ 5 }>
				Some people are worth melting for.
			</Truncate>
		);
		expect( container.firstChild.textContent ).toEqual( 'So!!!r.' );
	} );
} );
