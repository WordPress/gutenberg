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
	{ name: 'Greenwich Mean Time', abbreviation: 'GMT' },
	{ name: 'Universal Coordinated Time', abbreviation: 'UTC' },
	{ name: 'European Central Time', abbreviation: 'ECT' },
	{ name: '(Arabic) Egypt Standard Time', abbreviation: 'ART' },
	{ name: 'Eastern African Time', abbreviation: 'EAT' },
	{ name: 'Middle East Time', abbreviation: 'MET' },
	{ name: 'Near East Time', abbreviation: 'NET' },
	{ name: 'Pakistan Lahore Time', abbreviation: 'PLT' },
	{ name: 'India Standard Time', abbreviation: 'IST' },
	{ name: 'Bangladesh Standard Time', abbreviation: 'BST' },
	{ name: 'Vietnam Standard Time', abbreviation: 'VST' },
	{ name: 'China Taiwan Time', abbreviation: 'CTT' },
	{ name: 'Japan Standard Time', abbreviation: 'JST' },
	{ name: 'Australia Central Time', abbreviation: 'ACT' },
	{ name: 'Australia Eastern Time', abbreviation: 'AET' },
	{ name: 'Solomon Standard Time', abbreviation: 'SST' },
	{ name: 'New Zealand Standard Time', abbreviation: 'NST' },
	{ name: 'Midway Islands Time', abbreviation: 'MIT' },
	{ name: 'Hawaii Standard Time', abbreviation: 'HST' },
	{ name: 'Alaska Standard Time', abbreviation: 'AST' },
	{ name: 'Pacific Standard Time', abbreviation: 'PST' },
	{ name: 'Phoenix Standard Time', abbreviation: 'PNT' },
	{ name: 'Mountain Standard Time', abbreviation: 'MST' },
	{ name: 'Central Standard Time', abbreviation: 'CST' },
	{ name: 'Eastern Standard Time', abbreviation: 'EST' },
	{ name: 'Indiana Eastern Standard Time', abbreviation: 'IET' },
	{ name: 'Puerto Rico and US Virgin Islands Time', abbreviation: 'PRT' },
	{ name: 'Canada Newfoundland Time', abbreviation: 'CNT' },
	{ name: 'Argentina Standard Time', abbreviation: 'AGT' },
	{ name: 'Brazil Eastern Time', abbreviation: 'BET' },
	{ name: 'Central African Time', abbreviation: 'CAT' },
];
const mapTimezoneOption = ( tz ) => ( {
	value: tz.abbreviation,
	label: tz.name,
} );

const timezoneOptions = timezones.map( mapTimezoneOption );
const defaultLabelText = 'Select a timezone';
const getLabel = () => screen.getByText( defaultLabelText );
const getInput = () => screen.getByRole( 'combobox' );
const getRenderedOptions = () => screen.getAllByRole( 'option' );

describe( 'ComboboxControl', () => {
	// Use real timers to avoid timeout errors from userEvent
	beforeEach( () => {
		jest.useRealTimers();
	} );

	const TestComboboxControl = ( props ) => {
		const [ value, setValue ] = useState( null );
		return (
			<>
				<ComboboxControl
					{ ...props }
					value={ value }
					label={ defaultLabelText }
					options={ timezoneOptions }
					onChange={ setValue }
				/>
				<p data-testid="value-output">{ value }</p>
			</>
		);
	};

	it( 'should render', () => {
		render( <TestComboboxControl /> );

		const input = getInput();
		expect( input ).toBeVisible();
	} );

	it( 'should render with visible label', () => {
		render( <TestComboboxControl /> );
		const label = getLabel();
		expect( label ).toBeVisible();
	} );

	it( 'should render with hidden label', () => {
		render( <TestComboboxControl hideLabelFromVision={ true } /> );
		const label = getLabel();

		expect( label ).toBeInTheDocument();
		expect( label ).toHaveAttribute(
			'data-wp-component',
			'VisuallyHidden'
		);
	} );

	it( 'should render with the correct options', () => {
		render( <TestComboboxControl /> );

		getInput().focus();

		const renderedOptions = getRenderedOptions();

		expect( renderedOptions.length ).toEqual( timezones.length );

		// Confirm the rendered options match the provided dataset.
		const renderedOptionNames = [];
		for ( const option of renderedOptions.values() ) {
			renderedOptionNames.push( option.textContent );
		}
		const timezoneNames = timezones.map( ( tz ) => tz.name );

		expect( renderedOptionNames ).toEqual( timezoneNames );
	} );

	it( 'should select the correct option with click', async () => {
		render( <TestComboboxControl /> );
		const targetIndex = 2;
		const input = getInput();
		input.focus();
		await userEvent.click(
			screen.getByRole( 'option', {
				name: timezones[ targetIndex ].name,
			} )
		);
		const currentValue = screen.getByTestId( 'value-output' ).textContent;

		expect( input.value ).toEqual( timezones[ targetIndex ].name );
		expect( currentValue ).toEqual( timezones[ targetIndex ].abbreviation );
	} );
} );
