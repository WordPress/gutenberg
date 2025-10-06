/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import CSSClassesSettingComponent from '../css-classes-setting';

describe( 'CSSClassesSettingComponent', () => {
	it( 'renders checkbox and hides input by default when no value', async () => {
		render(
			<CSSClassesSettingComponent
				setting={ {
					id: 'cssClasses',
					title: 'Additional CSS class(es)',
				} }
				value={ { cssClasses: '' } }
				onChange={ () => {} }
			/>
		);

		// Checkbox should be visible
		const checkbox = screen.getByRole( 'checkbox', {
			name: 'Additional CSS class(es)',
		} );
		expect( checkbox ).toBeVisible();

		// Input should not be in the document initially
		expect(
			screen.queryByRole( 'textbox', {
				name: 'Additional CSS class(es)',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'shows input when toggled on and calls onChange when typing', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<CSSClassesSettingComponent
				setting={ {
					id: 'cssClasses',
					title: 'Additional CSS class(es)',
				} }
				value={ { cssClasses: '' } }
				onChange={ onChange }
			/>
		);

		// Toggle on
		const checkbox = screen.getByRole( 'checkbox', {
			name: 'Additional CSS class(es)',
		} );
		await user.click( checkbox );

		// Input should appear
		const input = screen.getByRole( 'textbox', {
			name: 'Additional CSS class(es)',
		} );
		expect( input ).toBeVisible();

		// Type classes
		await user.type( input, 'btn btn-primary' );

		// onChange should have been called with the updated value object
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { cssClasses: 'btn btn-primary' } )
		);
	} );

	it( 'hides input and clears value when toggled off with existing value', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<CSSClassesSettingComponent
				setting={ {
					id: 'cssClasses',
					title: 'Additional CSS class(es)',
				} }
				value={ { cssClasses: 'foo bar' } }
				onChange={ onChange }
			/>
		);

		const checkbox = screen.getByRole( 'checkbox', {
			name: 'Additional CSS class(es)',
		} );

		// Initially visible because there is a value
		const input = screen.getByRole( 'textbox', {
			name: 'Additional CSS class(es)',
		} );
		expect( input ).toBeVisible();

		// Toggle off
		await user.click( checkbox );

		// Should have called onChange with cleared value
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { cssClasses: '' } )
		);
		// Input should be hidden afterwards
		expect(
			screen.queryByRole( 'textbox', {
				name: 'Additional CSS class(es)',
			} )
		).not.toBeInTheDocument();
	} );
} );
