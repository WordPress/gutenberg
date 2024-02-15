/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click, press, sleep, type, waitFor } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelect as UncontrolledCustomSelect, CustomSelectItem } from '..';
import type { CustomSelectProps, LegacyCustomSelectProps } from '../types';

const customClass = 'amber-skies';

const legacyProps = {
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

const LegacyControlledCustomSelect = ( {
	options,
	onChange,
	...restProps
}: LegacyCustomSelectProps ) => {
	const [ value, setValue ] = useState( options[ 0 ] );
	return (
		<UncontrolledCustomSelect
			{ ...restProps }
			options={ options }
			onChange={ ( args: any ) => {
				onChange?.( args );
				setValue( args.selectedItem );
			} }
			value={ options.find(
				( option: any ) => option.key === value.key
			) }
		/>
	);
};

describe( 'With Legacy Props', () => {
	describe.each( [
		[ 'Uncontrolled', UncontrolledCustomSelect ],
		[ 'Controlled', LegacyControlledCustomSelect ],
	] )( '%s', ( ...modeAndComponent ) => {
		const [ , Component ] = modeAndComponent;

		it( 'Should replace the initial selection when a new item is selected', async () => {
			render( <Component { ...legacyProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await click( currentSelectedItem );

			await click(
				screen.getByRole( 'option', {
					name: 'crimson clover',
				} )
			);

			expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );

			await click( currentSelectedItem );

			await click(
				screen.getByRole( 'option', {
					name: 'poppy',
				} )
			);

			expect( currentSelectedItem ).toHaveTextContent( 'poppy' );
		} );

		it( 'Should keep current selection if dropdown is closed without changing selection', async () => {
			render( <Component { ...legacyProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await sleep();
			await press.Tab();
			await press.Enter();
			expect(
				screen.getByRole( 'listbox', {
					name: 'label!',
				} )
			).toBeVisible();

			await press.Escape();
			expect(
				screen.queryByRole( 'listbox', {
					name: 'label!',
				} )
			).not.toBeInTheDocument();

			expect( currentSelectedItem ).toHaveTextContent(
				legacyProps.options[ 0 ].name
			);
		} );

		it( 'Should apply class only to options that have a className defined', async () => {
			render( <Component { ...legacyProps } /> );

			await click(
				screen.getByRole( 'combobox', {
					expanded: false,
				} )
			);

			// return an array of items _with_ a className added
			const itemsWithClass = legacyProps.options.filter(
				( option ) => option.className !== undefined
			);

			// assert against filtered array
			itemsWithClass.map( ( { name } ) =>
				expect( screen.getByRole( 'option', { name } ) ).toHaveClass(
					customClass
				)
			);

			// return an array of items _without_ a className added
			const itemsWithoutClass = legacyProps.options.filter(
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
			const customStyles =
				'background-color: rgb(127, 255, 212); rotate: 13deg;';

			render( <Component { ...legacyProps } /> );

			await click(
				screen.getByRole( 'combobox', {
					expanded: false,
				} )
			);

			// return an array of items _with_ styles added
			const styledItems = legacyProps.options.filter(
				( option ) => option.style !== undefined
			);

			// assert against filtered array
			styledItems.map( ( { name } ) =>
				expect( screen.getByRole( 'option', { name } ) ).toHaveStyle(
					customStyles
				)
			);

			// return an array of items _without_ styles added
			const unstyledItems = legacyProps.options.filter(
				( option ) => option.style === undefined
			);

			// assert against filtered array
			unstyledItems.map( ( { name } ) =>
				expect(
					screen.getByRole( 'option', { name } )
				).not.toHaveStyle( customStyles )
			);
		} );

		it( 'does not show selected hint by default', async () => {
			render(
				<Component
					{ ...legacyProps }
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
			await waitFor( () =>
				expect(
					screen.getByRole( 'combobox', { name: 'Custom select' } )
				).not.toHaveTextContent( 'Hint' )
			);
		} );

		it( 'shows selected hint when __experimentalShowSelectedHint is set', async () => {
			render(
				<Component
					{ ...legacyProps }
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

			await waitFor( () =>
				expect(
					screen.getByRole( 'combobox', {
						expanded: false,
					} )
				).toHaveTextContent( /hint/i )
			);
		} );

		it( 'shows selected hint in list of options when added', async () => {
			render(
				<Component
					{ ...legacyProps }
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

			await click(
				screen.getByRole( 'combobox', { name: 'Custom select' } )
			);

			expect(
				screen.getByRole( 'option', { name: /hint/i } )
			).toBeVisible();
		} );

		it( 'Should return object onChange', async () => {
			const mockOnChange = jest.fn();

			render(
				<Component { ...legacyProps } onChange={ mockOnChange } />
			);

			await click(
				screen.getByRole( 'combobox', {
					expanded: false,
				} )
			);

			expect( mockOnChange ).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining( {
					inputValue: '',
					isOpen: false,
					selectedItem: { key: 'violets', name: 'violets' },
					type: '',
				} )
			);

			await click(
				screen.getByRole( 'option', {
					name: 'aquamarine',
				} )
			);

			expect( mockOnChange ).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining( {
					inputValue: '',
					isOpen: false,
					selectedItem: expect.objectContaining( {
						name: 'aquamarine',
					} ),
					type: '',
				} )
			);
		} );

		it( 'Should return selectedItem object when specified onChange', async () => {
			const mockOnChange = jest.fn(
				( { selectedItem } ) => selectedItem.key
			);

			render(
				<Component { ...legacyProps } onChange={ mockOnChange } />
			);

			await sleep();
			await press.Tab();
			expect(
				screen.getByRole( 'combobox', {
					expanded: false,
				} )
			).toHaveFocus();

			await type( 'p' );
			await press.Enter();

			expect( mockOnChange ).toHaveReturnedWith( 'poppy' );
		} );

		describe( 'Keyboard behavior and accessibility', () => {
			it( 'Should be able to change selection using keyboard', async () => {
				render( <Component { ...legacyProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await sleep();
				await press.Tab();
				expect( currentSelectedItem ).toHaveFocus();

				await press.Enter();
				expect(
					screen.getByRole( 'listbox', {
						name: 'label!',
					} )
				).toHaveFocus();

				await press.ArrowDown();
				await press.Enter();

				expect( currentSelectedItem ).toHaveTextContent(
					'crimson clover'
				);
			} );

			it( 'Should be able to type characters to select matching options', async () => {
				render( <Component { ...legacyProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await sleep();
				await press.Tab();
				await press.Enter();
				expect(
					screen.getByRole( 'listbox', {
						name: 'label!',
					} )
				).toHaveFocus();

				await type( 'a' );
				await press.Enter();
				expect( currentSelectedItem ).toHaveTextContent( 'amber' );
			} );

			it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
				render( <Component { ...legacyProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await sleep();
				await press.Tab();
				expect( currentSelectedItem ).toHaveFocus();

				await type( 'aq' );

				expect(
					screen.queryByRole( 'listbox', {
						name: 'label!',
						hidden: true,
					} )
				).not.toBeInTheDocument();

				await press.Enter();
				expect( currentSelectedItem ).toHaveTextContent( 'aquamarine' );
			} );

			it( 'Should have correct aria-selected value for selections', async () => {
				render( <Component { ...legacyProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await click( currentSelectedItem );

				// get all items except for first option
				const unselectedItems = legacyProps.options.filter(
					( { name } ) => name !== legacyProps.options[ 0 ].name
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
						name: legacyProps.options[ 0 ].name,
						selected: true,
					} )
				).toBeVisible();

				// change the current selection
				await click( screen.getByRole( 'option', { name: 'poppy' } ) );

				// click combobox to mount listbox with options again
				await click( currentSelectedItem );

				// check that first item is has aria-selected="false" after new selection
				expect(
					screen.getByRole( 'option', {
						name: legacyProps.options[ 0 ].name,
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

describe( 'static typing', () => {
	<>
		{ /* @ts-expect-error - when `options` prop is passed, `onChange` should have legacy signature */ }
		<UncontrolledCustomSelect
			label="foo"
			options={ [] }
			onChange={ ( _: string | string[] ) => undefined }
		/>
		<UncontrolledCustomSelect
			label="foo"
			options={ [] }
			onChange={ ( _: { selectedItem: unknown } ) => undefined }
		/>
		<UncontrolledCustomSelect
			label="foo"
			onChange={ ( _: string | string[] ) => undefined }
		>
			foobar
		</UncontrolledCustomSelect>
		{ /* @ts-expect-error - when `children` are passed, `onChange` should have new default signature */ }
		<UncontrolledCustomSelect
			label="foo"
			onChange={ ( _: { selectedItem: unknown } ) => undefined }
		>
			foobar
		</UncontrolledCustomSelect>
	</>;
} );

const defaultProps = {
	label: 'label!',
	children: legacyProps.options.map( ( { name, key } ) => (
		<CustomSelectItem value={ name } key={ key } />
	) ),
};

const ControlledCustomSelect = ( props: CustomSelectProps ) => {
	const [ value, setValue ] = useState< string | string[] >();
	return (
		<UncontrolledCustomSelect
			{ ...props }
			onChange={ ( nextValue: string | string[] ) => {
				setValue( nextValue );
				props.onChange?.( nextValue );
			} }
			value={ value }
		/>
	);
};

describe( 'With Default Props', () => {
	describe.each( [
		[ 'Uncontrolled', UncontrolledCustomSelect ],
		[ 'Controlled', ControlledCustomSelect ],
	] )( '%s', ( ...modeAndComponent ) => {
		const [ , Component ] = modeAndComponent;

		it( 'Should replace the initial selection when a new item is selected', async () => {
			render( <Component { ...defaultProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await click( currentSelectedItem );

			await click(
				screen.getByRole( 'option', {
					name: 'crimson clover',
				} )
			);

			expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );

			await click( currentSelectedItem );

			await click(
				screen.getByRole( 'option', {
					name: 'poppy',
				} )
			);

			expect( currentSelectedItem ).toHaveTextContent( 'poppy' );
		} );

		it( 'Should keep current selection if dropdown is closed without changing selection', async () => {
			render( <Component { ...defaultProps } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await sleep();
			await press.Tab();
			await press.Enter();
			expect(
				screen.getByRole( 'listbox', {
					name: 'label!',
				} )
			).toBeVisible();

			await press.Escape();
			expect(
				screen.queryByRole( 'listbox', {
					name: 'label!',
				} )
			).not.toBeInTheDocument();

			expect( currentSelectedItem ).toHaveTextContent(
				legacyProps.options[ 0 ].name
			);
		} );

		describe( 'Keyboard behavior and accessibility', () => {
			it( 'Should be able to change selection using keyboard', async () => {
				render( <Component { ...defaultProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await sleep();
				await press.Tab();
				expect( currentSelectedItem ).toHaveFocus();

				await press.Enter();
				expect(
					screen.getByRole( 'listbox', {
						name: 'label!',
					} )
				).toHaveFocus();

				await press.ArrowDown();
				await press.Enter();

				expect( currentSelectedItem ).toHaveTextContent(
					'crimson clover'
				);
			} );

			it( 'Should be able to type characters to select matching options', async () => {
				render( <Component { ...defaultProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await sleep();
				await press.Tab();
				await press.Enter();
				expect(
					screen.getByRole( 'listbox', {
						name: 'label!',
					} )
				).toHaveFocus();

				await type( 'a' );
				await press.Enter();
				expect( currentSelectedItem ).toHaveTextContent( 'amber' );
			} );

			it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
				render( <Component { ...defaultProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await sleep();
				await press.Tab();
				expect( currentSelectedItem ).toHaveFocus();

				await type( 'aq' );

				expect(
					screen.queryByRole( 'listbox', {
						name: 'label!',
						hidden: true,
					} )
				).not.toBeInTheDocument();

				await press.Enter();
				expect( currentSelectedItem ).toHaveTextContent( 'aquamarine' );
			} );

			it( 'Should have correct aria-selected value for selections', async () => {
				render( <Component { ...defaultProps } /> );

				const currentSelectedItem = screen.getByRole( 'combobox', {
					expanded: false,
				} );

				await click( currentSelectedItem );

				// assert that first item has aria-selected="true"
				expect(
					screen.getByRole( 'option', {
						name: 'violets',
						selected: true,
					} )
				).toBeVisible();

				// change the current selection
				await click( screen.getByRole( 'option', { name: 'poppy' } ) );

				// click combobox to mount listbox with options again
				await click( currentSelectedItem );

				// check that first item is has aria-selected="false" after new selection
				expect(
					screen.getByRole( 'option', {
						name: 'violets',
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

		describe( 'Multiple selection', () => {
			it( 'Should be able to select multiple items when provided an array', async () => {
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

				await click( currentSelectedItem );

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
				await click( nextSelection );

				// updated array containing defaultValues + the item just selected
				const updatedSelection =
					defaultValues.concat( nextSelectionName );

				expect( onChangeMock ).toHaveBeenCalledWith( updatedSelection );

				expect( nextSelection ).toHaveAttribute( 'aria-selected' );

				// expect increased array length for current selection
				expect( currentSelectedItem ).toHaveTextContent(
					`${ updatedSelection.length } items selected`
				);
			} );

			it( 'Should be able to deselect items when provided an array', async () => {
				// initial selection as defaultValue
				const defaultValues = [
					'aurora borealis green',
					'incandescent glow',
					'key lime green',
					'rose blush',
					'ultraviolet morning light',
				];

				render(
					<Component
						defaultValue={ defaultValues }
						label="Multi-select"
					>
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

				await click( currentSelectedItem );

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
						await click(
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

			await click( currentSelectedItem );

			// expect that the other image is only visible after opening popover with options
			expect(
				screen.getByRole( 'img', { name: 'july-9' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'option', { name: 'july-9' } )
			).toBeVisible();
		} );
	} );
} );
