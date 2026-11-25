import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { Dialog } from '@wordpress/ui';
import _ComboboxControl from '..';
import Dropdown from '../../dropdown';
import Modal from '../../modal';
import type { ComboboxControlOption, ComboboxControlProps } from '../types';

globalThis.wpVitest.mockCSSSupports();

globalThis.wpVitest.mockMatchMedia();

globalThis.wpVitest.mockScrollIntoView();

const timezones = [
	{ label: 'Greenwich Mean Time', value: 'GMT' },
	{ label: 'Universal Coordinated Time', value: 'UTC' },
	{ label: 'European Central Time', value: 'ECT' },
	{ label: '(Arabic) Egypt Standard Time', value: 'ART' },
	{ label: 'Eastern African Time', value: 'EAT' },
	{ label: 'Middle East Time', value: 'MET' },
	{ label: 'Near East Time', value: 'NET' },
	{ label: 'Pakistan Lahore Time', value: 'PLT' },
	{ label: 'India Standard Time', value: 'IST' },
	{ label: 'Bangladesh Standard Time', value: 'BST' },
	{ label: 'Vietnam Standard Time', value: 'VST' },
	{ label: 'China Taiwan Time', value: 'CTT' },
	{ label: 'Japan Standard Time', value: 'JST' },
	{ label: 'Australia Central Time', value: 'ACT' },
	{ label: 'Australia Eastern Time', value: 'AET' },
	{ label: 'Solomon Standard Time', value: 'SST' },
	{ label: 'New Zealand Standard Time', value: 'NST' },
	{ label: 'Midway Islands Time', value: 'MIT' },
	{ label: 'Hawaii Standard Time', value: 'HST' },
	{ label: 'Alaska Standard Time', value: 'AST' },
	{ label: 'Pacific Standard Time', value: 'PST' },
	{ label: 'Phoenix Standard Time', value: 'PNT' },
	{ label: 'Mountain Standard Time', value: 'MST' },
	{ label: 'Central Standard Time', value: 'CST' },
	{ label: 'Eastern Standard Time', value: 'EST' },
	{ label: 'Indiana Eastern Standard Time', value: 'IET' },
	{ label: 'Puerto Rico and US Virgin Islands Time', value: 'PRT' },
	{ label: 'Canada Newfoundland Time', value: 'CNT' },
	{ label: 'Argentina Standard Time', value: 'AGT' },
	{ label: 'Brazil Eastern Time', value: 'BET' },
	{ label: 'Central African Time', value: 'CAT' },
];

const defaultLabelText = 'Select a timezone';
const getLabel = ( labelText: string ) => screen.getByText( labelText );
const getInput = ( name: string ) => screen.getByRole( 'combobox', { name } );
const getOption = ( name: string ) => screen.getByRole( 'option', { name } );
const getAllOptions = () => screen.getAllByRole( 'option' );
const getOptionSearchString = ( option: ComboboxControlOption ) =>
	option.label.substring( 0, 11 );

const ComboboxControl = ( props: ComboboxControlProps ) => {
	return <_ComboboxControl { ...props } />;
};

const ControlledComboboxControl = ( {
	value: valueProp,
	onChange,
	...props
}: ComboboxControlProps ) => {
	const [ value, setValue ] = useState( valueProp );
	const handleOnChange: ComboboxControlProps[ 'onChange' ] = ( newValue ) => {
		setValue( newValue );
		onChange?.( newValue );
	};
	return (
		<>
			<ComboboxControl
				{ ...props }
				value={ value }
				onChange={ handleOnChange }
			/>
		</>
	);
};

