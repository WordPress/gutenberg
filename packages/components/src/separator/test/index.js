/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Separator } from '../index';

describe( 'props', () => {
	let base;

	beforeEach( () => {
		base = render( <Separator /> ).container;
	} );

	test( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	test( 'should render marginTop', () => {
		const { container } = render( <Separator marginTop={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render marginBottom', () => {
		const { container } = render( <Separator marginBottom={ 5 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );

	test( 'should render margin', () => {
		const { container } = render( <Separator margin={ 7 } /> );
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.firstChild
		);
	} );
} );
