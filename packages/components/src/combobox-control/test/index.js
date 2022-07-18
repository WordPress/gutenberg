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
import ComboboxControl from '../';

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
const getLabel = ( labelText ) => screen.getByText( labelText );
const getInput = ( name ) => screen.getByRole( 'combobox', { name } );
const getOption = ( name ) => screen.getByRole( 'option', { name } );
const getAllOptions = () => screen.getAllByRole( 'option' );
const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

describe( 'ComboboxControl', () => {
	const TestComboboxControl = ( { label, onChange, ...props } ) => {
		const [ value, setValue ] = useState( null );
		const handleOnChange = ( newValue ) => {
			setValue( newValue );
			onChange?.( newValue );
		};
		return (
			<>
				<ComboboxControl
					{ ...props }
					value={ value }
					label={ label }
					options={ timezones }
					onChange={ handleOnChange }
				/>
			</>
		);
	};

	it( 'should render', () => {
		render( <TestComboboxControl label={ defaultLabelText } /> );

		const input = getInput( defaultLabelText );
		expect( input ).toBeVisible();
	} );

	it( 'should render with visible label', () => {
		render( <TestComboboxControl label={ defaultLabelText } /> );
		const label = getLabel( defaultLabelText );
		expect( label ).toBeVisible();
	} );

	it( 'should render with hidden label', () => {
		render(
			<TestComboboxControl
				label={ defaultLabelText }
				hideLabelFromVision={ true }
			/>
		);
		const label = getLabel( defaultLabelText );

		expect( label ).toBeInTheDocument();
		expect( label ).toHaveAttribute(
			'data-wp-component',
			'VisuallyHidden'
		);
	} );

	it( 'should render with the correct options', () => {
		render( <TestComboboxControl label={ defaultLabelText } /> );

		getInput( defaultLabelText ).focus();

		const renderedOptions = getAllOptions();

		expect( renderedOptions.length ).toEqual( timezones.length );

		// Confirm the rendered options match the provided dataset.
		const renderedOptionNames = [];
		for ( const option of renderedOptions.values() ) {
			renderedOptionNames.push( option.textContent );
		}
		const timezoneNames = timezones.map( ( tz ) => tz.label );

		expect( renderedOptionNames ).toEqual( timezoneNames );
	} );

	it( 'should select the correct option via click events', async () => {
		const user = setupUser();
		const targetOption = timezones[ 2 ];
		const onChangeSpy = jest.fn();
		render(
			<TestComboboxControl
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
		expect( input ).toHaveValue( targetOption.name );
	} );
} );
