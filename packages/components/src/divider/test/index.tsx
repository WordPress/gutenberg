/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Divider } from '..';

describe( 'props', () => {
	test( 'should render a horizontal separator by default', () => {
		render( <Divider /> );

		const divider = screen.getByRole( 'separator' );
		expect( divider ).toHaveAttribute( 'aria-orientation', 'horizontal' );
	} );

	test( 'should render marginStart', () => {
		render( <Divider marginStart={ 5 } /> );

		expect( screen.getByRole( 'separator' ) ).toHaveStyle( {
			'--wp-components-divider-margin-start': 'calc(4px * 5)',
		} );
	} );

	test( 'should render marginEnd', () => {
		render( <Divider marginEnd={ 5 } /> );

		expect( screen.getByRole( 'separator' ) ).toHaveStyle( {
			'--wp-components-divider-margin-end': 'calc(4px * 5)',
		} );
	} );

	test( 'should render margin', () => {
		render( <Divider margin={ 7 } /> );

		expect( screen.getByRole( 'separator' ) ).toHaveStyle( {
			'--wp-components-divider-margin-start': 'calc(4px * 7)',
			'--wp-components-divider-margin-end': 'calc(4px * 7)',
		} );
	} );

	test( 'should render vertical orientation', () => {
		render( <Divider orientation="vertical" /> );

		const divider = screen.getByRole( 'separator' );
		expect( divider ).toHaveAttribute( 'aria-orientation', 'vertical' );
	} );
} );
