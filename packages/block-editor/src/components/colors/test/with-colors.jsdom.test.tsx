import type { ComponentType } from 'react';
import { Component } from '@wordpress/element';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import withColors, { createCustomColorsHOC } from '../with-colors';
import type { ColorObject } from '../types';

describe( 'createCustomColorsHOC', () => {
	it( 'provides the wrapped component with color values and setter functions as props', () => {
		const withCustomColors = createCustomColorsHOC( [
			{ name: 'Red', slug: 'red', color: 'ff0000' },
		] );
		const BaseComponent = vi.fn( () => <div /> );
		const EnhancedComponent =
			withCustomColors( 'backgroundColor' )( BaseComponent );

		render(
			// @ts-expect-error The setter is never called here.
			<EnhancedComponent attributes={ { backgroundColor: null } } />
		);

		expect( BaseComponent ).toHaveBeenCalledWith(
			expect.objectContaining( {
				attributes: expect.objectContaining( {
					backgroundColor: null,
				} ),
				backgroundColor: expect.objectContaining( {
					class: undefined,
					color: undefined,
				} ),
				colorUtils: expect.objectContaining( {
					getMostReadableColor: expect.any( Function ),
				} ),
				setBackgroundColor: expect.any( Function ),
			} ),
			undefined
		);
	} );

	it( 'setting the color to a value in the provided custom color array updated the backgroundColor attribute', async () => {
		const user = userEvent.setup();
		const withCustomColors = createCustomColorsHOC( [
			{ name: 'Red', slug: 'red', color: 'ff0000' },
		] );
		const EnhancedComponent = withCustomColors( 'backgroundColor' )(
			( props ) => (
				<button
					onClick={ () =>
						// The HOC passes a setter for each color.
						(
							props.setBackgroundColor as (
								value: string
							) => void
						 )( 'ff0000' )
					}
				>
					Test Me
				</button>
			)
		);

		const setAttributes = vi.fn();

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
				<button
					onClick={ () =>
						// The HOC passes a setter for each color.
						(
							props.setBackgroundColor as (
								value: string
							) => void
						 )( '000000' )
					}
				>
					Test Me
				</button>
			)
		);

		const setAttributes = vi.fn();

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

/*
 * These checks run at type-check time: each `@ts-expect-error` fails the
 * type check if the line below it stops being a type error.
 */
describe( 'withColors types', () => {
	it( 'infers the props of the wrapped component', () => {
		const Labeled: ComponentType< {
			backgroundColor: ColorObject;
			label: string;
		} > = () => null;
		const WithColor = withColors( 'backgroundColor' )( Labeled );

		const withLabel = (
			<WithColor
				label="Color"
				attributes={ {} }
				setAttributes={ () => {} }
			/>
		);
		const withoutLabel = (
			// @ts-expect-error The own props stay required.
			<WithColor attributes={ {} } setAttributes={ () => {} } />
		);

		expect( [ withLabel, withoutLabel ] ).toHaveLength( 2 );
	} );

	it( 'infers the props of a wrapped class component', () => {
		class Labeled extends Component< {
			backgroundColor: ColorObject;
			label: string;
		} > {
			render() {
				return null;
			}
		}
		const WithColor = withColors( 'backgroundColor' )( Labeled );

		const withLabel = (
			<WithColor
				label="Size"
				attributes={ {} }
				setAttributes={ () => {} }
			/>
		);
		const withoutLabel = (
			// @ts-expect-error The own props stay required.
			<WithColor attributes={ {} } setAttributes={ () => {} } />
		);

		expect( [ withLabel, withoutLabel ] ).toHaveLength( 2 );
	} );

	it( 'accepts injected values that fit the declared props', () => {
		const Labeled: ComponentType< {
			setBackgroundColor: ( color: string ) => void;
			label: string;
		} > = () => null;
		const WithColor = withColors( 'backgroundColor' )( Labeled );

		expect(
			<WithColor
				label="Color"
				attributes={ {} }
				setAttributes={ () => {} }
			/>
		).toBeDefined();
	} );

	it( 'rejects injected values that do not fit the declared props', () => {
		const Narrow: ComponentType< {
			backgroundColor: { color: string };
		} > = () => null;

		// @ts-expect-error The injected color can be unset.
		const WithColor = withColors( 'backgroundColor' )( Narrow );

		expect( WithColor ).toBeDefined();
	} );

	it( 'rejects injected props of another type', () => {
		const Mistyped: ComponentType< { setBackgroundColor: number } > = () =>
			null;

		// @ts-expect-error The wrapper passes a function.
		const WithColorMistyped = withColors( 'backgroundColor' )( Mistyped );

		expect( WithColorMistyped ).toBeDefined();
	} );
} );
