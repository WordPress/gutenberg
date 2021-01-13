/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import React from 'react';

/**
 * Internal dependencies
 */
import { Truncate } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Truncate>Some people are worth melting for.</Truncate>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render limit', () => {
		const { container } = render(
			<Truncate limit={ 5 }>Some people are worth melting for.</Truncate>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render custom ellipsis', () => {
		const { container } = render(
			<Truncate ellipsis="!!!" limit={ 5 }>
				Some people are worth melting for.
			</Truncate>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render custom ellipsizeMode', () => {
		const { container } = render(
			<Truncate ellipsis="!!!" ellipsizeMode="middle" limit={ 5 }>
				Some people are worth melting for.
			</Truncate>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render numberOfLines', () => {
		const { container } = render(
			<Truncate numberOfLines={ 3 }>
				Some people are worth melting for.
			</Truncate>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
