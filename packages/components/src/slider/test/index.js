/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Slider } from '..';

describe( 'Slider', () => {
	let base;

	beforeEach( () => {
		( { container: base } = render( <Slider /> ) );
	} );

	it( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	it( 'should render valuetext for united values', () => {
		const { container } = render( <Slider defaultValue="50px" /> );
		expect( container.firstChild ).toMatchDiffSnapshot( base.firstChild );
	} );
} );
