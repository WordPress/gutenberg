/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import FontSizePickerToggleGroup from '../font-size-picker-toggle-group';
import type { FontSize } from '../types';

describe( 'FontSizePickerToggleGroup', () => {
	const fontSizes: FontSize[] = [
		{
			slug: 'small',
			name: 'Small',
			size: '12px',
		},
		{
			slug: 'medium',
			name: 'Medium',
			size: '16px',
		},
		{
			slug: 'large',
			name: 'Large',
			size: '20px',
		},
	];

	describe( 'valueMode prop', () => {
		it( 'should find font size by size value when valueMode is literal', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizes }
					value="16px"
					valueMode="literal"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the medium option (16px)
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveAccessibleName( 'Medium' );
		} );

		it( 'should find font size by slug when valueMode is slug', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizes }
					value="medium"
					valueMode="slug"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the medium option
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveAccessibleName( 'Medium' );
		} );

		it( 'should handle undefined value', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizes }
					value={ undefined }
					valueMode="literal"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should have no selection
			expect(
				screen.queryByRole( 'radio', { checked: true } )
			).not.toBeInTheDocument();
		} );

		it( 'should handle empty string value', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizes }
					value=""
					valueMode="literal"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should have no selection
			expect(
				screen.queryByRole( 'radio', { checked: true } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'onChange callback', () => {
		it( 'should call onChange with FontSize object as second parameter', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizes }
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			await user.click( screen.getByRole( 'radio', { name: 'Small' } ) );
			expect( onChange ).toHaveBeenCalledWith( '12px', fontSizes[ 0 ] );
		} );

		it( 'should call onChange with FontSize object when selecting a different option', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizes }
					value="medium"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Click a different option
			await user.click( screen.getByRole( 'radio', { name: 'Small' } ) );
			expect( onChange ).toHaveBeenCalledWith( '12px', fontSizes[ 0 ] );
		} );
	} );

	describe( 'edge cases', () => {
		const fontSizesWithDuplicates: FontSize[] = [
			{
				slug: 'small-1',
				name: 'Small 1',
				size: '12px',
			},
			{
				slug: 'small-2',
				name: 'Small 2',
				size: '12px',
			},
			{
				slug: 'medium',
				name: 'Medium',
				size: '16px',
			},
		];

		it( 'should handle multiple font sizes with same value in literal mode', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizesWithDuplicates }
					value="12px"
					valueMode="literal"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should have no selection when there are multiple matches
			expect(
				screen.queryByRole( 'radio', { checked: true } )
			).not.toBeInTheDocument();
		} );

		it( 'should handle multiple font sizes with same value in slug mode', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ fontSizesWithDuplicates }
					value="small-1"
					valueMode="slug"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the specific font size by slug
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveAccessibleName( 'Small 1' );
		} );
	} );

	describe( 'heterogeneous font sizes', () => {
		const heterogeneousFontSizes: FontSize[] = [
			{
				slug: 'small',
				name: 'Small',
				size: '12px',
			},
			{
				slug: 'medium',
				name: 'Medium',
				size: '1em',
			},
			{
				slug: 'large',
				name: 'Large',
				size: '2rem',
			},
			{
				slug: 'x-large',
				name: 'Extra Large',
				size: 'clamp(1.75rem, 3vw, 2.25rem)',
			},
		];

		it( 'should handle different units in literal mode', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ heterogeneousFontSizes }
					value="1em"
					valueMode="literal"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the medium option (1em)
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveAccessibleName( 'Medium' );
		} );

		it( 'should handle complex font size values in literal mode', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ heterogeneousFontSizes }
					value="clamp(1.75rem, 3vw, 2.25rem)"
					valueMode="literal"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the extra large option
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveAccessibleName( 'Extra Large' );
		} );

		it( 'should handle different units in slug mode', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerToggleGroup
					fontSizes={ heterogeneousFontSizes }
					value="medium"
					valueMode="slug"
					onChange={ onChange }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the medium option
			expect(
				screen.getByRole( 'radio', { checked: true } )
			).toHaveAccessibleName( 'Medium' );
		} );
	} );
} );
