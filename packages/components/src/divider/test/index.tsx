/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Divider } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render( <Divider /> );
		expect( screen.getByRole( 'separator' ) ).toMatchSnapshot();
	} );

	test( 'should render marginStart', () => {
		render( <Divider marginStart={ 5 } data-testid="with-margin-start" /> );
		render( <Divider data-testid="default" /> );
		expect(
			screen.getByTestId( 'with-margin-start' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'default' ) );
	} );

	test( 'should render marginEnd', () => {
		render( <Divider marginEnd={ 5 } data-testid="width-margin-end" /> );
		render( <Divider data-testid="default" /> );
		expect(
			screen.getByTestId( 'width-margin-end' )
		).toMatchStyleDiffSnapshot( screen.getByTestId( 'default' ) );
	} );

	test( 'should render margin', () => {
		render( <Divider margin={ 7 } data-testid="with-margin" /> );
		render( <Divider data-testid="default" /> );
		expect( screen.getByTestId( 'with-margin' ) ).toMatchStyleDiffSnapshot(
			screen.getByTestId( 'default' )
		);
	} );
} );
