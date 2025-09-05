/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { click, press, sleep, type, waitFor } from '@ariakit/test';
import { render } from '@ariakit/test/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import _CustomSelectControl from '..';

const UncontrolledCustomSelectControl = (
	props: React.ComponentProps< typeof _CustomSelectControl >
) => <_CustomSelectControl __next40pxDefaultSize { ...props } />;

const customClassName = 'amber-skies';
const customStyles = {
	backgroundColor: 'rgb(127, 255, 212)',
	rotate: '13deg',
};

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
			className: customClassName,
		},
		{
			key: 'flower3',
			name: 'poppy',
		},
		{
			key: 'color1',
			name: 'amber',
			className: customClassName,
		},
		{
			key: 'color2',
			name: 'aquamarine',
			style: customStyles,
		},
		{
			key: 'color3',
			name: 'tomato (with custom props)',
			className: customClassName,
			style: customStyles,
			// try passing a valid HTML attribute
			'aria-label': 'test label',
			// try adding a custom prop
			customPropFoo: 'foo',
		},
	],
};

const ControlledCustomSelectControl = ( {
	options,
	onChange: onChangeProp,
	...restProps
}: React.ComponentProps< typeof UncontrolledCustomSelectControl > ) => {
	const [ value, setValue ] = useState( restProps.value ?? options[ 0 ] );

	const onChange: typeof onChangeProp = ( changeObject ) => {
		onChangeProp?.( changeObject );
		setValue( changeObject.selectedItem );
	};

	return (
		<UncontrolledCustomSelectControl
			{ ...restProps }
			options={ options }
			onChange={ onChange }
			value={ options.find(
				( option: any ) => option.key === value.key
			) }
		/>
	);
};

it( 'Should apply external controlled updates', async () => {
	const mockOnChange = jest.fn();
	const { rerender } = await render(
		<UncontrolledCustomSelectControl
			{ ...props }
			value={ props.options[ 0 ] }
			onChange={ mockOnChange }
		/>
	);

	const currentSelectedItem = screen.getByRole( 'combobox', {
		expanded: false,
	} );

	expect( currentSelectedItem ).toHaveTextContent( props.options[ 0 ].name );

	expect( mockOnChange ).not.toHaveBeenCalled();

	await rerender(
		<UncontrolledCustomSelectControl
			{ ...props }
			value={ props.options[ 1 ] }
		/>
	);

	expect( currentSelectedItem ).toHaveTextContent( props.options[ 1 ].name );

	// Necessary to wait for onChange to potentially fire
	await sleep();

	expect( mockOnChange ).not.toHaveBeenCalled();
} );

