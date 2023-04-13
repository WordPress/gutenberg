/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { createCustomColorsHOC } from '../with-colors';

describe( 'createCustomColorsHOC', () => {
	it( 'provides the wrapped component with color values and setter functions as props', () => {
		const withCustomColors = createCustomColorsHOC( [
			{ name: 'Red', slug: 'red', color: 'ff0000' },
		] );
		const BaseComponent = jest.fn( () => <div /> );
		const EnhancedComponent =
			withCustomColors( 'backgroundColor' )( BaseComponent );

		render(
			<EnhancedComponent attributes={ { backgroundColor: null } } />
		);

		expect( BaseComponent ).toHaveBeenCalledWith(
			expect.objectContaining( {
				attributes: {
					backgroundColor: null,
				},
				backgroundColor: {
					class: undefined,
					color: undefined,
				},
				colorUtils: {
					getMostReadableColor: expect.any( Function ),
				},
				colors: undefined,
				setBackgroundColor: expect.any( Function ),
			} ),
			expect.anything()
		);
	} );

	it( 'setting the color to a value in the provided custom color array updated the backgroundColor attribute', async () => {
		const user = userEvent.setup();
		const withCustomColors = createCustomColorsHOC( [
			{ name: 'Red', slug: 'red', color: 'ff0000' },
		] );
		const EnhancedComponent = withCustomColors( 'backgroundColor' )(
			( props ) => (
				<button onClick={ () => props.setBackgroundColor( 'ff0000' ) }>
					Test Me
				</button>
			)
		);

		const setAttributes = jest.fn();

		render(
			<EnhancedComponent
				attributes={ { backgroundColor: null } }
				setAttributes={ setAttributes }
			/>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			backgroundColor: 'red',
			customBackgroundColor: undefined,
		} );
	} );

	it( 'setting the color to a value not in the provided custom color array updates customBackgroundColor attribute', async () => {
		const user = userEvent.setup();
		const withCustomColors = createCustomColorsHOC( [
			{ name: 'Red', slug: 'red', color: 'ff0000' },
		] );
		const EnhancedComponent = withCustomColors( 'backgroundColor' )(
			( props ) => (
				<button onClick={ () => props.setBackgroundColor( '000000' ) }>
					Test Me
				</button>
			)
		);

		const setAttributes = jest.fn();

		render(
			<EnhancedComponent
				attributes={ { backgroundColor: null } }
				setAttributes={ setAttributes }
			/>
		);

		await user.click( screen.getByRole( 'button' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			backgroundColor: undefined,
			customBackgroundColor: '000000',
		} );
	} );
} );
