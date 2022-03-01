/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { UP, DOWN, ENTER, ESCAPE } from '@wordpress/keycodes';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';
import { parseUnit } from '../utils';

const getComponent = () =>
	document.body.querySelector( '.components-unit-control' );
const getInput = () =>
	document.body.querySelector( '.components-unit-control input' );
const getSelect = () =>
	document.body.querySelector( '.components-unit-control select' );
const getUnitLabel = () =>
	document.body.querySelector( '.components-unit-control__unit-label' );

const fireKeyDown = ( data ) =>
	fireEvent.keyDown( document.activeElement || document.body, data );

const ControlledSyncUnits = () => {
	const [ state, setState ] = useState( { valueA: '', valueB: '' } );

	// Keep the unit sync'd between the two `UnitControl` instances.
	const onUnitControlChange = ( fieldName, newValue ) => {
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const [ quantity, newUnit ] = parseUnit( newValue );

		if ( ! Number.isFinite( quantity ) ) {
			return;
		}

		const nextState = { ...state, [ fieldName ]: newValue };

		Object.entries( state ).forEach( ( [ stateProp, stateValue ] ) => {
			const [ stateQuantity, stateUnit ] = parseUnit( stateValue );

			if ( stateProp !== fieldName && stateUnit !== newUnit ) {
				nextState[ stateProp ] = `${ stateQuantity }${ newUnit }`;
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
			const input = getInput();
			const select = getSelect();

			expect( input ).toBeTruthy();
			expect( select ).toBeTruthy();
		} );

		it( 'should render custom className', () => {
			render( <UnitControl className="hello" /> );

			const el = getComponent();

			expect( el.classList.contains( 'hello' ) ).toBe( true );
		} );

		it( 'should not render select, if units are disabled', () => {
			render( <UnitControl unit="em" units={ false } /> );
			const input = getInput();
			const select = getSelect();

			expect( input ).toBeTruthy();
			expect( select ).toBeFalsy();
		} );

		it( 'should render label if single units', () => {
			render( <UnitControl units={ [ { value: '%', label: '%' } ] } /> );

			const select = getSelect();
			const label = getUnitLabel();

			expect( select ).toBeFalsy();
			expect( label ).toBeTruthy();
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value on change', () => {
			let state = '50px';
			const setState = jest.fn( ( value ) => ( state = value ) );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: 62 } } );

			expect( setState ).toHaveBeenCalledTimes( 1 );
			expect( state ).toBe( '62px' );
		} );

		it( 'should increment value on UP press', () => {
			let state = '50px';
			const setState = ( nextState ) => ( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			getInput().focus();
			fireKeyDown( { keyCode: UP } );

			expect( state ).toBe( '51px' );
		} );

		it( 'should increment value on UP + SHIFT press, with step', () => {
			let state = '50px';
			const setState = ( nextState ) => ( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			getInput().focus();
			fireKeyDown( { keyCode: UP, shiftKey: true } );

			expect( state ).toBe( '60px' );
		} );

		it( 'should decrement value on DOWN press', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			getInput().focus();
			fireKeyDown( { keyCode: DOWN } );

			expect( state ).toBe( '49px' );
		} );

		it( 'should decrement value on DOWN + SHIFT press, with step', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			getInput().focus();
			fireKeyDown( { keyCode: DOWN, shiftKey: true } );

			expect( state ).toBe( '40px' );
		} );

		it( 'should cancel change when ESCAPE key is pressed', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			input.focus();

			fireEvent.change( input, { target: { value: '300px' } } );

			expect( input.value ).toBe( '300px' );
			expect( state ).toBe( 50 );

			fireKeyDown( { keyCode: ESCAPE } );

			expect( input.value ).toBe( '50' );
			expect( state ).toBe( 50 );
		} );
	} );

	describe( 'Unit', () => {
		it( 'should update unit value on change', () => {
			let state = 'px';
			const setState = ( nextState ) => ( state = nextState );

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

			const select = getSelect();
			const options = select.querySelectorAll( 'option' );

			expect( options.length ).toBe( 2 );

			const [ pt, vmax ] = options;

			expect( pt.value ).toBe( 'pt' );
			expect( vmax.value ).toBe( 'vmax' );
		} );

		it( 'should reset value on unit change, if unit has default value', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

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
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

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
			let state = '50%';
			const setState = ( value ) => ( state = value );

			render(
				<UnitControl
					value={ state }
					unit="%"
					units={ [ { value: '%', label: '%' } ] }
					onChange={ setState }
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: 62 } } );

			expect( state ).toBe( '62%' );
		} );

		it( 'should update unit value when a new raw value is passed', () => {
			render( <ControlledSyncUnits /> );

			const [ inputA, inputB ] = screen.getAllByRole( 'spinbutton' );
			const [ selectA, selectB ] = screen.getAllByRole( 'combobox' );
			const [ remOptionA ] = screen.getAllByRole( 'option', {
				name: 'rem',
			} );
			const [ , vwOptionB ] = screen.getAllByRole( 'option', {
				name: 'vw',
			} );

			userEvent.type( inputA, '55' );
			userEvent.type( inputB, '14' );

			userEvent.selectOptions( selectA, remOptionA );

			expect( selectA ).toHaveValue( 'rem' );
			expect( selectB ).toHaveValue( 'rem' );

			userEvent.selectOptions( selectB, vwOptionB );

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
			fireKeyDown( { keyCode: ENTER } );

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
			fireKeyDown( { keyCode: ENTER } );

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
			fireKeyDown( { keyCode: ENTER } );

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
			fireKeyDown( { keyCode: ENTER } );

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
			fireKeyDown( { keyCode: ENTER } );

			expect( state ).toBe( '123rem' );
		} );

		it( 'should update unit after initial render and with new unit prop', () => {
			const { rerender } = render( <UnitControl value={ '10%' } /> );

			const select = getSelect();

			expect( select.value ).toBe( '%' );

			rerender( <UnitControl value={ '20' } unit="em" /> );

			expect( select.value ).toBe( 'em' );
		} );

		it( 'should fallback to default unit if parsed unit is invalid', () => {
			render( <UnitControl value={ '10null' } /> );

			expect( getSelect().value ).toBe( 'px' );
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
			const options = select.querySelectorAll( 'option' );

			expect( select.value ).toBe( '%' );
			expect( options.length ).toBe( 3 );
		} );
	} );
} );
