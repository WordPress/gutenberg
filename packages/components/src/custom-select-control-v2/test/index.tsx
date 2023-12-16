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
import {
	CustomSelect as LegacyCustomSelectControl,
	CustomSelectItem,
} from '..';
import CustomSelect from '../custom-select';

const customClass = 'amber-skies';

const props = {
	label: 'label!',
	options: [
		{
			key: 'flower1',
			name: 'violets',
		},
		{
			key: 'flower2',
			name: 'crimson clover',
			className: customClass,
		},
		{
			key: 'flower3',
			name: 'poppy',
		},
		{
			key: 'color1',
			name: 'amber',
			className: customClass,
		},
		{
			key: 'color2',
			name: 'aquamarine',
			style: {
				backgroundColor: 'rgb(127, 255, 212)',
				rotate: '13deg',
			},
		},
	],
};

// get names from array of objects above
const optionNames = props.options.map( ( { name } ) => name );

const LegacyControlledCustomSelect = ( { options }: any ) => {
	const [ value, setValue ] = useState( options[ 0 ] );
	return (
		<LegacyCustomSelectControl
			{ ...props }
			onChange={ ( { selectedItem }: any ) => setValue( selectedItem ) }
			value={ options.find(
				( option: any ) => option.key === value.key
			) }
		/>
	);
};

const UncontrolledCustomSelect = () => {
	return (
		<CustomSelect label={ props.label }>
			{ optionNames.map( ( option ) => (
				<CustomSelectItem key={ option } value={ option }>
					{ option }
				</CustomSelectItem>
			) ) }
		</CustomSelect>
	);
};

const ControlledCustomSelect = () => {
	const [ value, setValue ] = useState< string | string[] >();
	return (
		<CustomSelect
			label={ props.label }
			onChange={ ( nextValue ) => {
				setValue( nextValue );
			} }
			value={ value }
		>
			{ optionNames.map( ( option ) => (
				<CustomSelectItem key={ option } value={ option }>
					{ option }
				</CustomSelectItem>
			) ) }
		</CustomSelect>
	);
};

