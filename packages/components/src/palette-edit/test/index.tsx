/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import { click, type, press } from '@ariakit/test';

/**
 * Internal dependencies
 */
import PaletteEdit, { getNameAndSlugForPosition } from '..';
import type { PaletteElement } from '../types';

const noop = () => {};

async function clearInput( input: HTMLInputElement ) {
	await click( input );

	// Press backspace as many times as the input's current value
	for ( const _ of Array( input.value.length ) ) {
		await press.Backspace();
	}
}

describe( 'getNameAndSlugForPosition', () => {
	test( 'should return 1 by default', () => {
		const slugPrefix = 'test-';
		const elements: PaletteElement[] = [];

		expect( getNameAndSlugForPosition( elements, slugPrefix ) ).toEqual( {
			name: 'Color 1',
			slug: 'test-color-1',
		} );
	} );

	test( 'should return a new color name and slug with an incremented slug id', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'test-color-1',
				color: '#ffffff',
				name: 'Test Color 1',
			},
		];

		expect( getNameAndSlugForPosition( elements, slugPrefix ) ).toEqual( {
			name: 'Color 2',
			slug: 'test-color-2',
		} );
	} );

	test( 'should ignore user-defined color name and slug', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'a-sweet-color-2',
				color: '#ffffff',
				name: 'Test Color 1',
			},
		];

		expect( getNameAndSlugForPosition( elements, slugPrefix ) ).toEqual( {
			name: 'Color 1',
			slug: 'test-color-1',
		} );
	} );

	test( 'should return a new color name and slug with an incremented slug id one higher than the current highest', () => {
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

		expect( getNameAndSlugForPosition( elements, slugPrefix ) ).toEqual( {
			name: 'Color 151',
			slug: 'test-color-151',
		} );
	} );
} );

describe( 'PaletteEdit', () => {
	const defaultProps = {
		paletteLabel: 'Test label',
		slugPrefix: '',
		onChange: noop,
	};

	const colors = [
		{ color: '#1a4548', name: 'Primary', slug: 'primary' },
		{ color: '#0000ff', name: 'Secondary', slug: 'secondary' },
	];
	const gradients = [
		{
			gradient:
				'linear-gradient(135deg,rgb(255,245,203) 0%,rgb(182,227,212) 50%,rgb(51,167,181) 100%)',
			name: 'Pale ocean',
			slug: 'pale-ocean',
		},
		{
			gradient:
				'linear-gradient(135deg,rgb(2,3,129) 0%,rgb(40,116,252) 100%)',
			name: 'Midnight',
			slug: 'midnight',
		},
	];

	it( 'shows heading label', () => {
		render( <PaletteEdit { ...defaultProps } colors={ colors } /> );

		const paletteLabel = screen.getByRole( 'heading', {
			level: 2,
			name: 'Test label',
		} );

		expect( paletteLabel ).toBeVisible();
	} );

	it( 'shows heading label with custom heading level', () => {
		render(
			<PaletteEdit
				{ ...defaultProps }
				colors={ colors }
				paletteLabelHeadingLevel={ 5 }
			/>
		);

		expect(
			screen.getByRole( 'heading', {
				level: 5,
				name: 'Test label',
			} )
		).toBeVisible();
	} );

	it( 'shows empty message', () => {
		render(
			<PaletteEdit
				{ ...defaultProps }
				emptyMessage="Test empty message"
			/>
		);

		expect( screen.getByText( 'Test empty message' ) ).toBeVisible();
	} );

	it( 'shows an option to remove all colors', async () => {
		render( <PaletteEdit { ...defaultProps } colors={ colors } /> );

		await click(
			screen.getByRole( 'button', {
				name: 'Color options',
			} )
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', {
					name: 'Remove all colors',
				} )
			).toBeVisible();
		} );
	} );

	it( 'shows a reset option when the `canReset` prop is enabled', async () => {
		render(
			<PaletteEdit { ...defaultProps } colors={ colors } canReset />
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Color options',
			} )
		);
		await waitFor( () => {
			expect(
				screen.getByRole( 'button', {
					name: 'Reset colors',
				} )
			).toBeVisible();
		} );
	} );

	it( 'does not show a reset colors option when `canReset` is disabled', async () => {
		render( <PaletteEdit { ...defaultProps } colors={ colors } /> );

		await click(
			screen.getByRole( 'button', {
				name: 'Color options',
			} )
		);
		expect(
			screen.queryByRole( 'button', {
				name: 'Reset colors',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'calls the `onChange` with the new color appended', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				colors={ colors }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Add color',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				...colors,
				{
					color: '#000',
					name: 'Color 1',
					slug: 'color-1',
				},
			] );
		} );
	} );

	it( 'calls the `onChange` with the new gradient appended', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				gradients={ gradients }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Add gradient',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				...gradients,
				{
					gradient:
						'linear-gradient(135deg, rgba(6, 147, 227, 1) 0%, rgb(155, 81, 224) 100%)',
					name: 'Color 1',
					slug: 'color-1',
				},
			] );
		} );
	} );

	it( 'can not add new colors when `canOnlyChangeValues` is enabled', () => {
		render( <PaletteEdit { ...defaultProps } canOnlyChangeValues /> );

		expect(
			screen.queryByRole( 'button', {
				name: 'Add color',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'can remove a color', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				colors={ colors }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Color options',
			} )
		);
		await click(
			screen.getByRole( 'button', {
				name: 'Show details',
			} )
		);
		await click( screen.getByRole( 'button', { name: 'Edit: Primary' } ) );
		await click(
			screen.getByRole( 'button', {
				name: 'Remove color',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [ colors[ 1 ] ] );
		} );
	} );

	it( 'can update palette name', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				colors={ colors }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Color options',
			} )
		);
		await click(
			screen.getByRole( 'button', {
				name: 'Show details',
			} )
		);
		await click( screen.getByRole( 'button', { name: 'Edit: Primary' } ) );
		const nameInput = screen.getByRole( 'textbox', {
			name: 'Color name',
		} );

		await clearInput( nameInput as HTMLInputElement );

		await type( 'Primary Updated' );

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				{
					...colors[ 0 ],
					name: 'Primary Updated',
					slug: 'primary-updated',
				},
				colors[ 1 ],
			] );
		} );
	} );

	it( 'can update color palette value', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				colors={ colors }
				onChange={ onChange }
			/>
		);

		await click( screen.getByLabelText( 'Color: Primary' ) );
		const hexInput = screen.getByRole( 'textbox', {
			name: 'Hex color',
		} );

		await clearInput( hexInput as HTMLInputElement );

		await type( '000000' );

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				{
					...colors[ 0 ],
					color: '#000000',
				},
				colors[ 1 ],
			] );
		} );
	} );

	it( 'can update gradient palette value', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				gradients={ gradients }
				onChange={ onChange }
			/>
		);

		await click( screen.getByLabelText( 'Gradient: Pale ocean' ) );

		// Select radial gradient option
		await click(
			screen.getByRole( 'combobox', {
				name: 'Type',
			} )
		);
		await click( screen.getByRole( 'option', { name: 'Radial' } ) );

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				{
					...gradients[ 0 ],
					gradient:
						'radial-gradient(rgb(255,245,203) 0%,rgb(182,227,212) 50%,rgb(51,167,181) 100%)',
				},
				gradients[ 1 ],
			] );
		} );
	} );
} );
