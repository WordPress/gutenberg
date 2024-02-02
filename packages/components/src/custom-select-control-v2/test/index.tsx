/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { CustomSelect, CustomSelectItem } from '..';

describe( 'CustomSelect', () => {
	it( 'Should be able to select multiple items when provided an array', async () => {
		const user = userEvent.setup();

		const defaultValues = [
			'incandescent glow',
			'ultraviolet morning light',
		];

		render(
			<CustomSelect defaultValue={ defaultValues } label="Multi-select">
				{ [
					'aurora borealis green',
					'flamingo pink sunrise',
					'incandescent glow',
					'rose blush',
					'ultraviolet morning light',
				].map( ( item ) => (
					<CustomSelectItem key={ item } value={ item }>
						{ item }
					</CustomSelectItem>
				) ) }
			</CustomSelect>
		);

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		expect( currentSelectedItem ).toHaveTextContent(
			`${ defaultValues.length } items selected`
		);

		await user.click( currentSelectedItem );

		expect( screen.getByRole( 'listbox' ) ).toHaveAttribute(
			'aria-multiselectable'
		);

		defaultValues.map( ( value ) =>
			expect(
				screen.getByRole( 'option', { name: value, selected: true } )
			).toBeVisible()
		);

		const nextSelection = screen.getByRole( 'option', {
			name: 'rose blush',
		} );

		await user.click( nextSelection );

		expect( nextSelection ).toHaveAttribute( 'aria-selected' );

		expect( currentSelectedItem ).toHaveTextContent(
			`${ defaultValues.length + 1 } items selected`
		);
	} );

	it( 'Should be able to deselect items when provided an array', async () => {
		const user = userEvent.setup();

		const defaultValues = [
			'aurora borealis green',
			'incandescent glow',
			'key lime green',
			'rose blush',
			'ultraviolet morning light',
		];

		render(
			<CustomSelect defaultValue={ defaultValues } label="Multi-select">
				{ defaultValues.map( ( item ) => (
					<CustomSelectItem key={ item } value={ item }>
						{ item }
					</CustomSelectItem>
				) ) }
			</CustomSelect>
		);

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		expect( currentSelectedItem ).toHaveTextContent(
			`${ defaultValues.length } items selected`
		);

		await user.click( currentSelectedItem );

		expect( screen.getByRole( 'listbox' ) ).toHaveAttribute(
			'aria-multiselectable'
		);

		defaultValues.map( ( option ) =>
			expect(
				screen.getByRole( 'option', { name: option, selected: true } )
			).toBeVisible()
		);

		const nextSelection = [
			'aurora borealis green',
			'rose blush',
			'incandescent glow',
		];

		for ( let i = 0; i < nextSelection.length; i++ ) {
			await user.click(
				screen.getByRole( 'option', { name: nextSelection[ i ] } )
			);

			expect(
				screen.getByRole( 'option', {
					name: nextSelection[ i ],
					selected: false,
				} )
			).toBeVisible();
		}

		expect( currentSelectedItem ).toHaveTextContent(
			`${ defaultValues.length - nextSelection.length } items selected`
		);
	} );

	it( 'Should show rendered content as selected value when using `renderControlledValue`', async () => {
		const user = userEvent.setup();

		const renderControlledValue = ( value: string | string[] ) => {
			return (
				<>
					<img src={ `${ value }.jpg` } alt={ value as string } />
					<span>{ value }</span>
				</>
			);
		};

		render(
			<CustomSelect
				label="Rendered"
				renderSelectedValue={ renderControlledValue }
			>
				<CustomSelectItem value="april-29">
					{ renderControlledValue( 'april-29' ) }
				</CustomSelectItem>
				<CustomSelectItem value="july-9">
					{ renderControlledValue( 'july-9' ) }
				</CustomSelectItem>
			</CustomSelect>
		);

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		expect( currentSelectedItem ).toBeVisible();

		expect( screen.getByRole( 'img', { name: 'april-29' } ) ).toBeVisible();

		expect(
			screen.queryByRole( 'img', { name: 'july-9' } )
		).not.toBeInTheDocument();

		await user.click( currentSelectedItem );

		expect( screen.getByRole( 'img', { name: 'july-9' } ) ).toBeVisible();
	} );
} );
