import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dateI18n } from '@wordpress/date';
import DateFormatPicker from '../index';

describe( 'DateFormatPicker', () => {
	it( 'renders default format switch with current date preview', () => {
		const currentDate = new Date();
		const expectedPreview = dateI18n( 'F j, Y', currentDate );

		render(
			<DateFormatPicker
				format={ null }
				defaultFormat="F j, Y"
				onChange={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'switch', { name: 'Default format' } )
		).toBeChecked();
		expect(
			screen.getByText( new RegExp( expectedPreview ) )
		).toBeInTheDocument();
	} );

	it( 'renders format options with format tokens as secondary description', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(
			<DateFormatPicker
				format="F j, Y"
				defaultFormat="F j, Y"
				onChange={ onChange }
			/>
		);

		const selectTrigger = screen.getByRole( 'combobox', {
			name: 'Choose a format',
		} );
		expect( selectTrigger ).toBeInTheDocument();

		await user.click( selectTrigger );

		// The format string descriptions and relative time description should be rendered.
		expect( screen.getByText( 'Y-m-d' ) ).toBeInTheDocument();
		expect( screen.getByText( 'F j, Y' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Time difference' ) ).toBeInTheDocument();

		// Clicking an option triggers onChange.
		await user.click( screen.getByText( 'Y-m-d' ) );
		expect( onChange ).toHaveBeenCalledWith( 'Y-m-d' );
	} );
} );