describe( 'Legacy tests from CustomSelectControl', () => {
	describe.each( [
		[ 'legacy: uncontrolled', LegacyCustomSelectControl ],
		[ 'legacy: controlled', LegacyControlledCustomSelect ],
		[ 'uncontrolled', UncontrolledCustomSelect ],
		[ 'controlled', ControlledCustomSelect ],
	] )( 'CustomSelect %s', ( ...modeAndComponent ) => {
		const [ mode, Component ] = modeAndComponent;

		it( 'Should replace the initial selection when a new item is selected', async () => {
			const user = userEvent.setup();

			render( <Component { ...props } /> );

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

			render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await user.tab();
			await user.keyboard( '{enter}' );
			expect(
				screen.getByRole( 'listbox', {
					name: 'label!',
				} )
			).toBeVisible();

			await user.keyboard( '{escape}' );
			expect(
				screen.queryByRole( 'listbox', {
					name: 'label!',
				} )
			).not.toBeInTheDocument();

			expect( currentSelectedItem ).toHaveTextContent(
				props.options[ 0 ].name
			);
		} );

		// Test against legacy component only
		// For optional key value pairs of options prop ( style, className, and __experimentalHint )
		if ( mode !== 'uncontrolled' && mode !== 'controlled' ) {
			it( 'Should apply class only to options that have a className defined', async () => {
				const user = userEvent.setup();

				render( <Component { ...props } /> );

				await user.click(
					screen.getByRole( 'combobox', {
						expanded: false,
					} )
				);

				// return an array of items _with_ a className added
				const itemsWithClass = props.options.filter(
					( option ) => option.className !== undefined
				);

				// assert against filtered array
				itemsWithClass.map( ( { name } ) =>
					expect(
						screen.getByRole( 'option', { name } )
					).toHaveClass( customClass )
				);

				// return an array of items _without_ a className added
				const itemsWithoutClass = props.options.filter(
					( option ) => option.className === undefined
				);

				// assert against filtered array
				itemsWithoutClass.map( ( { name } ) =>
					expect(
						screen.getByRole( 'option', { name } )
					).not.toHaveClass( customClass )
				);
			} );

			it( 'Should apply styles only to options that have styles defined', async () => {
				const user = userEvent.setup();
				const customStyles =
					'background-color: rgb(127, 255, 212); rotate: 13deg;';

				render( <Component { ...props } /> );

				await user.click(
					screen.getByRole( 'combobox', {
						expanded: false,
					} )
				);

				// return an array of items _with_ styles added
				const styledItems = props.options.filter(
					( option ) => option.style !== undefined
				);

				// assert against filtered array
				styledItems.map( ( { name } ) =>
					expect(
						screen.getByRole( 'option', { name } )
					).toHaveStyle( customStyles )
				);

				// return an array of items _without_ styles added
				const unstyledItems = props.options.filter(
					( option ) => option.style === undefined
				);

				// assert against filtered array
				unstyledItems.map( ( { name } ) =>
					expect(
						screen.getByRole( 'option', { name } )
					).not.toHaveStyle( customStyles )
				);
			} );

			it( 'does not show selected hint by default', () => {
				render(
					<LegacyCustomSelectControl
						label="Custom select"
						options={ [
							{
								key: 'one',
								name: 'One',
								__experimentalHint: 'Hint',
							},
						] }
					/>
				);
				expect(
					screen.getByRole( 'combobox', { name: 'Custom select' } )
				).not.toHaveTextContent( 'Hint' );
			} );

			it( 'shows selected hint when __experimentalShowSelectedHint is set', async () => {
				const user = userEvent.setup();

				render(
					<LegacyCustomSelectControl
						label="Custom select"
						options={ [
							{
								key: 'one',
								name: 'One',
								__experimentalHint: 'Hint',
							},
						] }
						__experimentalShowSelectedHint
					/>
				);

				await user.click(
					screen.getByRole( 'combobox', { name: 'Custom select' } )
				);

				expect( screen.getByText( 'Hint' ) ).toBeVisible();
			} );
		}

		describe( 'Keyboard behavior and accessibility', () => {
			it( 'Should be able to change selection using keyboard', async () => {
				const user = userEvent.setup();

				render( <Component { ...props } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await user.tab();
				expect( currentSelectedItem ).toHaveFocus();

				await user.keyboard( '{enter}' );
				expect(
					screen.getByRole( 'listbox', {
						name: 'label!',
					} )
				).toHaveFocus();

				await user.keyboard( '{arrowdown}' );
				await user.keyboard( '{enter}' );

				expect( currentSelectedItem ).toHaveTextContent(
					'crimson clover'
				);
			} );

			it( 'Should be able to type characters to select matching options', async () => {
				const user = userEvent.setup();

				render( <Component { ...props } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await user.tab();
				await user.keyboard( '{enter}' );
				expect(
					screen.getByRole( 'listbox', {
						name: 'label!',
					} )
				).toHaveFocus();

				await user.keyboard( '{a}' );
				await user.keyboard( '{enter}' );
				expect( currentSelectedItem ).toHaveTextContent( 'amber' );
			} );

			it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
				const user = userEvent.setup();

				render( <Component { ...props } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await user.tab();
				expect( currentSelectedItem ).toHaveFocus();

				await user.keyboard( '{a}' );
				await user.keyboard( '{q}' );

				expect(
					screen.queryByRole( 'listbox', {
						name: 'label!',
						hidden: true,
					} )
				).not.toBeInTheDocument();

				await user.keyboard( '{enter}' );
				expect( currentSelectedItem ).toHaveTextContent( 'aquamarine' );
			} );

			it( 'Should have correct aria-selected value for selections', async () => {
				const user = userEvent.setup();

				render( <Component { ...props } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await user.click( currentSelectedItem );

				// get all items except for first option
				const unselectedItems = props.options.filter(
					( { name } ) => name !== props.options[ 0 ].name
				);

				// assert that all other items have aria-selected="false"
				unselectedItems.map( ( { name } ) =>
					expect(
						screen.getByRole( 'option', { name, selected: false } )
					).toBeVisible()
				);

				// assert that first item has aria-selected="true"
				expect(
					screen.getByRole( 'option', {
						name: props.options[ 0 ].name,
						selected: true,
					} )
				).toBeVisible();

				// change the current selection
				await user.click(
					screen.getByRole( 'option', { name: 'poppy' } )
				);

				// click combobox to mount listbox with options again
				await user.click( currentSelectedItem );

				// check that first item is has aria-selected="false" after new selection
				expect(
					screen.getByRole( 'option', {
						name: props.options[ 0 ].name,
						selected: false,
					} )
				).toBeVisible();

				// check that new selected item now has aria-selected="true"
				expect(
					screen.getByRole( 'option', {
						name: 'poppy',
						selected: true,
					} )
				).toBeVisible();
			} );
		} );
	} );
} );

describe( 'CustomSelect', () => {
	it( 'Should be able to select multiple items when provided an array', async () => {
		const user = userEvent.setup();

		const defaultValues = [
			'incandescent glow',
			'ultraviolet morning light',
		];

		render(
			<CustomSelect defaultValue={ defaultValues } label="Light">
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

		const currentSelectedItem = screen.getByRole( 'combobox' );

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
			<CustomSelect defaultValue={ defaultValues } label="Light">
				{ defaultValues.map( ( item ) => (
					<CustomSelectItem key={ item } value={ item }>
						{ item }
					</CustomSelectItem>
				) ) }
			</CustomSelect>
		);

		const currentSelectedItem = screen.getByRole( 'combobox' );

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
} );
