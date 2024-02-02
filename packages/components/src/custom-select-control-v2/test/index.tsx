/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click, press, type } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelect } from '..';

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

const ControlledCustomSelect = ( { options }: any ) => {
	const [ value, setValue ] = useState( options[ 0 ] );
	return (
		<CustomSelect
			{ ...props }
			onChange={ ( { selectedItem }: any ) => setValue( selectedItem ) }
			value={ options.find(
				( option: any ) => option.key === value.key
			) }
		/>
	);
};

describe.each( [
	[ 'uncontrolled', CustomSelect ],
	[ 'controlled', ControlledCustomSelect ],
] )( 'CustomSelect %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	it( 'Should replace the initial selection when a new item is selected', async () => {
		render( <Component { ...props } /> );

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
		render( <CustomSelect { ...props } /> );

		const currentSelectedItem = screen.getByRole( 'combobox', {
			expanded: false,
		} );

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
			props.options[ 0 ].name
		);
	} );

	it( 'Should apply class only to options that have a className defined', async () => {
		render( <CustomSelect { ...props } /> );

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
				customClass
			)
		);

		// return an array of items _without_ a className added
		const itemsWithoutClass = props.options.filter(
			( option ) => option.className === undefined
		);

		// assert against filtered array
		itemsWithoutClass.map( ( { name } ) =>
			expect( screen.getByRole( 'option', { name } ) ).not.toHaveClass(
				customClass
			)
		);
	} );

	it( 'Should apply styles only to options that have styles defined', async () => {
		const customStyles =
			'background-color: rgb(127, 255, 212); rotate: 13deg;';

		render( <CustomSelect { ...props } /> );

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

	it( 'does not show selected hint by default', () => {
		render(
			<CustomSelect
				{ ...props }
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
		render(
			<CustomSelect
				{ ...props }
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

		expect( screen.getByText( /hint/i ) ).toBeVisible();
	} );

	it( 'shows selected hint in list of options when added', async () => {
		render(
			<CustomSelect
				{ ...props }
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

		expect( screen.getByRole( 'option', { name: /hint/i } ) ).toBeVisible();
	} );

	it( 'Should return object onChange', async () => {
		const mockOnChange = jest.fn();

		render( <CustomSelect { ...props } onChange={ mockOnChange } /> );

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

		render( <CustomSelect { ...props } onChange={ mockOnChange } /> );

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
			render( <CustomSelect { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

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

			expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );
		} );

		it( 'Should be able to type characters to select matching options', async () => {
			render( <CustomSelect { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

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
			render( <CustomSelect { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'combobox', {
				expanded: false,
			} );

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
			render( <CustomSelect { ...props } /> );

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
	} );
} );

describe( 'static typing', () => {
	<>
		{ /* @ts-expect-error - when `options` prop is passed, `onChange` should have legacy signature */ }
		<CustomSelect
			label="foo"
			options={ [] }
			onChange={ ( _: string | string[] ) => undefined }
		/>
		<CustomSelect
			label="foo"
			options={ [] }
			onChange={ ( _: { selectedItem: unknown } ) => undefined }
		/>
		<CustomSelect
			label="foo"
			onChange={ ( _: string | string[] ) => undefined }
		>
			foobar
		</CustomSelect>
		{ /* @ts-expect-error - when `children` are passed, `onChange` should have new default signature */ }
		<CustomSelect
			label="foo"
			onChange={ ( _: { selectedItem: unknown } ) => undefined }
		>
			foobar
		</CustomSelect>
	</>;
} );
