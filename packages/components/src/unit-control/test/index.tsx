/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { UP, DOWN, ENTER, ESCAPE } from '@wordpress/keycodes';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';
import { parseQuantityAndUnitFromRawValue } from '../utils';
import type { UnitControlOnChangeCallback } from '../types';

// TODO: What determines spinbutton or textbox ?
const getInput = ( isNumeric: boolean = false ) =>
	screen.getByRole(
		isNumeric ? 'spinbutton' : 'textbox'
	) as HTMLInputElement;
const getSelect = () => screen.getByRole( 'combobox' ) as HTMLSelectElement;
const getSelectOptions = () =>
	screen.getAllByRole( 'option' ) as HTMLOptionElement[];

const ControlledSyncUnits = () => {
	const [ state, setState ] = useState( {
		valueA: '',
		valueB: '',
	} );

	// Keep the unit sync'd between the two `UnitControl` instances.
	const onUnitControlChange = (
		fieldName: 'valueA' | 'valueB',
		newValue?: string | number
	) => {
		const parsedQuantityAndUnit = parseQuantityAndUnitFromRawValue(
			newValue
		);
		const quantity = parsedQuantityAndUnit[ 0 ];

		if ( ! Number.isFinite( quantity ) ) {
			return;
		}

		const newUnit = parsedQuantityAndUnit[ 1 ];

		const nextState = {
			...state,
			[ fieldName ]: newValue,
		};

		Object.entries( state ).forEach( ( [ stateProp, stateValue ] ) => {
			const [
				stateQuantity,
				stateUnit,
			] = parseQuantityAndUnitFromRawValue( stateValue );

			if ( stateProp !== fieldName && stateUnit !== newUnit ) {
				nextState[
					stateProp as 'valueA' | 'valueB'
				] = `${ stateQuantity }${ newUnit }`;
			}
		} );

		setState( nextState );
	};

	return (
		<>
			<UnitControl
				label="Field A"
				value={ state.valueA }
				onChange={ ( v ) => onUnitControlChange( 'valueA', v ) }
			/>
			<UnitControl
				label="Field B"
				value={ state.valueB }
				onChange={ ( v ) => onUnitControlChange( 'valueB', v ) }
			/>
		</>
	);
};

