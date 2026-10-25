import type { ComponentType } from 'react';
import { Component } from '@wordpress/element';
import { describe, expect, it } from 'vitest';
import withFontSizes from '../with-font-sizes';
import type { FontSizeObject } from '../types';

/*
 * These checks run at type-check time: each `@ts-expect-error` fails the
 * type check if the line below it stops being a type error.
 */
describe( 'withFontSizes types', () => {
	it( 'infers the props of the wrapped component', () => {
		const Labeled: ComponentType< {
			fontSize: FontSizeObject;
			label: string;
		} > = () => null;
		const WithFontSize = withFontSizes( 'fontSize' )( Labeled );

		const withLabel = (
			<WithFontSize
				label="Size"
				attributes={ {} }
				setAttributes={ () => {} }
			/>
		);
		const withoutLabel = (
			// @ts-expect-error The own props stay required.
			<WithFontSize attributes={ {} } setAttributes={ () => {} } />
		);

		expect( [ withLabel, withoutLabel ] ).toHaveLength( 2 );
	} );

	it( 'infers the props of a wrapped class component', () => {
		class Labeled extends Component< {
			fontSize: FontSizeObject;
			label: string;
		} > {
			render() {
				return null;
			}
		}
		const WithFontSize = withFontSizes( 'fontSize' )( Labeled );

		const withLabel = (
			<WithFontSize
				label="Size"
				attributes={ {} }
				setAttributes={ () => {} }
			/>
		);
		const withoutLabel = (
			// @ts-expect-error The own props stay required.
			<WithFontSize attributes={ {} } setAttributes={ () => {} } />
		);

		expect( [ withLabel, withoutLabel ] ).toHaveLength( 2 );
	} );

	it( 'accepts injected values that fit the declared props', () => {
		const Labeled: ComponentType< {
			setFontSize: ( size: number ) => void;
			label: string;
		} > = () => null;
		const WithFontSize = withFontSizes( 'fontSize' )( Labeled );

		expect(
			<WithFontSize
				label="Size"
				attributes={ {} }
				setAttributes={ () => {} }
			/>
		).toBeDefined();
	} );

	it( 'rejects injected values that do not fit the declared props', () => {
		const Narrow: ComponentType< { fontSize: { size: number } } > = () =>
			null;

		// @ts-expect-error The injected size can be unset or a string.
		const WithFontSize = withFontSizes( 'fontSize' )( Narrow );

		expect( WithFontSize ).toBeDefined();
	} );

	it( 'rejects injected props of another type', () => {
		const Mistyped: ComponentType< { setFontSize: number } > = () => null;

		// @ts-expect-error The wrapper passes a function.
		const WithFontSizeMistyped = withFontSizes( 'fontSize' )( Mistyped );

		expect( WithFontSizeMistyped ).toBeDefined();
	} );
} );
