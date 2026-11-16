import { describe, expect, it } from 'vitest';
import {
	FULL_TURN,
	getLastStepInTurn,
	getNearestEquivalent,
	getShortestTurn,
	roundToStep,
	wrapToStep,
} from '../utils';

describe( 'Knob utils', () => {
	it( 'measures one full turn in each unit', () => {
		expect( FULL_TURN ).toEqual( {
			deg: 360,
			turn: 1,
			rad: 2 * Math.PI,
			grad: 400,
		} );
	} );

	it( 'rounds to fractional steps without floating point noise', () => {
		expect( roundToStep( 0.1 + 0.2, 0.01, 0 ) ).toBe( 0.3 );
		expect( roundToStep( 1.5707963, 0.01, 0 ) ).toBe( 1.57 );
		expect( roundToStep( 0.2549, 0.001, 0 ) ).toBe( 0.255 );
	} );

	it( 'finds the last step before a full turn', () => {
		expect( getLastStepInTurn( 1, FULL_TURN.deg ) ).toBe( 359 );
		expect( getLastStepInTurn( 0.01, FULL_TURN.turn ) ).toBe( 0.99 );
		expect( getLastStepInTurn( 0.01, FULL_TURN.rad ) ).toBe( 6.28 );
		expect( getLastStepInTurn( 1, FULL_TURN.grad ) ).toBe( 399 );
	} );

	it( 'wraps into one turn and snaps a full turn to 0', () => {
		expect( wrapToStep( 1.004, 0.01, FULL_TURN.turn ) ).toBe( 0 );
		expect( wrapToStep( -0.25, 0.01, FULL_TURN.turn ) ).toBe( 0.75 );
		expect( wrapToStep( 6.2831, 0.01, FULL_TURN.rad ) ).toBe( 6.28 );
		expect( wrapToStep( 6.2851, 0.01, FULL_TURN.rad ) ).toBe( 0 );
		expect( wrapToStep( 450, 1, FULL_TURN.grad ) ).toBe( 50 );
	} );

	it( 'measures turns in the given unit', () => {
		expect( getNearestEquivalent( 0.25, -0.9, FULL_TURN.turn ) ).toBe(
			-0.75
		);
		expect( getShortestTurn( 0.9, 0.1, FULL_TURN.turn ) ).toBeCloseTo(
			0.2
		);
		expect( getShortestTurn( 10, 390, FULL_TURN.grad ) ).toBe( -20 );
	} );
} );