describe( 'UnitControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <UnitControl /> );
			const input = getInput( true );
			const select = getSelect();

			expect( input ).toBeInTheDocument();
			expect( select ).toBeInTheDocument();
		} );

		// TODO: update TS matchers
		it( 'should render custom className', () => {
			const { container: noClassName } = render( <UnitControl /> );

			const { container: withClassName } = render(
				<UnitControl className="hello" />
			);

			expect( noClassName.firstChild ).toMatchDiffSnapshot(
				withClassName.firstChild
			);
		} );

		// TODO: update TS matchers
		it( 'should not render select, if units are disabled', () => {
			render( <UnitControl unit="em" units={ [] } /> );
			const input = getInput( true );
			const select = screen.queryByRole( 'combobox' );

			expect( input ).toBeInTheDocument();
			expect( select ).not.toBeInTheDocument();
		} );

		// TODO: update TS matchers
		// Check why it errors
		it.skip( 'should render label if single units', () => {
			render( <UnitControl units={ [ { value: '%', label: '%' } ] } /> );

			const select = screen.queryByRole( 'combobox' );
			const label = screen.getByText( '%' );

			expect( select ).not.toBeInTheDocument();
			expect( label ).toBeInTheDocument();
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value on change', () => {
			let state = '50px';
			const setState = jest.fn( ( value ) => ( state = value ) );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput( true );
			input.focus();
			fireEvent.change( input, { target: { value: 62 } } );

			expect( setState ).toHaveBeenCalledTimes( 1 );
			expect( state ).toBe( '62px' );
		} );

		it( 'should increment value on UP press', () => {
			let state: string | undefined = '50px';
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput( true );
			input.focus();
			fireEvent.keyDown( input, { keyCode: UP } );

			expect( state ).toBe( '51px' );
		} );

		it( 'should increment value on UP + SHIFT press, with step', () => {
			let state: string | undefined = '50px';
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput( true );
			input.focus();
			fireEvent.keyDown( input, { keyCode: UP, shiftKey: true } );

			expect( state ).toBe( '60px' );
		} );

		it( 'should decrement value on DOWN press', () => {
			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput( true );
			input.focus();
			fireEvent.keyDown( input, { keyCode: DOWN } );

			expect( state ).toBe( '49px' );
		} );

		it( 'should decrement value on DOWN + SHIFT press, with step', () => {
			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput( true );
			input.focus();
			fireEvent.keyDown( input, { keyCode: DOWN, shiftKey: true } );

			expect( state ).toBe( '40px' );
		} );

		it( 'should cancel change when ESCAPE key is pressed', () => {
			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput() as HTMLInputElement;
			input.focus();

			fireEvent.change( input, { target: { value: '300px' } } );

			expect( input.value ).toBe( '300px' );
			expect( state ).toBe( 50 );

			fireEvent.keyDown( input, { keyCode: ESCAPE } );

			expect( input.value ).toBe( '50' );
			expect( state ).toBe( 50 );
		} );
	} );

	describe( 'Unit', () => {
		it( 'should update unit value on change', () => {
			let state: string | undefined = 'px';
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl unit={ state } onUnitChange={ setState } /> );

			const select = getSelect();
			select.focus();
			fireEvent.change( select, { target: { value: 'em' } } );

			expect( state ).toBe( 'em' );
		} );

		it( 'should render customized units, if defined', () => {
			const units = [
				{ value: 'pt', label: 'pt', default: 0 },
				{ value: 'vmax', label: 'vmax', default: 10 },
			];

			render( <UnitControl units={ units } /> );

			const options = getSelectOptions();

			expect( options.length ).toBe( 2 );

			const [ pt, vmax ] = options;

			expect( pt.value ).toBe( 'pt' );
			expect( vmax.value ).toBe( 'vmax' );
		} );

		it( 'should reset value on unit change, if unit has default value', () => {
			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			const units = [
				{ value: 'pt', label: 'pt', default: 25 },
				{ value: 'vmax', label: 'vmax', default: 75 },
			];

			render(
				<UnitControl
					isResetValueOnUnitChange
					units={ units }
					onChange={ setState }
					value={ state }
				/>
			);

			const select = getSelect();
			select.focus();

			fireEvent.change( select, { target: { value: 'vmax' } } );

			expect( state ).toBe( '75vmax' );

			fireEvent.change( select, { target: { value: 'pt' } } );

			expect( state ).toBe( '25pt' );
		} );

		it( 'should not reset value on unit change, if disabled', () => {
			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			const units = [
				{ value: 'pt', label: 'pt', default: 25 },
				{ value: 'vmax', label: 'vmax', default: 75 },
			];

			render(
				<UnitControl
					isResetValueOnUnitChange={ false }
					value={ state }
					units={ units }
					onChange={ setState }
				/>
			);

			const select = getSelect();
			select.focus();

			fireEvent.change( select, { target: { value: 'vmax' } } );

			expect( state ).toBe( '50vmax' );

			fireEvent.change( select, { target: { value: 'pt' } } );

			expect( state ).toBe( '50pt' );
		} );

		it( 'should set correct unit if single units', () => {
			let state: string | undefined = '50%';
			const setState: UnitControlOnChangeCallback = ( value ) =>
				( state = value );

			render(
				<UnitControl
					value={ state }
					unit="%"
					units={ [ { value: '%', label: '%' } ] }
					onChange={ setState }
				/>
			);

			const input = getInput( true );
			input.focus();
			fireEvent.change( input, { target: { value: 62 } } );

			expect( state ).toBe( '62%' );
		} );

		// TODO: update TS matchers
		it( 'should update unit value when a new raw value is passed', () => {
			render( <ControlledSyncUnits /> );

			const [ inputA, inputB ] = screen.getAllByRole( 'spinbutton' );
			const [ selectA, selectB ] = screen.getAllByRole( 'combobox' );

			inputA.focus();
			fireEvent.change( inputA, { target: { value: '55' } } );

			inputB.focus();
			fireEvent.change( inputB, { target: { value: '14' } } );

			selectA.focus();
			fireEvent.change( selectA, { target: { value: 'rem' } } );

			expect( selectA ).toHaveValue( 'rem' );
			expect( selectB ).toHaveValue( 'rem' );

			selectB.focus();
			fireEvent.change( selectB, { target: { value: 'vw' } } );

			expect( selectA ).toHaveValue( 'vw' );
			expect( selectB ).toHaveValue( 'vw' );
		} );
	} );

	describe( 'Unit Parser', () => {
		let state = '10px';
		const setState = jest.fn( ( nextState ) => ( state = nextState ) );

		it( 'should parse unit from input', () => {
			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '55 em' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( state ).toBe( '55em' );
		} );

		it( 'should parse PX unit from input', () => {
			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '61   PX' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( state ).toBe( '61px' );
		} );

		it( 'should parse EM unit from input', () => {
			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '55 em' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( state ).toBe( '55em' );
		} );

		it( 'should parse % unit from input', () => {
			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '-10  %' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( state ).toBe( '-10%' );
		} );

		it( 'should parse REM unit from input', () => {
			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, {
				target: { value: '123       rEm  ' },
			} );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( state ).toBe( '123rem' );
		} );

		it( 'should update unit after initial render and with new unit prop', () => {
			const { rerender } = render( <UnitControl value={ '10%' } /> );

			const select = getSelect() as HTMLSelectElement;

			expect( select.value ).toBe( '%' );

			rerender( <UnitControl value={ '20' } unit="em" /> );

			expect( select.value ).toBe( 'em' );
		} );

		it( 'should fallback to default unit if parsed unit is invalid', () => {
			render( <UnitControl value={ '10null' } /> );

			const select = getSelect() as HTMLSelectElement;
			expect( select.value ).toBe( 'px' );
		} );

		it( 'should display valid CSS unit when not explicitly included in units list', () => {
			render(
				<UnitControl
					value={ '10%' }
					units={ [
						{ value: 'px', label: 'px' },
						{ value: 'em', label: 'em' },
					] }
				/>
			);

			const select = getSelect();
			const options = getSelectOptions();

			expect( select.value ).toBe( '%' );
			expect( options.length ).toBe( 3 );
		} );
	} );
} );