describe( 'ComboboxControl popup relationship', () => {
	it( 'only references rendered suggestions', async () => {
		const user = userEvent.setup();
		const props = { options: timezones, label: defaultLabelText };
		const { rerender } = render( <ComboboxControl { ...props } /> );
		const input = getInput( defaultLabelText );

		expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( input ).not.toHaveAttribute( 'aria-controls' );

		await user.type( input, 'European' );

		expect( input ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( input ).not.toHaveAttribute( 'aria-owns' );
		expect( input ).toHaveAttribute(
			'aria-controls',
			screen.getByRole( 'listbox' ).id
		);
		expect( input ).toHaveAttribute(
			'aria-activedescendant',
			screen.getByRole( 'option', { selected: true } ).id
		);

		rerender( <ComboboxControl { ...props } isLoading /> );

		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( input ).toHaveValue( 'European' );
		expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( input ).not.toHaveAttribute( 'aria-controls' );
		expect( input ).not.toHaveAttribute( 'aria-owns' );
		expect( input ).not.toHaveAttribute( 'aria-activedescendant' );

		rerender( <ComboboxControl { ...props } /> );

		expect( input ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( input ).not.toHaveAttribute( 'aria-owns' );
		expect( input ).toHaveAttribute(
			'aria-controls',
			screen.getByRole( 'listbox' ).id
		);
		expect( input ).toHaveAttribute(
			'aria-activedescendant',
			screen.getByRole( 'option', { selected: true } ).id
		);

		await user.keyboard( '[Escape]' );

		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( input ).not.toHaveAttribute( 'aria-controls' );
		expect( input ).not.toHaveAttribute( 'aria-owns' );
		expect( input ).not.toHaveAttribute( 'aria-activedescendant' );
	} );
} );

describe( 'ComboboxControl Escape key', () => {
	it( 'closes the suggestions list first, and then a parent Modal', async () => {
		const user = userEvent.setup();
		const onRequestClose = vi.fn();
		render(
			<Modal title="Modal" onRequestClose={ onRequestClose }>
				<ComboboxControl
					options={ timezones }
					label={ defaultLabelText }
				/>
			</Modal>
		);
		const input = getInput( defaultLabelText );

		await user.click( input );
		expect( screen.getByRole( 'listbox' ) ).toBeVisible();

		await user.keyboard( '[Escape]' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( onRequestClose ).not.toHaveBeenCalled();

		await user.keyboard( '[Escape]' );
		expect( onRequestClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes the suggestions list first, and then a parent `@wordpress/ui` Dialog', async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(
			<Dialog.Root open onOpenChange={ onOpenChange }>
				<Dialog.Popup>
					<Dialog.Title>Dialog</Dialog.Title>
					<ComboboxControl
						options={ timezones }
						label={ defaultLabelText }
					/>
				</Dialog.Popup>
			</Dialog.Root>
		);
		const input = await screen.findByRole( 'combobox', {
			name: defaultLabelText,
		} );

		await user.click( input );
		expect( screen.getByRole( 'listbox' ) ).toBeVisible();

		await user.keyboard( '[Escape]' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( onOpenChange ).not.toHaveBeenCalled();

		await user.keyboard( '[Escape]' );
		expect( onOpenChange ).toHaveBeenCalledTimes( 1 );
		expect( onOpenChange ).toHaveBeenCalledWith( false, expect.anything() );
	} );

	it( 'closes a parent Modal when Escape is pressed on the Reset button', async () => {
		const user = userEvent.setup();
		const onRequestClose = vi.fn();
		render(
			<Modal title="Modal" onRequestClose={ onRequestClose }>
				<ComboboxControl
					options={ timezones }
					label={ defaultLabelText }
					allowReset
				/>
			</Modal>
		);
		const input = getInput( defaultLabelText );

		await user.click( input );
		await user.keyboard( '[Enter]' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

		// `Modal` constrains tabbing, which finds no tabbable elements in
		// jsdom, so move focus to the Reset button directly.
		const resetButton = screen.getByRole( 'button', { name: 'Reset' } );
		act( () => resetButton.focus() );
		expect( resetButton ).toHaveFocus();

		await user.keyboard( '[Escape]' );
		expect( onRequestClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes the suggestions list first, and then a parent Dropdown', async () => {
		const user = userEvent.setup();
		const { unmount } = render(
			<Dropdown
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggle
					</button>
				) }
				renderContent={ () => (
					<ComboboxControl
						options={ timezones }
						label={ defaultLabelText }
					/>
				) }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Toggle' } ) );
		const input = await screen.findByRole( 'combobox', {
			name: defaultLabelText,
		} );

		await user.click( input );
		expect( screen.getByRole( 'listbox' ) ).toBeVisible();

		await user.keyboard( '[Escape]' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( input ).toBeInTheDocument();

		await user.keyboard( '[Escape]' );
		await waitFor( () => expect( input ).not.toBeInTheDocument() );

		// Clean up remaining effects, like the delayed popover positioning.
		unmount();
	} );

	it( 'ends the search first, and then closes a parent Modal, while results are loading', async () => {
		const user = userEvent.setup();
		const onRequestClose = vi.fn();
		render(
			<Modal title="Modal" onRequestClose={ onRequestClose }>
				<ComboboxControl
					options={ timezones }
					label={ defaultLabelText }
					value={ timezones[ 0 ].value }
					isLoading
				/>
			</Modal>
		);
		const input = getInput( defaultLabelText );

		await user.click( input );
		await user.keyboard( 'x' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( input ).toHaveValue( 'x' );

		await user.keyboard( '[Escape]' );
		expect( input ).toHaveValue( timezones[ 0 ].label );
		expect( onRequestClose ).not.toHaveBeenCalled();

		await user.keyboard( '[Escape]' );
		expect( onRequestClose ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe.each( [
	[ 'uncontrolled', ComboboxControl ],
	[ 'controlled', ControlledComboboxControl ],
] )( 'ComboboxControl %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	it( 'should render with visible label', () => {
		render(
			<Component options={ timezones } label={ defaultLabelText } />
		);
		expect( getLabel( defaultLabelText ) ).toBeVisible();
		expect( getInput( defaultLabelText ) ).toBeVisible();
	} );

	it( 'should render with hidden label', () => {
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				hideLabelFromVision
			/>
		);
		expect( getInput( defaultLabelText ) ).toBeVisible();
	} );

	it( 'should render with the correct options', async () => {
		const user = await userEvent.setup();
		render(
			<Component options={ timezones } label={ defaultLabelText } />
		);
		const input = getInput( defaultLabelText );

		// Clicking on the input shows the options
		await user.click( input );

		const renderedOptions = getAllOptions();

		// Confirm the rendered options match the provided dataset.
		expect( renderedOptions ).toHaveLength( timezones.length );
		renderedOptions.forEach( ( option, optionIndex ) => {
			expect( option ).toHaveTextContent(
				timezones[ optionIndex ].label
			);
		} );
	} );

	it( 'should select the correct option via click events', async () => {
		const user = await userEvent.setup();
		const targetOption = timezones[ 2 ];
		const onChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onChange={ onChangeSpy }
			/>
		);
		const input = getInput( defaultLabelText );

		// Clicking on the input shows the options
		await user.click( input );

		// Select the target option
		await user.click( getOption( targetOption.label ) );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( targetOption.value );
		expect( input ).toHaveValue( targetOption.label );
	} );

	it( 'should select the correct option via keypress events', async () => {
		const user = await userEvent.setup();
		const targetIndex = 4;
		const targetOption = timezones[ targetIndex ];
		const onChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onChange={ onChangeSpy }
			/>
		);
		const input = getInput( defaultLabelText );

		// Pressing tab selects the input and shows the options
		await user.tab();

		// Navigate the options using the down arrow
		for ( let i = 0; i < targetIndex; i++ ) {
			await user.keyboard( '{ArrowDown}' );
		}

		// Pressing Enter/Return selects the currently focused option
		await user.keyboard( '{Enter}' );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( targetOption.value );
		expect( input ).toHaveValue( targetOption.label );
	} );

	it( 'calls onFilterValueChange whenever the textbox changes', async () => {
		const user = userEvent.setup();
		const onFilterValueChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onFilterValueChange={ onFilterValueChangeSpy }
			/>
		);

		const input = getInput( defaultLabelText );

		await user.type( input, 'a' );
		expect( onFilterValueChangeSpy ).toHaveBeenCalledWith( 'a' );
	} );

	it( 'clears the textbox value if there is no selected value on blur', async () => {
		const user = userEvent.setup();
		const onFilterValueChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onFilterValueChange={ onFilterValueChangeSpy }
			/>
		);
		const input = getInput( defaultLabelText );

		await user.type( input, 'a' );
		expect( input ).toHaveValue( 'a' );

		// Blur and focus the input.
		await user.tab();
		await user.click( input );

		expect( input ).toHaveValue( '' );
		expect( onFilterValueChangeSpy ).toHaveBeenLastCalledWith( '' );
	} );

	it( 'should select the correct option from a search', async () => {
		const user = await userEvent.setup();
		const targetOption = timezones[ 13 ];
		const onChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onChange={ onChangeSpy }
			/>
		);
		const input = getInput( defaultLabelText );

		// Pressing tab selects the input and shows the options
		await user.tab();

		// Type enough characters to ensure a predictable search result
		await user.keyboard( getOptionSearchString( targetOption ) );

		// Pressing Enter/Return selects the currently focused option
		await user.keyboard( '{Enter}' );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( targetOption.value );
		expect( input ).toHaveValue( targetOption.label );
	} );

	it( 'should render aria-live announcement upon selection', async () => {
		const user = await userEvent.setup();
		const targetOption = timezones[ 9 ];
		const onChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onChange={ onChangeSpy }
			/>
		);

		// Pressing tab selects the input and shows the options
		await user.tab();

		// Type enough characters to ensure a predictable search result
		await user.keyboard( getOptionSearchString( targetOption ) );

		// Pressing Enter/Return selects the currently focused option
		await user.keyboard( '{Enter}' );

		expect(
			screen.getByText( 'Item selected.', {
				selector: '[aria-live]',
			} )
		).toBeInTheDocument();
	} );

	it( 'should process multiple entries in a single session', async () => {
		const user = await userEvent.setup();
		const unmatchedString = 'Mordor';
		const targetOption = timezones[ 6 ];
		const onChangeSpy = vi.fn();
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				onChange={ onChangeSpy }
			/>
		);
		const input = getInput( defaultLabelText );

		// Pressing tab selects the input and shows the options
		await user.tab();

		const initialRenderedOptions = getAllOptions();

		// Rendered options match the provided dataset.
		expect( initialRenderedOptions ).toHaveLength( timezones.length );
		initialRenderedOptions.forEach( ( option, optionIndex ) => {
			expect( option ).toHaveTextContent(
				timezones[ optionIndex ].label
			);
		} );

		// No options are rendered if no match is found
		await user.keyboard( unmatchedString );
		expect( screen.queryByRole( 'option' ) ).not.toBeInTheDocument();

		// Clearing the input renders all options again
		await user.clear( input );

		const postClearRenderedOptions = getAllOptions();

		expect( postClearRenderedOptions ).toHaveLength( timezones.length );
		postClearRenderedOptions.forEach( ( option, optionIndex ) => {
			expect( option ).toHaveTextContent(
				timezones[ optionIndex ].label
			);
		} );

		// Run a second search with a valid string.
		const searchString = getOptionSearchString( targetOption );
		await user.keyboard( searchString );
		const validSearchRenderedOptions = getAllOptions();

		// Find option that match the search string.
		const matches = timezones.filter( ( option ) =>
			option.label.includes( searchString )
		);

		// Confirm the rendered options match the provided dataset based on the current string.
		expect( validSearchRenderedOptions ).toHaveLength( matches.length );
		validSearchRenderedOptions.forEach( ( option, optionIndex ) => {
			expect( option ).toHaveTextContent( matches[ optionIndex ].label );
		} );

		// Confirm that the current option is selected
		await user.keyboard( '{Enter}' );

		expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
		expect( onChangeSpy ).toHaveBeenCalledWith( targetOption.value );
		expect( input ).toHaveValue( targetOption.label );
	} );

	it( 'should not render Reset button when no value is set', () => {
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				allowReset
			/>
		);

		const resetButton = screen.queryByRole( 'button', { name: 'Reset' } );

		expect( resetButton ).not.toBeInTheDocument();
	} );

	it( 'should not render Reset button when allowReset is false', () => {
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				allowReset={ false }
			/>
		);

		const resetButton = screen.queryByRole( 'button', { name: 'Reset' } );

		expect( resetButton ).not.toBeInTheDocument();
	} );

	it( 'should reset input when clicking the Reset button', async () => {
		const user = await userEvent.setup();
		const targetOption = timezones[ 13 ];

		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				allowReset
			/>
		);

		// Pressing tab selects the input and shows the options.
		await user.tab();
		// Type enough characters to ensure a predictable search result.
		await user.keyboard( getOptionSearchString( targetOption ) );
		// Pressing Enter/Return selects the currently focused option.
		await user.keyboard( '{Enter}' );

		const input = getInput( defaultLabelText );

		expect( input ).toHaveValue( targetOption.label );

		const resetButton = screen.getByRole( 'button', { name: 'Reset' } );

		expect( resetButton ).toBeEnabled();

		await user.click( resetButton );

		expect( resetButton ).not.toBeInTheDocument();
		expect( input ).toHaveValue( '' );
		expect( input ).toHaveFocus();
	} );

	it( 'should reset input when pressing the Reset button with the Enter key', async () => {
		const user = await userEvent.setup();
		const targetOption = timezones[ 13 ];

		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				allowReset
			/>
		);

		// Pressing tab selects the input and shows the options.
		await user.tab();
		// Type enough characters to ensure a predictable search result.
		await user.keyboard( getOptionSearchString( targetOption ) );
		// Pressing Enter/Return selects the currently focused option.
		await user.keyboard( '{Enter}' );

		const input = getInput( defaultLabelText );

		expect( input ).toHaveValue( targetOption.label );

		// Pressing tab moves focus to the Reset buttons
		await user.tab();

		const resetButton = screen.getByRole( 'button', { name: 'Reset' } );

		// If the button has focus that implies it is enabled.
		expect( resetButton ).toHaveFocus();

		// Pressing Enter/Return resets the input.
		await user.keyboard( '{Enter}' );

		expect( resetButton ).not.toBeInTheDocument();
		expect( input ).toHaveValue( '' );
		expect( input ).toHaveFocus();
	} );

	it( 'should associate the `help` text with the combobox accessibly', () => {
		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				help="Help text"
			/>
		);
		expect( getInput( defaultLabelText ) ).toHaveAccessibleDescription(
			'Help text'
		);
	} );

	it( 'should reset input when pressing the Reset button with the Spacebar key', async () => {
		const user = await userEvent.setup();
		const targetOption = timezones[ 13 ];

		render(
			<Component
				options={ timezones }
				label={ defaultLabelText }
				allowReset
			/>
		);

		// Pressing tab selects the input and shows the options.
		await user.tab();
		// Type enough characters to ensure a predictable search result.
		await user.keyboard( getOptionSearchString( targetOption ) );
		// Pressing Enter/Return selects the currently focused option.
		await user.keyboard( '{Enter}' );

		const input = getInput( defaultLabelText );

		expect( input ).toHaveValue( targetOption.label );

		// Pressing tab moves focus to the Reset buttons.
		await user.tab();

		const resetButton = screen.getByRole( 'button', { name: 'Reset' } );

		// If the button has focus that implies it is enabled.
		expect( resetButton ).toHaveFocus();

		// Pressing Spacebar resets the input.
		await user.keyboard( '[Space]' );

		expect( resetButton ).not.toBeInTheDocument();
		expect( input ).toHaveValue( '' );
		expect( input ).toHaveFocus();
	} );
} );
