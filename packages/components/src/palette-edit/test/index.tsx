import { render, screen, waitFor } from '@testing-library/react';
import { click, type, press } from '@ariakit/test';
import PaletteEdit, {
	getNameAndSlugForPosition,
	deduplicateElementSlugs,
} from '..';
import type { PaletteElement } from '../types';

const noop = () => {};

async function clearInput( input: HTMLInputElement ) {
	await click( input );

	// Press backspace as many times as the input's current value
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

	test( 'should return a duotone name and slug for the duotone variant', () => {
		const slugPrefix = 'custom-';
		const elements: PaletteElement[] = [];

		expect(
			getNameAndSlugForPosition( elements, slugPrefix, 'duotone' )
		).toEqual( {
			name: 'Duotone 1',
			slug: 'custom-duotone-1',
		} );
	} );

	test( 'should increment the duotone slug id independently of colors', () => {
		const slugPrefix = 'custom-';
		const elements = [
			{
				slug: 'custom-duotone-1',
				colors: [ '#000000', '#ffffff' ],
				name: 'Duotone 1',
			},
			{
				slug: 'custom-duotone-4',
				colors: [ '#8c00b7', '#fcff41' ],
				name: 'Duotone 4',
			},
			// A color preset sharing the prefix must not affect the count.
			{
				slug: 'custom-color-99',
				color: '#ffffff',
				name: 'Color 99',
			},
		];

		expect(
			getNameAndSlugForPosition( elements, slugPrefix, 'duotone' )
		).toEqual( {
			name: 'Duotone 5',
			slug: 'custom-duotone-5',
		} );
	} );
} );

