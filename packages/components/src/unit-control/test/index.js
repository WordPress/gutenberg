/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { UP, DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import UnitControl from '../';

let container = null;

beforeEach( () => {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

const getComponent = () => container.querySelector( '.component-unit-control' );
const getInput = () =>
	container.querySelector( '.component-unit-control__input' );
const getSelect = () =>
	container.querySelector( '.component-unit-control__select' );

describe( 'UnitControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			act( () => {
				render( <UnitControl />, container );
			} );
			const input = getInput();
			const select = getSelect();

			expect( input ).toBeTruthy();
			expect( select ).toBeTruthy();
		} );

		it( 'should render custom className', () => {
			act( () => {
				render( <UnitControl className="hello" />, container );
			} );

			const el = getComponent();

			expect( el.classList.contains( 'hello' ) ).toBe( true );
		} );

		it( 'should not render select, if units are disabled', () => {
			act( () => {
				render( <UnitControl unit="em" units={ false } />, container );
			} );
			const input = getInput();
			const select = getSelect();

			expect( input ).toBeTruthy();
			expect( select ).toBeFalsy();
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value on change', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			act( () => {
				render(
					<UnitControl value={ state } onChange={ setState } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.change( input, { target: { value: 62 } } );
			} );

			expect( state ).toBe( '62' );
		} );

		it( 'should increment value on UP press', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			act( () => {
				render(
					<UnitControl value={ state } onChange={ setState } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP } );
			} );

			expect( state ).toBe( '51' );
		} );

		it( 'should increment value on UP + SHIFT press, with step', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			act( () => {
				render(
					<UnitControl value={ state } onChange={ setState } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: UP, shiftKey: true } );
			} );

			expect( state ).toBe( '60' );
		} );

		it( 'should decrement value on DOWN press', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			act( () => {
				render(
					<UnitControl value={ state } onChange={ setState } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN } );
			} );

			expect( state ).toBe( '49' );
		} );

		it( 'should decrement value on DOWN + SHIFT press, with step', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			act( () => {
				render(
					<UnitControl value={ state } onChange={ setState } />,
					container
				);
			} );

			const input = getInput();

			act( () => {
				Simulate.keyDown( input, { keyCode: DOWN, shiftKey: true } );
			} );

			expect( state ).toBe( '40' );
		} );
	} );

	describe( 'Unit', () => {
		it( 'should update unit value on change', () => {
			let state = 'px';
			const setState = ( nextState ) => ( state = nextState );

			act( () => {
				render(
					<UnitControl unit={ state } onUnitChange={ setState } />,
					container
				);
			} );

			const select = getSelect();

			act( () => {
				Simulate.change( select, { target: { value: 'em' } } );
			} );

			expect( state ).toBe( 'em' );
		} );

		it( 'should render customized units, if defined', () => {
			const units = [
				{ value: 'pt', label: 'pt', default: 0 },
				{ value: 'vmax', label: 'vmax', default: 10 },
			];
			act( () => {
				render( <UnitControl units={ units } />, container );
			} );

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
			act( () => {
				render(
					<UnitControl
						units={ units }
						onChange={ setState }
						value={ state }
					/>,
					container
				);
			} );

			const select = getSelect();

			act( () => {
				Simulate.change( select, { target: { value: 'vmax' } } );
			} );

			expect( state ).toBe( 75 );

			act( () => {
				Simulate.change( select, { target: { value: 'pt' } } );
			} );

			expect( state ).toBe( 25 );
		} );

		it( 'should not reset value on unit change, if disabled', () => {
			let state = 50;
			const setState = ( nextState ) => ( state = nextState );

			const units = [
				{ value: 'pt', label: 'pt', default: 25 },
				{ value: 'vmax', label: 'vmax', default: 75 },
			];
			act( () => {
				render(
					<UnitControl
						isResetValueOnUnitChange={ false }
						value={ state }
						units={ units }
						onChange={ setState }
					/>,
					container
				);
			} );

			const select = getSelect();

			act( () => {
				Simulate.change( select, { target: { value: 'vmax' } } );
			} );

			expect( state ).toBe( 50 );

			act( () => {
				Simulate.change( select, { target: { value: 'pt' } } );
			} );

			expect( state ).toBe( 50 );
		} );
	} );
} );
