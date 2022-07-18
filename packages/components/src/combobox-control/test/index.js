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
const getLabel = () => screen.getByText( defaultLabelText );
const getInput = () => screen.getByRole( 'combobox' );
const getRenderedOptions = () => screen.getAllByRole( 'option' );
const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

describe( 'ComboboxControl', () => {
	const TestComboboxControl = ( props ) => {
		const [ value, setValue ] = useState( null );
		return (
			<>
				<ComboboxControl
					{ ...props }
					value={ value }
					label={ defaultLabelText }
					options={ timezones }
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
		const timezoneNames = timezones.map( ( tz ) => tz.label );

		expect( renderedOptionNames ).toEqual( timezoneNames );
	} );

	it( 'should select the correct option with click', async () => {
		const user = setupUser();
		render( <TestComboboxControl /> );
		const targetIndex = 2;
		const input = getInput();
		input.focus();
		await user.click(
			screen.getByRole( 'option', {
				name: timezones[ targetIndex ].label,
			} )
		);
		const currentValue = screen.getByTestId( 'value-output' ).textContent;

		expect( input.value ).toEqual( timezones[ targetIndex ].label );
		expect( currentValue ).toEqual( timezones[ targetIndex ].value );
	} );
} );
