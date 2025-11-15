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

		// aria-expanded should reflect collapsed state
		expect( checkbox ).toHaveAttribute( 'aria-expanded', 'false' );

		// aria-controls should not be present when region is not rendered
		expect( checkbox ).not.toHaveAttribute( 'aria-controls' );

		// Input should not be in the document initially
		expect(
			screen.queryByRole( 'textbox', {
				name: 'CSS classes',
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
		// starts collapsed
		expect( checkbox ).toHaveAttribute( 'aria-expanded', 'false' );
		await user.click( checkbox );
		// now expanded
		expect( checkbox ).toHaveAttribute( 'aria-expanded', 'true' );

		// aria-controls should be present when expanded
		const regionId = checkbox.getAttribute( 'aria-controls' );
		expect( regionId ).toBeTruthy();

		// Input should appear
		const input = screen.getByRole( 'textbox', {
			name: 'CSS classes',
		} );
		expect( input ).toBeVisible();

		// Type classes (including commas) - commas should be converted to spaces
		await user.type( input, 'btn,btn-primary  ,  btn-secondary' );

		// onChange should have been called with the updated value object
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				cssClasses: 'btn btn-primary btn-secondary',
			} )
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

		// Initially expanded and has aria-controls
		expect( checkbox ).toHaveAttribute( 'aria-expanded', 'true' );
		const initialRegionId = checkbox.getAttribute( 'aria-controls' );
		expect( initialRegionId ).toBeTruthy();

		// Initially visible because there is a value
		const input = screen.getByRole( 'textbox', {
			name: 'CSS classes',
		} );
		expect( input ).toBeVisible();

		// Toggle off
		await user.click( checkbox );
		// aria-expanded should now be false
		expect( checkbox ).toHaveAttribute( 'aria-expanded', 'false' );

		// Should have called onChange with cleared value
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { cssClasses: '' } )
		);
		// Input should be hidden afterwards
		expect(
			screen.queryByRole( 'textbox', {
				name: 'CSS classes',
			} )
		).not.toBeInTheDocument();

		// aria-controls should be removed when collapsed
		expect( checkbox ).not.toHaveAttribute( 'aria-controls' );
	} );
} );
