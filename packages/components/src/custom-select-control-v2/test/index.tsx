/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelect, CustomSelectItem } from '..';
import type { CustomSelectProps } from '../types';

const ControlledCustomSelect = ( props: CustomSelectProps ) => {
	const [ value, setValue ] = useState< string | string[] >();
	return (
		<CustomSelect
			{ ...props }
			onChange={ ( nextValue ) => {
				setValue( nextValue );
				props.onChange?.( nextValue );
			} }
			value={ value }
		/>
	);
};

describe.each( [
	[ 'uncontrolled', CustomSelect ],
	[ 'controlled', ControlledCustomSelect ],
] )( 'CustomSelect %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	describe( 'Multiple selection', () => {
		it( 'Should be able to select multiple items when provided an array', async () => {
			const user = userEvent.setup();
			const onChangeMock = jest.fn();

			// initial selection as defaultValue
			const defaultValues = [
				'incandescent glow',
				'ultraviolet morning light',
			];

			render(
				<Component
					defaultValue={ defaultValues }
					onChange={ onChangeMock }
					label="Multi-select"
				>
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
				</Component>
			);

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			// ensure more than one item is selected due to defaultValues
			expect( currentSelectedItem ).toHaveTextContent(
				`${ defaultValues.length } items selected`
			);

			await user.click( currentSelectedItem );

			expect( screen.getByRole( 'listbox' ) ).toHaveAttribute(
				'aria-multiselectable'
			);

			// ensure defaultValues are selected in list of items
			defaultValues.forEach( ( value ) =>
				expect(
					screen.getByRole( 'option', {
						name: value,
						selected: true,
					} )
				).toBeVisible()
			);

			// name of next selection
			const nextSelectionName = 'rose blush';

			// element for next selection
			const nextSelection = screen.getByRole( 'option', {
				name: nextSelectionName,
			} );

			// click next selection to add another item to current selection
			await user.click( nextSelection );

			// updated array containing defaultValues + the item just selected
			const updatedSelection = defaultValues.concat( nextSelectionName );

			expect( onChangeMock ).toHaveBeenCalledWith( updatedSelection );

			expect( nextSelection ).toHaveAttribute( 'aria-selected' );

			// expect increased array length for current selection
			expect( currentSelectedItem ).toHaveTextContent(
				`${ updatedSelection.length } items selected`
			);
		} );

		it( 'Should be able to deselect items when provided an array', async () => {
			const user = userEvent.setup();

			// initial selection as defaultValue
			const defaultValues = [
				'aurora borealis green',
				'incandescent glow',
				'key lime green',
				'rose blush',
				'ultraviolet morning light',
			];

			render(
				<Component defaultValue={ defaultValues } label="Multi-select">
					{ defaultValues.map( ( item ) => (
						<CustomSelectItem key={ item } value={ item }>
							{ item }
						</CustomSelectItem>
					) ) }
				</Component>
			);

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await user.click( currentSelectedItem );

			// Array containing items to deselect
			const nextSelection = [
				'aurora borealis green',
				'rose blush',
				'incandescent glow',
			];

			// Deselect some items by clicking them to ensure that changes
			// are reflected correctly
			await Promise.all(
				nextSelection.map( async ( value ) => {
					await user.click(
						screen.getByRole( 'option', { name: value } )
					);
					expect(
						screen.getByRole( 'option', {
							name: value,
							selected: false,
						} )
					).toBeVisible();
				} )
			);

			// expect different array length from defaultValues due to deselecting items
			expect( currentSelectedItem ).toHaveTextContent(
				`${
					defaultValues.length - nextSelection.length
				} items selected`
			);
		} );
	} );

	it( 'Should allow rendering a custom value when using `renderSelectedValue`', async () => {
		const user = userEvent.setup();

		const renderValue = ( value: string | string[] ) => {
			return <img src={ `${ value }.jpg` } alt={ value as string } />;
		};

		render(
			<Component label="Rendered" renderSelectedValue={ renderValue }>
				<CustomSelectItem value="april-29">
					{ renderValue( 'april-29' ) }
				</CustomSelectItem>
				<CustomSelectItem value="july-9">
					{ renderValue( 'july-9' ) }
				</CustomSelectItem>
			</Component>
		);

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		expect( currentSelectedItem ).toBeVisible();

		// expect that the initial selection renders an image
		expect( currentSelectedItem ).toContainElement(
			screen.getByRole( 'img', { name: 'april-29' } )
		);

		expect(
			screen.queryByRole( 'img', { name: 'july-9' } )
		).not.toBeInTheDocument();

		await user.click( currentSelectedItem );

		// expect that the other image is only visible after opening popover with options
		expect( screen.getByRole( 'img', { name: 'july-9' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'option', { name: 'july-9' } )
		).toBeVisible();
	} );
} );