describe( 'deduplicateElementSlugs', () => {
	it( 'should not change the slugs if they are unique', () => {
		const elements: PaletteElement[] = [
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
		];

		expect( deduplicateElementSlugs( elements ) ).toEqual( elements );
	} );
	it( 'should change the slugs if they are not unique', () => {
		const elements: PaletteElement[] = [
			{
				slug: 'test-color-1',
				color: '#ffffff',
				name: 'Test Color 1',
			},
			{
				slug: 'test-color-1',
				color: '#1a4548',
				name: 'Test Color 2',
			},
		];

		expect( deduplicateElementSlugs( elements ) ).toEqual( [
			{
				slug: 'test-color-1',
				color: '#ffffff',
				name: 'Test Color 1',
			},
			{
				slug: 'test-color-1-1',
				color: '#1a4548',
				name: 'Test Color 2',
			},
		] );
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
	const duotones = [
		{
			colors: [ '#8c00b7', '#fcff41' ],
			name: 'Purple and yellow',
			slug: 'purple-yellow',
		},
		{
			colors: [ '#000097', '#ff4747' ],
			name: 'Blue and red',
			slug: 'blue-red',
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

	it( 'calls the `onChange` with the new duotone appended, seeded from the color palette', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ duotones }
				colorPalette={ colors }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Add duotone',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				...duotones,
				{
					// The darkest and lightest colors of `colors`.
					colors: [ '#0000ff', '#1a4548' ],
					name: 'Duotone 1',
					slug: 'duotone-1',
				},
			] );
		} );
	} );

	it( 'ignores palette colors a duotone cannot be built from when adding one', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ duotones }
				colorPalette={ [
					...colors,
					// Twenty Twenty-Five ships a color like this. `colord`
					// cannot parse it and treats it as black, which would
					// otherwise win as the duotone's shadow color and produce a
					// duotone that cannot be rendered.
					{
						color: 'color-mix(in srgb, currentColor 20%, transparent)',
						name: 'Contrast overlay',
						slug: 'contrast-overlay',
					},
				] }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Add duotone',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				...duotones,
				{
					colors: [ '#0000ff', '#1a4548' ],
					name: 'Duotone 1',
					slug: 'duotone-1',
				},
			] );
		} );
	} );

	// The front end parses duotone colors with a PHP port of colord that only
	// accepts hex, `rgb()` and `hsl()`, so a named color saved as-is would
	// render in the editor and be dropped on the front end.
	it( 'normalizes palette colors to hex when adding a duotone', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ duotones }
				colorPalette={ [
					{ color: 'black', name: 'Black', slug: 'black' },
					{ color: 'white', name: 'White', slug: 'white' },
				] }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Add duotone',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				...duotones,
				{
					colors: [ '#000000', '#ffffff' ],
					name: 'Duotone 1',
					slug: 'duotone-1',
				},
			] );
		} );
	} );

	it( 'falls back to black and white when adding a duotone without a color palette', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ duotones }
				onChange={ onChange }
			/>
		);

		await click(
			screen.getByRole( 'button', {
				name: 'Add duotone',
			} )
		);

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				...duotones,
				{
					colors: [ '#000', '#fff' ],
					name: 'Duotone 1',
					slug: 'duotone-1',
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
				name: 'Remove color: Primary',
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
		const nameInput = screen.getByDisplayValue( 'Primary' );

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

		await click( screen.getByLabelText( 'Primary' ) );
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

	it( 'can update duotone palette value', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ duotones }
				colorPalette={ colors }
				onChange={ onChange }
			/>
		);

		await click( screen.getByLabelText( 'Duotone: Blue and red' ) );
		await click( screen.getByRole( 'button', { name: /Shadows/ } ) );
		await click( screen.getByRole( 'option', { name: 'Primary' } ) );

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				duotones[ 0 ],
				{
					...duotones[ 1 ],
					colors: [ '#1a4548', duotones[ 1 ].colors[ 1 ] ],
				},
			] );
		} );
	} );

	// The same filtering and normalization that applies when adding a duotone
	// has to apply when editing one, or the shadows and highlights picker can
	// offer a color the saved duotone cannot be built from.
	it( 'hides unusable colors and saves named ones as hex when editing a duotone', async () => {
		const onChange = jest.fn();

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ duotones }
				colorPalette={ [
					{
						color: 'black',
						name: 'Named black',
						slug: 'named-black',
					},
					{
						color: 'color-mix(in srgb, currentColor 20%, transparent)',
						name: 'Contrast overlay',
						slug: 'contrast-overlay',
					},
				] }
				onChange={ onChange }
			/>
		);

		await click( screen.getByLabelText( 'Duotone: Blue and red' ) );
		await click( screen.getByRole( 'button', { name: /Shadows/ } ) );

		// The unusable color must not be offered at all.
		expect(
			screen.queryByRole( 'option', { name: 'Contrast overlay' } )
		).not.toBeInTheDocument();

		await click( screen.getByRole( 'option', { name: 'Named black' } ) );

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				duotones[ 0 ],
				{
					...duotones[ 1 ],
					colors: [ '#000000', duotones[ 1 ].colors[ 1 ] ],
				},
			] );
		} );
	} );

	// Adding two duotones with the `+` button seeds both from the palette's
	// darkest and lightest colors, so duplicate values are the normal case
	// rather than an edge one. The duotone that was clicked has to be the one
	// that gets edited.
	it( 'updates the clicked duotone when two share the same colors', async () => {
		const onChange = jest.fn();
		const twins = [
			{ colors: [ '#000000', '#ffffff' ], name: 'First', slug: 'first' },
			{
				colors: [ '#000000', '#ffffff' ],
				name: 'Second',
				slug: 'second',
			},
		];

		render(
			<PaletteEdit
				{ ...defaultProps }
				duotones={ twins }
				colorPalette={ colors }
				onChange={ onChange }
			/>
		);

		await click( screen.getByLabelText( 'Duotone: Second' ) );
		await click( screen.getByRole( 'button', { name: /Shadows/ } ) );
		await click( screen.getByRole( 'option', { name: 'Primary' } ) );

		await waitFor( () => {
			expect( onChange ).toHaveBeenCalledWith( [
				twins[ 0 ],
				{ ...twins[ 1 ], colors: [ '#1a4548', '#ffffff' ] },
			] );
		} );
	} );
} );
