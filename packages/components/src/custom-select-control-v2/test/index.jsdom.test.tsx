/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UncontrolledCustomSelectControlV2 from '..';
import type { CustomSelectProps } from '../types';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const items = [
	{
		key: 'flower1',
		value: 'violets',
	},
	{
		key: 'flower2',
		value: 'crimson clover',
	},
	{
		key: 'flower3',
		value: 'poppy',
	},
	{
		key: 'color1',
		value: 'amber',
	},
	{
		key: 'color2',
		value: 'aquamarine',
	},
];

const defaultProps = {
	label: 'label!',
	children: items.map( ( { value, key } ) => (
		<UncontrolledCustomSelectControlV2.Item value={ value } key={ key } />
	) ),
};

const ControlledCustomSelectControl = ( props: CustomSelectProps ) => {
	const [ value, setValue ] = useState< string | readonly string[] >();
	return (
		<UncontrolledCustomSelectControlV2
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
	[ 'Uncontrolled', UncontrolledCustomSelectControlV2 ],
	[ 'Controlled', ControlledCustomSelectControl ],
] )( 'CustomSelectControlV2 (%s)', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	it( 'Should replace the initial selection when a new item is selected', async () => {
		const user = userEvent.setup();
		await render( <Component { ...defaultProps } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await user.click( currentSelectedItem );

		await user.click(
			screen.getByRole( 'option', {
				name: 'crimson clover',
			} )
		);

		expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );

		await user.click( currentSelectedItem );

		await user.click(
			screen.getByRole( 'option', {
				name: 'poppy',
			} )
		);

		expect( currentSelectedItem ).toHaveTextContent( 'poppy' );
	} );

	it( 'Should keep current selection if dropdown is closed without changing selection', async () => {
		const user = userEvent.setup();
		await render( <Component { ...defaultProps } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await user.tab();
		await user.keyboard( '{Enter}' );
		await expect
			.element(
				page.getByRole( 'listbox', {
					name: defaultProps.label,
				} )
			)
			.toBeVisible();

		await user.keyboard( '{Escape}' );
		await expect
			.element(
				page.getByRole( 'listbox', {
					name: defaultProps.label,
				} )
			)
			.not.toBeInTheDocument();

		expect( currentSelectedItem ).toHaveTextContent( items[ 0 ].value );
	} );

	describe( 'Keyboard behavior and accessibility', () => {
		it( 'Should be able to change selection using keyboard', async () => {
			const user = userEvent.setup();
			await render( <Component { ...defaultProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await user.tab();
			expect( currentSelectedItem ).toHaveFocus();

			await user.keyboard( '{Enter}' );
			expect(
				screen.getByRole( 'listbox', {
					name: defaultProps.label,
				} )
			).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			await user.keyboard( '{Enter}' );

			expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );
		} );

		it( 'Should be able to type characters to select matching options', async () => {
			const user = userEvent.setup();
			await render( <Component { ...defaultProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await user.tab();
			await user.keyboard( '{Enter}' );
			expect(
				screen.getByRole( 'listbox', {
					name: defaultProps.label,
				} )
			).toHaveFocus();

			await user.keyboard( 'a' );
			await user.keyboard( '{Enter}' );
			expect( currentSelectedItem ).toHaveTextContent( 'amber' );
		} );

		it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
			const user = userEvent.setup();
			await render( <Component { ...defaultProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await user.tab();
			expect( currentSelectedItem ).toHaveFocus();
			expect( currentSelectedItem ).toHaveTextContent( 'violets' );

			// Ideally we would test a multi-character typeahead, but anything more than a single character is flaky
			await user.keyboard( 'a' );

			expect(
				screen.queryByRole( 'listbox', {
					name: defaultProps.label,
					hidden: true,
				} )
			).not.toBeInTheDocument();

			await expect
				.element(
					page.getByRole( 'combobox', {
						expanded: false,
					} )
				)
				.toHaveTextContent( 'amber' );
		} );

		it( 'Should have correct aria-selected value for selections', async () => {
			const user = userEvent.setup();
			await render( <Component { ...defaultProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await user.click( currentSelectedItem );

			// assert that first item has aria-selected="true"
			await expect
				.element(
					page.getByRole( 'option', {
						name: 'violets',
						selected: true,
					} )
				)
				.toBeVisible();

			// change the current selection
			await user.click( screen.getByRole( 'option', { name: 'poppy' } ) );

			// click combobox to mount listbox with options again
			await user.click( currentSelectedItem );

			// check that first item is has aria-selected="false" after new selection
			await expect
				.element(
					page.getByRole( 'option', {
						name: 'violets',
						selected: false,
					} )
				)
				.toBeVisible();

			// check that new selected item now has aria-selected="true"
			await expect
				.element(
					page.getByRole( 'option', {
						name: 'poppy',
						selected: true,
					} )
				)
				.toBeVisible();
		} );
	} );

	describe( 'Multiple selection', () => {
		it( 'Should be able to select multiple items when provided an array', async () => {
			const user = userEvent.setup();
			const onChangeMock = vi.fn();

			// initial selection as defaultValue
			const defaultValues = [
				'incandescent glow',
				'ultraviolet morning light',
			];

			await render(
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
						<UncontrolledCustomSelectControlV2.Item
							key={ item }
							value={ item }
						>
							{ item }
						</UncontrolledCustomSelectControlV2.Item>
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
			for ( const value of defaultValues ) {
				await expect
					.element(
						page.getByRole( 'option', {
							name: value,
							selected: true,
						} )
					)
					.toBeVisible();
			}

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

			await expect
				.element(
					page.getByRole( 'option', {
						name: nextSelectionName,
						selected: true,
					} )
				)
				.toBeVisible();

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

			await render(
				<Component defaultValue={ defaultValues } label="Multi-select">
					{ defaultValues.map( ( item ) => (
						<UncontrolledCustomSelectControlV2.Item
							key={ item }
							value={ item }
						>
							{ item }
						</UncontrolledCustomSelectControlV2.Item>
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
			for ( const value of nextSelection ) {
				await user.click( page.getByRole( 'option', { name: value } ) );
				await expect
					.element(
						page.getByRole( 'option', {
							name: value,
							selected: false,
						} )
					)
					.toBeVisible();
			}

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
		const renderValue = ( value: string | readonly string[] ) => {
			return <img src={ `${ value }.jpg` } alt={ value as string } />;
		};

		await render(
			<Component label="Rendered" renderSelectedValue={ renderValue }>
				<UncontrolledCustomSelectControlV2.Item value="april-29">
					{ renderValue( 'april-29' ) }
				</UncontrolledCustomSelectControlV2.Item>
				<UncontrolledCustomSelectControlV2.Item value="july-9">
					{ renderValue( 'july-9' ) }
				</UncontrolledCustomSelectControlV2.Item>
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
		await expect
			.element( page.getByRole( 'img', { name: 'july-9' } ) )
			.toBeVisible();
		await expect
			.element( page.getByRole( 'option', { name: 'july-9' } ) )
			.toBeVisible();
	} );

	it( 'Should open the select popover when focussing the trigger button and pressing arrow down', async () => {
		const user = userEvent.setup();
		await render( <Component { ...defaultProps } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await user.tab();
		expect( currentSelectedItem ).toHaveFocus();
		expect( currentSelectedItem ).toHaveTextContent( items[ 0 ].value );

		await user.keyboard( '{ArrowDown}' );
		await expect
			.element(
				page.getByRole( 'listbox', {
					name: defaultProps.label,
				} )
			)
			.toBeVisible();
	} );

	it( 'Should label the component correctly even when the label is not visible', async () => {
		await render( <Component { ...defaultProps } hideLabelFromVision /> );

		expect(
			screen.getByRole( 'combobox', {
				name: defaultProps.label,
			} )
		).toBeVisible();
	} );
} );
