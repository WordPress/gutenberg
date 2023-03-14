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
import UnitControl from '..';
import { parseQuantityAndUnitFromRawValue } from '../utils';
import type { UnitControlOnChangeCallback } from '../types';

const getInput = ( {
	isInputTypeText = false,
}: {
	isInputTypeText?: boolean;
} = {} ) =>
	screen.getByRole(
		isInputTypeText ? 'textbox' : 'spinbutton'
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
		const parsedQuantityAndUnit =
			parseQuantityAndUnitFromRawValue( newValue );
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
			const [ stateQuantity, stateUnit ] =
				parseQuantityAndUnitFromRawValue( stateValue );

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
			const input = getInput();
			const select = getSelect();

			expect( input ).toBeInTheDocument();
			expect( select ).toBeInTheDocument();
		} );

		it( 'should render custom className', () => {
			const { container: withoutClassName } = render( <UnitControl /> );

			const { container: withClassName } = render(
				<UnitControl className="hello" />
			);

			expect(
				// eslint-disable-next-line testing-library/no-node-access
				withoutClassName.querySelector( '.components-unit-control' )
			).not.toHaveClass( 'hello' );
			expect(
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				withClassName.querySelector( '.components-unit-control' )
			).toHaveClass( 'hello' );
		} );

		it( 'should not render select, if units are disabled', () => {
			render( <UnitControl value="3em" units={ [] } /> );
			const input = getInput();
			// Using `queryByRole` instead of `getSelect` because we need to test
			// for this element NOT to be in the document.
			const select = screen.queryByRole( 'combobox' );

			expect( input ).toBeInTheDocument();
			expect( select ).not.toBeInTheDocument();
		} );

		it( 'should render label if single units', () => {
			render( <UnitControl units={ [ { value: '%', label: '%' } ] } /> );

			const select = screen.queryByRole( 'combobox' );
			const label = screen.getByText( '%' );

			expect( select ).not.toBeInTheDocument();
			expect( label ).toBeInTheDocument();
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value on change', async () => {
			const user = userEvent.setup();

			let state = '50px';
			const setState = jest.fn( ( value ) => ( state = value ) );

			render( <UnitControl value={ state } onChange={ setState } /> );

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
			const user = userEvent.setup();

			let state: string | undefined = '50px';
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput();
			await user.type( input, '{ArrowUp}' );

			expect( state ).toBe( '51px' );
		} );

		it( 'should increment value on UP + SHIFT press, with step', async () => {
			const user = userEvent.setup();

			let state: string | undefined = '50px';
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput();
			await user.type( input, '{Shift>}{ArrowUp}{/Shift}' );

			expect( state ).toBe( '60px' );
		} );

		it( 'should decrement value on DOWN press', async () => {
			const user = userEvent.setup();

			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput();
			await user.type( input, '{ArrowDown}' );

			expect( state ).toBe( '49px' );
		} );

		it( 'should decrement value on DOWN + SHIFT press, with step', async () => {
			const user = userEvent.setup();

			let state: string | number | undefined = 50;
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			render( <UnitControl value={ state } onChange={ setState } /> );

			const input = getInput();
			await user.type( input, '{Shift>}{ArrowDown}{/Shift}' );

			expect( state ).toBe( '40px' );
		} );

		it( 'should cancel change when ESCAPE key is pressed', async () => {
			const user = userEvent.setup();

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

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '300px' );

			expect( input.value ).toBe( '300px' );
			expect( state ).toBe( 50 );

			await user.keyboard( '{Escape}' );

			expect( input.value ).toBe( '50' );
			expect( state ).toBe( 50 );
		} );

		it( 'should run onBlur callback when quantity input is blurred', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();
			const onBlurSpy = jest.fn();

			let state: string | undefined = '33%';
			const setState: UnitControlOnChangeCallback = ( nextState ) => {
				onChangeSpy( nextState );
				state = nextState;
			};

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					onBlur={ onBlurSpy }
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '41' );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( '41%' );

			// Clicking document.body to trigger a blur event on the input.
			await user.click( document.body );

			expect( onBlurSpy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should invoke onChange and onUnitChange callbacks when isPressEnterToChange is true and the component is blurred with an uncommitted value', async () => {
			const user = userEvent.setup();

			const onUnitChangeSpy = jest.fn();
			const onChangeSpy = jest.fn();

			let state: string | undefined = '15px';
			const setState: UnitControlOnChangeCallback = ( nextState ) => {
				onChangeSpy( nextState );
				state = nextState;
			};

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					onUnitChange={ onUnitChangeSpy }
					isPressEnterToChange
				/>
			);

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '41vh' );

			// This is because `isPressEnterToChange` is `true`
			expect( onChangeSpy ).not.toHaveBeenCalled();
			expect( onUnitChangeSpy ).not.toHaveBeenCalled();

			// Clicking document.body to trigger a blur event on the input.
			await user.click( document.body );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( '41vh' );

			expect( onUnitChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onUnitChangeSpy ).toHaveBeenLastCalledWith(
				'vh',
				expect.anything()
			);
		} );

		it( 'should update value correctly when typed and blurred when a single unit is passed', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();
			render(
				<>
					<button>Click me</button>
					<UnitControl
						units={ [ { value: '%', label: '%' } ] }
						onChange={ onChangeSpy }
					/>
				</>
			);

			const input = getInput();
			await user.type( input, '62' );

			expect( onChangeSpy ).toHaveBeenLastCalledWith(
				'62%',
				expect.anything()
			);

			// Start counting again calls to `onChangeSpy`.
			onChangeSpy.mockClear();

			// Clicking on the button should cause the `onBlur` callback to fire.
			const button = screen.getByRole( 'button' );
			await user.click( button );

			expect( onChangeSpy ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Unit', () => {
		it( 'should update unit value on change', async () => {
			const user = userEvent.setup();

			let state: string | undefined = '14rem';
			const setState: UnitControlOnChangeCallback = ( nextState ) =>
				( state = nextState );

			const spy = jest.fn();

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					onUnitChange={ spy }
				/>
			);

			const select = getSelect();
			await user.selectOptions( select, [ 'px' ] );

			expect( spy ).toHaveBeenCalledWith( 'px', expect.anything() );
			expect( state ).toBe( '14px' );
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

		it( 'should reset value on unit change, if unit has default value', async () => {
			const user = userEvent.setup();

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
			await user.selectOptions( select, [ 'vmax' ] );

			expect( state ).toBe( '75vmax' );

			await user.selectOptions( select, [ 'pt' ] );

			expect( state ).toBe( '25pt' );
		} );

		it( 'should not reset value on unit change, if disabled', async () => {
			const user = userEvent.setup();

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
			await user.selectOptions( select, [ 'vmax' ] );

			expect( state ).toBe( '50vmax' );

			await user.selectOptions( select, [ 'pt' ] );

			expect( state ).toBe( '50pt' );
		} );

		it( 'should set correct unit if single units', async () => {
			const user = userEvent.setup();

			let state: string | undefined = '50%';
			const setState: UnitControlOnChangeCallback = ( value ) =>
				( state = value );

			render(
				<UnitControl
					value={ state }
					units={ [ { value: '%', label: '%' } ] }
					onChange={ setState }
				/>
			);

			const input = getInput();
			await user.clear( input );
			await user.type( input, '62' );

			expect( state ).toBe( '62%' );
		} );

		it( 'should update unit value when a new raw value is passed', async () => {
			const user = userEvent.setup();

			render( <ControlledSyncUnits /> );

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

			expect( selectB ).toHaveValue( 'rem' );
			expect( selectA ).toHaveValue( 'rem' );

			await user.selectOptions( selectB, vwOptionB );

			expect( selectA ).toHaveValue( 'vw' );
			expect( selectB ).toHaveValue( 'vw' );
		} );

		it( 'should maintain the chosen non-default unit when value is cleared', async () => {
			const user = userEvent.setup();

			const units = [
				{ value: 'pt', label: 'pt' },
				{ value: 'vmax', label: 'vmax' },
			];

			render( <UnitControl units={ units } value="5" /> );

			const select = getSelect();
			await user.selectOptions( select, [ 'vmax' ] );

			const input = getInput();
			await user.clear( input );

			expect( select ).toHaveValue( 'vmax' );
		} );

		it( 'should run onBlur callback when the unit select is blurred', async () => {
			const user = userEvent.setup();

			const onUnitChangeSpy = jest.fn();
			const onBlurSpy = jest.fn();

			render(
				<UnitControl
					value="15px"
					onUnitChange={ onUnitChangeSpy }
					onBlur={ onBlurSpy }
				/>
			);

			const select = getSelect();
			await user.selectOptions( select, [ 'em' ] );

			expect( onUnitChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onUnitChangeSpy ).toHaveBeenLastCalledWith(
				'em',
				expect.anything()
			);

			// Clicking document.body to trigger a blur event on the input.
			await user.click( document.body );

			expect( onBlurSpy ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Unit Parser', () => {
		it( 'should parse unit from input', async () => {
			const user = userEvent.setup();

			let state = '10px';
			const setState = jest.fn( ( nextState ) => ( state = nextState ) );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '55 em' );
			await user.keyboard( '{Enter}' );

			expect( state ).toBe( '55em' );
		} );

		it( 'should parse PX unit from input', async () => {
			const user = userEvent.setup();

			let state = '10px';
			const setState = jest.fn( ( nextState ) => ( state = nextState ) );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '61   PX' );
			await user.keyboard( '{Enter}' );

			expect( state ).toBe( '61px' );
		} );

		it( 'should parse EM unit from input', async () => {
			const user = userEvent.setup();

			let state = '10px';
			const setState = jest.fn( ( nextState ) => ( state = nextState ) );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '55 em' );
			await user.keyboard( '{Enter}' );

			expect( state ).toBe( '55em' );
		} );

		it( 'should parse % unit from input', async () => {
			const user = userEvent.setup();

			let state = '10px';
			const setState = jest.fn( ( nextState ) => ( state = nextState ) );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '-10  %' );
			await user.keyboard( '{Enter}' );

			expect( state ).toBe( '-10%' );
		} );

		it( 'should parse REM unit from input', async () => {
			const user = userEvent.setup();

			let state = '10px';
			const setState = jest.fn( ( nextState ) => ( state = nextState ) );

			render(
				<UnitControl
					value={ state }
					onChange={ setState }
					isPressEnterToChange
				/>
			);

			// Input type is `text` when the `isPressEnterToChange` prop is passed
			const input = getInput( { isInputTypeText: true } );
			await user.clear( input );
			await user.type( input, '123       rEm  ' );
			await user.keyboard( '{Enter}' );

			expect( state ).toBe( '123rem' );
		} );

		it( 'should update unit after initial render and with new unit prop', async () => {
			const { rerender } = render( <UnitControl value={ '10%' } /> );

			const select = getSelect();

			expect( select.value ).toBe( '%' );

			rerender( <UnitControl value={ '20vh' } /> );

			expect( select.value ).toBe( 'vh' );
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
			const options = getSelectOptions();

			expect( select.value ).toBe( '%' );
			expect( options.length ).toBe( 3 );
		} );
	} );
} );
