/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PaletteEdit, { getNameForPosition } from '../';

describe( 'getNameForPosition', () => {
	test( 'should return 1 by default', () => {
		const slugPrefix = 'test-';
		const elements = [];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 1'
		);
	} );

	test( 'should return a new color name with an incremented slug id', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'test-color-1',
			},
		];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 2'
		);
	} );

	test( 'should ignore user-defined color names', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'a-sweet-color-2',
			},
		];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 1'
		);
	} );

	test( 'should return a new color name with an incremented slug id one higher than the current highest', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'test-color-1',
			},
			{
				slug: 'test-color-2',
			},
			{
				slug: 'test-color-150',
			},
			{
				slug: 'a-sweet-color-100',
			},
		];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 151'
		);
	} );
} );

describe( 'PaletteEdit', () => {
	const defaultProps = {
		gradients: false,
		colors: [ { color: '#ffffff', name: 'Base', slug: 'base' } ],
		onChange: jest.fn(),
		paletteLabel: 'Test label',
		emptyMessage: 'Test empty message',
		canOnlyChangeValues: true,
		canReset: true,
		slugPrefix: '',
	};

	it( 'opens color selector for color palettes', async () => {
		render( <PaletteEdit { ...defaultProps } /> );
		fireEvent.click( screen.getByLabelText( 'Color: Base' ) );
		expect(
			screen.getByLabelText( 'Select a new color' )
		).toBeInTheDocument();
	} );

	it( 'opens gradient selector for gradient palettes', () => {
		const gradientProps = {
			...defaultProps,
			colors: undefined,
			gradients: [
				{
					gradient:
						'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
					name: 'Vivid cyan blue to vivid purple',
					slug: 'vivid-cyan-blue-to-vivid-purple',
				},
			],
		};
		render( <PaletteEdit { ...gradientProps } /> );
		fireEvent.click(
			screen.getByLabelText( 'Gradient: Vivid cyan blue to vivid purple' )
		);
		expect(
			screen.getByLabelText( 'Select a new gradient' )
		).toBeInTheDocument();
	} );
} );
