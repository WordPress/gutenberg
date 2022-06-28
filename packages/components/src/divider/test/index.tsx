/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Divider } from '..';

describe( 'props', () => {
	beforeEach( () => {
		render( <Divider /> );
	} );

	test( 'should render correctly', () => {
		expect( screen.getByRole( 'separator' ) ).toMatchSnapshot();
	} );

	test( 'should render marginStart', () => {
		render( <Divider marginStart={ 5 } /> );

		const dividers = screen.getAllByRole( 'separator' );
		expect( dividers[ 0 ] ).toMatchStyleDiffSnapshot( dividers[ 1 ] );
	} );

	test( 'should render marginEnd', () => {
		render( <Divider marginEnd={ 5 } /> );

		const dividers = screen.getAllByRole( 'separator' );
		expect( dividers[ 0 ] ).toMatchStyleDiffSnapshot( dividers[ 1 ] );
	} );

	test( 'should render margin', () => {
		render( <Divider margin={ 7 } /> );

		const dividers = screen.getAllByRole( 'separator' );
		expect( dividers[ 0 ] ).toMatchStyleDiffSnapshot( dividers[ 1 ] );
	} );
} );
