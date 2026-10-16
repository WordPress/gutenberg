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

	it( 'rejects injected props of another type', () => {
		const Mistyped: ComponentType< { setFontSize: number } > = () => null;

		// @ts-expect-error The wrapper passes a function.
		const WithFontSizeMistyped = withFontSizes( 'fontSize' )( Mistyped );

		expect( WithFontSizeMistyped ).toBeDefined();
	} );
} );