describe.each( [
	[ 'Uncontrolled', UncontrolledCustomSelectControl ],
	[ 'Controlled', ControlledCustomSelectControl ],
] )( 'CustomSelectControl (%s)', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	it( 'Should select the first option when no explicit initial value is passed without firing onChange', async () => {
		const mockOnChange = jest.fn();
		await render( <Component { ...props } onChange={ mockOnChange } /> );

		expect(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		).toHaveTextContent( props.options[ 0 ].name );

		// Necessary to wait for onChange to potentially fire
		await sleep();

		expect( mockOnChange ).not.toHaveBeenCalled();
	} );

	it( 'Should pick the initially selected option if the value prop is passed without firing onChange', async () => {
		const mockOnChange = jest.fn();
		await render(
			<Component
				{ ...props }
				onChange={ mockOnChange }
				value={ props.options[ 3 ] }
			/>
		);

		expect(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		).toHaveTextContent( props.options[ 3 ].name );

		// Necessary to wait for onChange to potentially fire
		await sleep();

		expect( mockOnChange ).not.toHaveBeenCalled();
	} );

	it( 'Should replace the initial selection when a new item is selected', async () => {
		await render( <Component { ...props } /> );

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
		await render( <Component { ...props } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await press.Tab();
		await press.Enter();
		expect(
			screen.getByRole( 'listbox', {
				name: props.label,
			} )
		).toBeVisible();

		await press.Escape();
		expect(
			screen.queryByRole( 'listbox', {
				name: props.label,
			} )
		).not.toBeInTheDocument();

		expect( currentSelectedItem ).toHaveTextContent(
			props.options[ 0 ].name
		);
	} );

	it( 'Should apply class only to options that have a className defined', async () => {
		await render( <Component { ...props } /> );

		await click(
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
			expect( screen.getByRole( 'option', { name } ) ).toHaveClass(
				customClassName
			)
		);

		// return an array of items _without_ a className added
		const itemsWithoutClass = props.options.filter(
			( option ) => option.className === undefined
		);

		// assert against filtered array
		itemsWithoutClass.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).not.toHaveClass(
				customClassName
			)
		);
	} );

	it( 'Should apply styles only to options that have styles defined', async () => {
		await render( <Component { ...props } /> );

		await click(
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
			expect( screen.getByRole( 'option', { name } ) ).toHaveStyle(
				customStyles
			)
		);

		// return an array of items _without_ styles added
		const unstyledItems = props.options.filter(
			( option ) => option.style === undefined
		);

		// assert against filtered array
		unstyledItems.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).not.toHaveStyle(
				customStyles
			)
		);
	} );

	it( 'does not show selected hint by default', async () => {
		await render(
			<Component
				{ ...props }
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						hint: 'Hint',
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

	it( 'shows selected hint when showSelectedHint is set', async () => {
		await render(
			<Component
				{ ...props }
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						hint: 'Hint',
					},
				] }
				showSelectedHint
			/>
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'combobox', {
					expanded: false,
				} )
			).toHaveTextContent( 'Hint' )
		);
	} );

	it( 'shows selected hint in list of options when added, regardless of showSelectedHint prop', async () => {
		await render(
			<Component
				{ ...props }
				label="Custom select"
				options={ [
					{
						key: 'one',
						name: 'One',
						hint: 'Hint',
					},
				] }
			/>
		);

		await click(
			screen.getByRole( 'combobox', { name: 'Custom select' } )
		);

		expect( screen.getByRole( 'option', { name: /hint/i } ) ).toBeVisible();
	} );

	it( 'Should return object onChange', async () => {
		const mockOnChange = jest.fn();

		await render( <Component { ...props } onChange={ mockOnChange } /> );

		await click(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		);

		await click(
			screen.getByRole( 'option', {
				name: 'aquamarine',
			} )
		);

		expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
		expect( mockOnChange ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				inputValue: '',
				isOpen: false,
				selectedItem: expect.objectContaining( {
					name: 'aquamarine',
				} ),
				type: expect.any( String ),
			} )
		);
	} );

	it( 'Should return selectedItem object when specified onChange', async () => {
		const mockOnChange = jest.fn();

		await render( <Component { ...props } onChange={ mockOnChange } /> );

		await press.Tab();
		expect(
			screen.getByRole( 'combobox', {
				expanded: false,
			} )
		).toHaveFocus();

		await type( 'p' );
		await press.Enter();

		expect( mockOnChange ).toHaveBeenCalledTimes( 1 );
		expect( mockOnChange ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				selectedItem: expect.objectContaining( {
					key: 'flower3',
					name: 'poppy',
				} ),
			} )
		);
	} );

	it( "Should pass arbitrary props to onChange's selectedItem, but apply only style and className to DOM elements", async () => {
		const onChangeMock = jest.fn();

		await render( <Component { ...props } onChange={ onChangeMock } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

		await click( currentSelectedItem );

		const optionWithCustomAttributes = screen.getByRole( 'option', {
			name: 'tomato (with custom props)',
		} );

		// Assert that the option element does not have the custom attributes
		expect( optionWithCustomAttributes ).not.toHaveAttribute(
			'customPropFoo'
		);
		expect( optionWithCustomAttributes ).not.toHaveAttribute(
			'aria-label'
		);

		await click( optionWithCustomAttributes );

		expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
		expect( onChangeMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				selectedItem: expect.objectContaining( {
					key: 'color3',
					name: 'tomato (with custom props)',
					className: customClassName,
					style: customStyles,
					'aria-label': 'test label',
					customPropFoo: 'foo',
				} ),
			} )
		);
	} );

	it( 'Should label the component correctly even when the label is not visible', async () => {
		await render( <Component { ...props } hideLabelFromVision /> );

		expect(
			screen.getByRole( 'combobox', {
				name: props.label,
			} )
		).toBeVisible();
	} );

	describe( 'Keyboard behavior and accessibility', () => {
		it( 'Captures the keypress event and does not let it propagate', async () => {
			const onKeyDown = jest.fn();

			await render(
				<div
					// This role="none" is required to prevent an eslint warning about accessibility.
					role="none"
					onKeyDown={ onKeyDown }
				>
					<Component { ...props } />
				</div>
			);
			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );
			await click( currentSelectedItem );

			const customSelect = screen.getByRole( 'listbox', {
				name: props.label,
			} );
			expect( customSelect ).toHaveFocus();
			await press.Enter();

			expect( onKeyDown ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'Should be able to change selection using keyboard', async () => {
			await render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await press.Tab();
			expect( currentSelectedItem ).toHaveFocus();

			await press.Enter();
			expect(
				screen.getByRole( 'listbox', {
					name: props.label,
				} )
			).toHaveFocus();

			await press.ArrowDown();
			await press.Enter();

			expect( currentSelectedItem ).toHaveTextContent(
				props.options[ 1 ].name
			);
		} );

		it( 'Should be able to type characters to select matching options', async () => {
			await render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await press.Tab();
			await press.Enter();
			expect(
				screen.getByRole( 'listbox', {
					name: props.label,
				} )
			).toHaveFocus();

			await type( 'a' );
			await press.Enter();
			expect( currentSelectedItem ).toHaveTextContent( 'amber' );
		} );

		it( 'Can change selection with a focused input and closed dropdown if typed characters match an option', async () => {
			await render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await press.Tab();
			expect( currentSelectedItem ).toHaveFocus();
			expect( currentSelectedItem ).toHaveTextContent(
				props.options[ 0 ].name
			);

			// Ideally we would test a multi-character typeahead, but anything more than a single character is flaky
			await type( 'a' );

			expect(
				screen.queryByRole( 'listbox', {
					name: props.label,
					hidden: true,
				} )
			).not.toBeInTheDocument();

			// This Enter is a workaround for flakiness, and shouldn't be necessary in an actual browser
			await press.Enter();

			expect( currentSelectedItem ).toHaveTextContent( 'amber' );
		} );

		it( 'Can change selection with a focused input and closed dropdown while pressing arrow keys', async () => {
			await render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await press.Tab();
			expect( currentSelectedItem ).toHaveFocus();
			expect( currentSelectedItem ).toHaveTextContent(
				props.options[ 0 ].name
			);

			await press.ArrowDown();
			await press.ArrowDown();
			expect(
				screen.queryByRole( 'listbox', {
					name: props.label,
				} )
			).not.toBeInTheDocument();

			expect( currentSelectedItem ).toHaveTextContent(
				props.options[ 2 ].name
			);
		} );

		it( 'Should have correct aria-selected value for selections', async () => {
			await render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await click( currentSelectedItem );

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
			await click( screen.getByRole( 'option', { name: 'poppy' } ) );

			// click combobox to mount listbox with options again
			await click( currentSelectedItem );

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

		it( 'Should call custom event handlers', async () => {
			const onFocusMock = jest.fn();
			const onBlurMock = jest.fn();

			await render(
				<>
					<Component
						{ ...props }
						onFocus={ onFocusMock }
						onBlur={ onBlurMock }
					/>
					<button>Focus stop</button>
				</>
			);

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

			await press.Tab();

			expect( currentSelectedItem ).toHaveFocus();
			expect( onFocusMock ).toHaveBeenCalledTimes( 1 );

			await press.Tab();
			expect( currentSelectedItem ).not.toHaveFocus();
			expect( onBlurMock ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should render the describedBy text when specified', async () => {
			const describedByText = 'My description.';

			await render(
				<Component { ...props } describedBy={ describedByText } />
			);

			expect(
				screen.getByRole( 'combobox' )
			).toHaveAccessibleDescription( describedByText );
		} );

		it( 'should render the default ARIA description when describedBy is not specified', async () => {
			await render( <Component { ...props } /> );

			expect(
				screen.getByRole( 'combobox' )
			).toHaveAccessibleDescription(
				`Currently selected: ${ props.options[ 0 ].name }`
			);
		} );
	} );
} );

describe( 'Type checking', () => {
	// eslint-disable-next-line jest/expect-expect
	it( 'should infer the value type from available `options`, but not the `value` or `onChange` prop', () => {
		const options = [
			{
				key: 'narrow',
				name: 'Narrow',
			},
			{
				key: 'value',
				name: 'Value',
			},
		];
		const optionsReadOnly = [
			{
				key: 'narrow',
				name: 'Narrow',
			},
			{
				key: 'value',
				name: 'Value',
			},
		] as const;

		const onChange = (): void => {};

		<_CustomSelectControl
			label="Label"
			options={ options }
			value={ {
				key: 'narrow',
				name: 'Narrow',
			} }
			onChange={ onChange }
		/>;

		<_CustomSelectControl
			label="Label"
			options={ options }
			value={ {
				key: 'random string is also accepted for non-readonly options',
				name: 'Narrow',
			} }
			onChange={ onChange }
		/>;

		<_CustomSelectControl
			label="Label"
			options={ options }
			value={ {
				key: 'narrow',
				name: 'Narrow',
				// @ts-expect-error: the option type should not be inferred from `value`
				foo: 'foo',
			} }
			onChange={ onChange }
		/>;

		<_CustomSelectControl
			label="Label"
			options={ options }
			value={ {
				key: 'narrow',
				name: 'Narrow',
			} }
			// To ensure the type inferring is working correctly, but this is not a common use case.
			// @ts-expect-error: the option type should not be inferred from `onChange`
			onChange={
				onChange as ( obj: {
					selectedItem: { key: string; name: string; foo: string };
				} ) => void
			}
		/>;

		<_CustomSelectControl
			label="Label"
			options={ optionsReadOnly }
			value={ {
				key: 'narrow',
				name: 'Narrow',
			} }
			onChange={ onChange }
		/>;

		<_CustomSelectControl
			label="Label"
			options={ optionsReadOnly }
			value={ {
				// @ts-expect-error: random string is not accepted for immutable options
				key: 'random string is not accepted for readonly options',
				name: 'Narrow',
			} }
			onChange={ onChange }
		/>;

		<_CustomSelectControl
			label="Label"
			options={ optionsReadOnly }
			value={ {
				key: 'narrow',
				name: 'Narrow',
				// @ts-expect-error: the option type should not be inferred from `value`
				foo: 'foo',
			} }
			onChange={ onChange }
		/>;

		<_CustomSelectControl
			label="Label"
			options={ optionsReadOnly }
			value={ {
				key: 'narrow',
				name: 'Narrow',
			} }
			// To ensure the type inferring is working correctly, but this is not a common use case.
			// @ts-expect-error: the option type should not be inferred from `onChange`
			onChange={
				onChange as ( obj: {
					selectedItem: { key: string; name: string; foo: string };
				} ) => void
			}
		/>;
	} );
} );
