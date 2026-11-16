import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { isInaccessible, screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import FontSizePickerSelect from '../font-size-picker-select';
import type { FontSize } from '../types';
import Modal from '../../modal';

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

	it( 'exposes the selected preset hint as the description without repeating the value', async () => {
		await render(
			<FontSizePickerSelect
				fontSizes={ fontSizes }
				value="12px"
				onChange={ vi.fn() }
				onSelectCustom={ vi.fn() }
				disableCustomFontSizes={ false }
			/>
		);

		const trigger = screen.getByRole( 'combobox', { name: 'Font size' } );
		const hint = within( trigger ).getByText( '12px' );
		expect( trigger ).toHaveAccessibleDescription( '12px' );
		expect( trigger ).toHaveTextContent( 'Small' );
		expect( hint ).toBeVisible();
		expect( isInaccessible( hint ) ).toBe( true );
	} );

	it( 'selects a preset with the keyboard inside a legacy Modal and returns focus', async () => {
		const onChange = vi.fn();
		await render(
			<Modal title="Typography" onRequestClose={ vi.fn() }>
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="16px"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			</Modal>
		);
		const trigger = screen.getByRole( 'combobox', { name: 'Font size' } );
		await userEvent.click( trigger );
		expect(
			screen.getByRole( 'option', { name: 'Small', description: '12px' } )
		).toBeVisible();
		await userEvent.keyboard( '{Home}{ArrowDown}{Enter}' );
		expect( onChange ).toHaveBeenCalledWith( '12px', fontSizes[ 0 ] );
		await expect.element( trigger ).toHaveFocus();
	} );

	describe( 'valueMode prop', () => {
		it( 'should find font size by size value when valueMode is literal', async () => {
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="16px"
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			);
			// Should select the medium option (16px)
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Medium' );
		} );

		it( 'should find font size by slug when valueMode is slug', async () => {
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="medium"
					valueMode="slug"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			);
			// Should select the medium option
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Medium' );
		} );

		it( 'should handle undefined value', async () => {
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value={ undefined }
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			);
			// Should show default option
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Default' );
		} );

		it( 'should handle empty string value', async () => {
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value=""
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
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
			const user = userEvent;
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			);
			await user.click(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			);
			await user.click(
				screen.getByRole( 'option', {
					name: 'Small',
					description: '12px',
				} )
			);
			expect( onChange ).toHaveBeenCalledWith( '12px', fontSizes[ 0 ] );
		} );

		it( 'should call onChange with undefined as second parameter for default option', async () => {
			const user = userEvent;
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizes }
					value="16px" // Start with a selected value
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
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
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizesWithDuplicates }
					value="12px"
					valueMode="literal"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			);
			// Should show the first matching font size when there are multiple matches
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Small 1' );
		} );

		it( 'should handle multiple font sizes with same value in slug mode', async () => {
			const onChange = vi.fn();
			await render(
				<FontSizePickerSelect
					fontSizes={ fontSizesWithDuplicates }
					value="small-1"
					valueMode="slug"
					onChange={ onChange }
					onSelectCustom={ vi.fn() }
					disableCustomFontSizes={ false }
				/>
			);
			// Should select the specific font size by slug
			expect(
				screen.getByRole( 'combobox', { name: 'Font size' } )
			).toHaveTextContent( 'Small 1' );
		} );
	} );
} );
