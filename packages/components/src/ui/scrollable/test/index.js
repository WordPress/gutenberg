/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Scrollable } from '../index';

describe( 'props', () => {
	let base;

	beforeEach( () => {
		( { container: base } = render(
			<Scrollable>WordPress.org - Code is Poetry</Scrollable>
		) );
	} );
	test( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	test( 'should render smoothScroll', () => {
		const { container } = render(
			<Scrollable smoothScroll>WordPress.org - Code is Poetry</Scrollable>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );
} );
