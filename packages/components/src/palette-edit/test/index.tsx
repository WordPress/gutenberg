/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PaletteEdit, { getNameForPosition } from '..';
import type { PaletteElement } from '../types';

describe( 'getNameForPosition', () => {
	test( 'should return 1 by default', () => {
		const slugPrefix = 'test-';
		const elements: PaletteElement[] = [];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 1'
		);
	} );

	test( 'should return a new color name with an incremented slug id', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'test-color-1',
				color: '#ffffff',
				name: 'Test Color 1',
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
				color: '#ffffff',
				name: 'Test Color 1',
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
				color: '#ffffff',
				name: 'Test Color 1',
			},
			{
				slug: 'test-color-2',
				color: '#1a4548',
				name: 'Test Color 2',
			},
			{
				slug: 'test-color-150',
				color: '#f6f6f6',
				name: 'Test Color 150',
			},
			{
				slug: 'a-sweet-color-100',
				color: '#ffe2c7',
				name: 'A Sweet Color 100',
			},
		];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 151'
		);
	} );
} );

describe( 'PaletteEdit', () => {
	const defaultProps = {
		colors: [ { color: '#ffffff', name: 'Base', slug: 'base' } ],
		onChange: jest.fn(),
		paletteLabel: 'Test label',
		emptyMessage: 'Test empty message',
		canOnlyChangeValues: true,
		canReset: true,
		slugPrefix: '',
	};

	it( 'opens color selector for color palettes', () => {
		render( <PaletteEdit { ...defaultProps } /> );
		fireEvent.click( screen.getByLabelText( 'Color: Base' ) );
		expect( screen.getByLabelText( 'Hex color' ) ).toBeInTheDocument();
	} );
} );
