/**
 * External dependencies
 */
import { render as RTLrender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UnitControl from '../';
import { parseQuantityAndUnitFromRawValue } from '../utils';

function render( jsx ) {
	return {
		user: userEvent.setup( {
			delay: null,
		} ),
		...RTLrender( jsx ),
	};
}

const getComponent = () =>
	document.body.querySelector( '.components-unit-control' );
const getInput = () =>
	document.body.querySelector( '.components-unit-control input' );
const getSelect = () =>
	document.body.querySelector( '.components-unit-control select' );
const getUnitLabel = () =>
	document.body.querySelector( '.components-unit-control__unit-label' );

const ControlledSyncUnits = () => {
	const [ state, setState ] = useState( { valueA: '', valueB: '' } );

	// Keep the unit sync'd between the two `UnitControl` instances.
	const onUnitControlChange = ( fieldName, newValue ) => {
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const [ quantity, newUnit ] = parseQuantityAndUnitFromRawValue(
			newValue
		);

		if ( ! Number.isFinite( quantity ) ) {
			return;
		}

		const nextState = { ...state, [ fieldName ]: newValue };

		Object.entries( state ).forEach( ( [ stateProp, stateValue ] ) => {
			const [
				stateQuantity,
				stateUnit,
			] = parseQuantityAndUnitFromRawValue( stateValue );

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
			render( <UnitControl unit="em" units={ [] } /> );
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
		it( 'should update value on change', async () => {
			let state = '50px';
			const setState = jest.fn( ( value ) => ( state = value ) );

			const { user } = render(
				<UnitControl value={ state } onChange={ setState } />
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '62' );

			// 3 times:
			// - 1: clear
			// - 2: type '6'
			// - 3: type '62'
			expect( setState ).toHaveBeenCalledTimes( 3 );
			expect( state ).toBe( '62px' );
		} );

		it( 'should increment value on UP press', async () => {
			let state = '50px';
			const setState = ( nextState ) => ( state = nextState );

			const { user } = render(
				<UnitControl value={ state } onChange={ setState } />
			);

			const input = getInput();
			await user.type( input, '{ArrowUp}' );

			expect( state ).toBe( '51px' );
		} );

		it( 'should increment value on UP + SHIFT press, with step', async () => {
			let state = '50px';
			const setState = ( nextState ) => ( state = nextState );

			const { user } = render(
				<UnitControl value={ state } onChange={ setState } />
			);

			const input = getInput();
			await user.type( input, '{Shift>}{ArrowUp}{/Shift}' );

			expect( state ).toBe( '60px' );
		} );

		it( 'should decrement value on DOWN press', async () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			const { user } = render(
				<UnitControl value={ state } onChange={ setState } />
			);

			const input = getInput();
			await user.type( input, '{ArrowDown}' );

			expect( state ).toBe( '49px' );
		} );

		it( 'should decrement value on DOWN + SHIFT press, with step', async () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			const { user } = render(
				<UnitControl value={ state } onChange={ setState } />
			);

			const input = getInput();
			await user.type( input, '{Shift>}{ArrowDown}{/Shift}' );

			expect( state ).toBe( '40px' );
		} );

		it( 'should cancel change when ESCAPE key is pressed', async () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			const { user } = render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '300px' );

			expect( input.value ).toBe( '300px' );
			expect( state ).toBe( 50 );

			user.keyboard( '{Escape}' );

			expect( input.value ).toBe( '50' );
			expect( state ).toBe( 50 );
		} );
	} );

	describe( 'Unit', () => {
		it( 'should update unit value on change', async () => {
			let state = 'px';
			const setState = ( nextState ) => ( state = nextState );

			const { user } = render(
				<UnitControl unit={ state } onUnitChange={ setState } />
			);

			const select = getSelect();
			await user.selectOptions( select, [ 'em' ] );

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

		it( 'should reset value on unit change, if unit has default value', async () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			const units = [
				{ value: 'pt', label: 'pt', default: 25 },
				{ value: 'vmax', label: 'vmax', default: 75 },
			];

			const { user } = render(
				<UnitControl
					isResetValueOnUnitChange
					units={ units }
					onChange={ setState }
					value={ state }
				/>
			);

			const select = getSelect();
			await user.selectOptions( select, [ 'vmax' ] );

			expect( state ).toBe( '75vmax' );

			await user.selectOptions( select, [ 'pt' ] );

			expect( state ).toBe( '25pt' );
		} );

		it( 'should not reset value on unit change, if disabled', async () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			const units = [
				{ value: 'pt', label: 'pt', default: 25 },
				{ value: 'vmax', label: 'vmax', default: 75 },
			];

			const { user } = render(
				<UnitControl
					isResetValueOnUnitChange={ false }
					value={ state }
					units={ units }
					onChange={ setState }
				/>
			);

			const select = getSelect();
			await user.selectOptions( select, [ 'vmax' ] );

			expect( state ).toBe( '50vmax' );

			await user.selectOptions( select, [ 'pt' ] );

			expect( state ).toBe( '50pt' );
		} );

		it( 'should set correct unit if single units', async () => {
			let state = '50%';
			const setState = ( value ) => ( state = value );

			const { user } = render(
				<UnitControl
					value={ state }
					unit="%"
					units={ [ { value: '%', label: '%' } ] }
					onChange={ setState }
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '62' );

			await waitFor( () => expect( state ).toBe( '62%' ) );
		} );

		it( 'should update unit value when a new raw value is passed', async () => {
			const { user } = render( <ControlledSyncUnits /> );

			const [ inputA, inputB ] = screen.getAllByRole( 'spinbutton' );
			const [ selectA, selectB ] = screen.getAllByRole( 'combobox' );

			const [ remOptionA ] = screen.getAllByRole( 'option', {
				name: 'rem',
			} );
			const [ , vwOptionB ] = screen.getAllByRole( 'option', {
				name: 'vw',
			} );

			await user.type( inputA, '55' );

			await user.type( inputB, '14' );

			await user.selectOptions( selectA, remOptionA );

			await waitFor( () => expect( selectB ).toHaveValue( 'rem' ) );
			expect( selectA ).toHaveValue( 'rem' );

			await user.selectOptions( selectB, vwOptionB );

			await waitFor( () => expect( selectA ).toHaveValue( 'vw' ) );
			expect( selectB ).toHaveValue( 'vw' );
		} );
	} );

	describe( 'Unit Parser', () => {
		let state = '10px';
		const setState = jest.fn( ( nextState ) => ( state = nextState ) );

		it( 'should parse unit from input', async () => {
			const { user } = render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '55 em' );
			user.keyboard( '{Enter}' );

			expect( state ).toBe( '55em' );
		} );

		it( 'should parse PX unit from input', async () => {
			const { user } = render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '61   PX' );
			user.keyboard( '{Enter}' );

			expect( state ).toBe( '61px' );
		} );

		it( 'should parse EM unit from input', async () => {
			const { user } = render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '55 em' );
			user.keyboard( '{Enter}' );

			expect( state ).toBe( '55em' );
		} );

		it( 'should parse % unit from input', async () => {
			const { user } = render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '-10  %' );
			user.keyboard( '{Enter}' );

			expect( state ).toBe( '-10%' );
		} );

		it( 'should parse REM unit from input', async () => {
			const { user } = render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '123       rEm  ' );
			user.keyboard( '{Enter}' );

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
