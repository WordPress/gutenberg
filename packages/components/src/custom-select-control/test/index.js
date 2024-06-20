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
import UncontrolledCustomSelectControl from '..';

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
	],
};

const ControlledCustomSelectControl = ( {
	options,
	onChange: onChangeProp,
	...restProps
} ) => {
	const [ value, setValue ] = useState( options[ 0 ] );

	const onChange = ( changeObject ) => {
		onChangeProp?.( changeObject );
		setValue( changeObject.selectedItem );
	};

	return (
		<UncontrolledCustomSelectControl
			{ ...restProps }
			options={ options }
			onChange={ onChange }
			value={ options.find( ( option ) => option.key === value.key ) }
		/>
	);
};

describe.each( [
	[ 'uncontrolled', UncontrolledCustomSelectControl ],
	[ 'controlled', ControlledCustomSelectControl ],
] )( 'CustomSelectControl %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	it( 'Should replace the initial selection when a new item is selected', async () => {
		const user = userEvent.setup();

		render( <Component { ...props } /> );

		const currentSelectedItem = screen.getByRole( 'button', {
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

		const currentSelectedItem = screen.getByRole( 'button', {
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

	it( 'Should apply class only to options that have a className defined', async () => {
		const user = userEvent.setup();

		render( <Component { ...props } /> );

		await user.click(
			screen.getByRole( 'button', {
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
		const user = userEvent.setup();

		render( <Component { ...props } /> );

		await user.click(
			screen.getByRole( 'button', {
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
			<Component
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
			screen.getByRole( 'button', { name: 'Custom select' } )
		).not.toHaveTextContent( 'Hint' );
	} );

	it( 'shows selected hint when __experimentalShowSelectedHint is set', () => {
		render(
			<Component
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
		expect(
			screen.getByRole( 'button', { name: 'Custom select' } )
		).toHaveTextContent( 'Hint' );
	} );

	it( 'shows selected hint in list of options when added, regardless of __experimentalShowSelectedHint prop', async () => {
		const user = userEvent.setup();

		render(
			<Component
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

		await user.click(
			screen.getByRole( 'button', { name: 'Custom select' } )
		);

		expect( screen.getByRole( 'option', { name: /hint/i } ) ).toBeVisible();
	} );

	it( 'Should return object onChange', async () => {
		const user = userEvent.setup();
		const mockOnChange = jest.fn();

		render(
			<Component
				{ ...props }
				value={ props.options[ 0 ] }
				onChange={ mockOnChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
			} )
		);

		// DIFFERENCE WITH V2: NOT CALLED
		// expect( mockOnChange ).toHaveBeenNthCalledWith(
		// 	1,
		// 	expect.objectContaining( {
		// 		inputValue: '',
		// 		isOpen: false,
		// 		selectedItem: { key: 'flower1', name: 'violets' },
		// 		type: '',
		// 	} )
		// );

		await user.click(
			screen.getByRole( 'option', {
				name: 'aquamarine',
			} )
		);

		expect( mockOnChange ).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining( {
				inputValue: '',
				isOpen: false,
				selectedItem: expect.objectContaining( {
					name: 'aquamarine',
				} ),
				type: '__item_click__',
			} )
		);
	} );

	it( 'Should return selectedItem object when specified onChange', async () => {
		const user = userEvent.setup();
		const mockOnChange = jest.fn();

		render( <Component { ...props } onChange={ mockOnChange } /> );

		await user.tab();
		expect(
			screen.getByRole( 'button', {
				expanded: false,
			} )
		).toHaveFocus();

		await user.keyboard( 'p' );
		await user.keyboard( '{enter}' );

		expect( mockOnChange ).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining( {
				selectedItem: expect.objectContaining( {
					key: 'flower3',
					name: 'poppy',
				} ),
			} )
		);
	} );

	describe( 'Keyboard behavior and accessibility', () => {
		it( 'Captures the keypress event and does not let it propagate', async () => {
			const user = userEvent.setup();
			const onKeyDown = jest.fn();

			render(
				<div
					// This role="none" is required to prevent an eslint warning about accessibility.
					role="none"
					onKeyDown={ onKeyDown }
				>
					<Component { ...props } />
				</div>
			);
			const currentSelectedItem = screen.getByRole( 'button', {
				expanded: false,
			} );
			await user.click( currentSelectedItem );

			const customSelect = screen.getByRole( 'listbox', {
				name: 'label!',
			} );
			await user.type( customSelect, '{enter}' );

			expect( onKeyDown ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'Should be able to change selection using keyboard', async () => {
			const user = userEvent.setup();

			render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'button', {
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

			expect( currentSelectedItem ).toHaveTextContent( 'crimson clover' );
		} );

		it( 'Should be able to type characters to select matching options', async () => {
			const user = userEvent.setup();

			render( <Component { ...props } /> );

			const currentSelectedItem = screen.getByRole( 'button', {
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

			const currentSelectedItem = screen.getByRole( 'button', {
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

			const currentSelectedItem = screen.getByRole( 'button', {
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
			await user.click( screen.getByRole( 'option', { name: 'poppy' } ) );

			// click button to mount listbox with options again
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

		it( 'Should call custom event handlers', async () => {
			const user = userEvent.setup();
			const onFocusMock = jest.fn();
			const onBlurMock = jest.fn();

			render(
				<>
					<Component
						{ ...props }
						onFocus={ onFocusMock }
						onBlur={ onBlurMock }
					/>
					<button>Focus stop</button>
				</>
			);

			const currentSelectedItem = screen.getByRole( 'button', {
				expanded: false,
			} );

			await user.tab();

			expect( currentSelectedItem ).toHaveFocus();
			expect( onFocusMock ).toHaveBeenCalledTimes( 1 );

			await user.tab();
			expect( currentSelectedItem ).not.toHaveFocus();
			expect( onBlurMock ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
