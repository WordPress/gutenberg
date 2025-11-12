/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import FontSizePickerSelect from '../font-size-picker-select';
import type { FontSize } from '../types';

describe( 'FontSizePickerSelect', () => {
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
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="16px"
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the medium option (16px)
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Medium' );
		} );

		it( 'should find font size by slug when valueMode is slug', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="medium"
					valueMode="slug"
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the medium option
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Medium' );
		} );

		it( 'should handle undefined value', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value={ undefined }
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should show default option
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Default' );
		} );

		it( 'should handle empty string value', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value=""
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should show default option
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Default' );
		} );
	} );

	describe( 'onChange callback', () => {
		it( 'should call onChange with FontSize object as second parameter', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			await user.click(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			);
			await user.click(
				screen.getByRole( 'option', { name: 'Small 12px' } )
			);
			expect( onChange ).toHaveBeenCalledWith( '12px', fontSizes[ 0 ] );
		} );

		it( 'should call onChange with undefined as second parameter for default option', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="16px" // Start with a selected value
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			await user.click(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			);
			await user.click(
				screen.getByRole( 'option', { name: 'Default' } )
			);
			expect( onChange ).toHaveBeenCalledWith( undefined, undefined );
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
				<FontSizePickerSelect
					fontSizes={ fontSizesWithDuplicates }
					value="12px"
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should show the first matching font size when there are multiple matches
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Small 1' );
		} );

		it( 'should handle multiple font sizes with same value in slug mode', async () => {
			const onChange = jest.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizesWithDuplicates }
					value="small-1"
					valueMode="slug"
					onChange={ onChange }
					onSelectCustom={ jest.fn() }
					disableCustomFontSizes={ false }
					__next40pxDefaultSize={ false }
					size="default"
				/>
			);
			// Should select the specific font size by slug
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Small 1' );
		} );
	} );
} );
