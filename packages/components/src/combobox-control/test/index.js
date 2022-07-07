/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

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
	value: tz.name,
	label: tz.abbreviation,
} );

const timezoneOptions = timezones.map( mapTimezoneOption );
const defaultLabelText = 'Select a timezone';
const getLabel = ( text = defaultLabelText ) => {
	return screen.getByText( text );
};

describe( 'ComboboxControl', () => {
	const TestComboboxControl = ( props ) => (
		<>
			<ComboboxControl
				{ ...props }
				value={ null }
				label={ defaultLabelText }
				options={ timezoneOptions }
			/>
		</>
	);

	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <TestComboboxControl /> );

			const input = screen.getByRole( 'combobox' );
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
	} );
} );
