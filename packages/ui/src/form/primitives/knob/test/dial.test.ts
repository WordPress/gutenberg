import { describe, expect, it } from 'vitest';
import { crossesMiddle, getDial, isOnDot, modulo, turnBetween } from '../dial';

// A small seeded generator, so that the generated cases are the same on every
// run and a failure can be reproduced.
function createRandom( seed: number ) {
	let state = seed;
	return () => {
		state = ( state * 1664525 + 1013904223 ) % 4294967296;
		return state / 4294967296;
	};
}

const isStep = ( dial: ReturnType< typeof getDial >, step: number ) =>
	Number.isInteger( step ) && step >= dial.first && step <= dial.last;

describe( 'getDial', () => {
	it.each( [
		// A wrapping dial leaves out the full turn, which is zero again.
		{ config: {}, first: 0, last: 359 },
		{ config: { stepsPerTurn: 400 }, first: 0, last: 399 },
		{ config: { stepsPerTurn: 100 }, first: 0, last: 99 },
		{ config: { min: -720, max: 720 }, first: -720, last: 720 },
		{ config: { min: 0, max: 10, stepsPerTurn: 10 }, first: 0, last: 10 },
		// Limits between two steps enclose the whole steps inside them.
		{ config: { min: 0.5, max: 100.7 }, first: 1, last: 100 },
		{ config: { min: -100.7, max: -0.5 }, first: -100, last: -1 },
		// Steps per turn that are not a whole, positive number fall back.
		{ config: { stepsPerTurn: 2 * Math.PI }, first: 0, last: 359 },
		{ config: { stepsPerTurn: 0 }, first: 0, last: 359 },
		{ config: { stepsPerTurn: -4 }, first: 0, last: 359 },
		// A single step per turn would leave nothing to choose.
		{ config: { stepsPerTurn: 1 }, first: 0, last: 359 },
	] )( 'spans $first to $last for $config', ( { config, first, last } ) => {
		const dial = getDial( config );
		expect( [ dial.first, dial.last ] ).toEqual( [ first, last ] );
	} );

	it.each( [
		// A wrapping dial brings a value into one turn.
		{ config: {}, value: 450, step: 90 },
		{ config: {}, value: -45, step: 315 },
		{ config: {}, value: 359.6, step: 0 },
		{ config: {}, value: 359.4, step: 359 },
		{ config: { stepsPerTurn: 4 }, value: 3.6, step: 0 },
		// A dial with as many steps as whole numbers allow still counts.
		{
			config: { stepsPerTurn: Number.MAX_SAFE_INTEGER },
			value: 2,
			step: 2,
		},
		// A bounded dial stops at its ends.
		{ config: { min: -720, max: 720 }, value: 1000, step: 720 },
		{ config: { min: -720, max: 720 }, value: -1000, step: -720 },
		{ config: { min: -720, max: 720 }, value: 269.9, step: 270 },
	] )(
		'shows $value at step $step on $config',
		( { config, value, step } ) => {
			expect( getDial( config ).snap( value ) ).toBe( step );
		}
	);

	it( 'never reports negative zero', () => {
		expect( Object.is( getDial( {} ).snap( -0.4 ), 0 ) ).toBe( true );
		expect( Object.is( getDial( {} ).snap( -360 ), 0 ) ).toBe( true );
		expect(
			Object.is( getDial( { min: -3, max: 3 } ).snap( -0.2 ), 0 )
		).toBe( true );
	} );

	it( 'keeps every step whole, in range, and at its own angle, for generated dials', () => {
		const random = createRandom( 1 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			const stepsPerTurn = 2 + Math.floor( random() * 2000 );
			const wraps = random() < 0.4;
			const min = Math.floor( random() * 8000 ) - 4000;
			const max = min + 1 + Math.floor( random() * 8000 );
			const dial = getDial(
				wraps ? { stepsPerTurn } : { stepsPerTurn, min, max }
			);
			const check = ( rule: string, holds: boolean ) => {
				if ( ! holds ) {
					failures.push(
						`${ rule }: ${ stepsPerTurn } per turn, ${
							wraps ? 'wrapping' : `${ min } to ${ max }`
						}`
					);
				}
			};
			check(
				'has the expected ends',
				wraps
					? dial.first === 0 && dial.last === stepsPerTurn - 1
					: dial.first === min && dial.last === max
			);
			const sampled = [
				dial.first,
				dial.first + 1,
				dial.last - 1,
				dial.last,
				dial.first +
					Math.floor( random() * ( dial.last - dial.first + 1 ) ),
				dial.first +
					Math.floor( random() * ( dial.last - dial.first + 1 ) ),
			];
			for ( const step of sampled ) {
				check( 'a step is its own value', dial.snap( step ) === step );
				check(
					'an angle leads back to its step',
					dial.fromAngle( dial.toAngle( step ) ) === step
				);
				// Any value within half a step shows as that step.
				const nearby = step + ( random() - 0.5 ) * 0.98;
				check(
					'a nearby value snaps to it',
					dial.snap( nearby ) === step
				);
			}
			// Any value at all shows as a step of the dial.
			const anywhere = ( random() - 0.5 ) * 1e7;
			check(
				'every value shows as a step',
				isStep( dial, dial.snap( anywhere ) )
			);
			check(
				'a full turn has the heading of zero',
				Math.abs( turnBetween( 0, dial.toAngle( stepsPerTurn ) ) ) <
					1e-9
			);
		}
		expect( failures ).toEqual( [] );
	} );
} );

describe( 'press', () => {
	it.each( [
		// The heading is taken on the turn nearest to the value.
		{
			config: { min: -720, max: 720 },
			value: -300,
			heading: 90,
			expected: -270,
		},
		{
			config: { min: -720, max: 720 },
			value: 390,
			heading: 90,
			expected: 450,
		},
		// The nearest turn is past the end, so the one before it has the heading.
		{
			config: { min: -720, max: 720 },
			value: 710,
			heading: 90,
			expected: 450,
		},
		// The turn counts from the value as given, not from the step it shows.
		{
			config: { min: -720, max: 720 },
			value: 269.9,
			heading: 90,
			expected: 90,
		},
		// A heading the range has wins over a nearer one it lacks.
		{
			config: { min: 0, max: 315 },
			value: 90,
			heading: -45,
			expected: 315,
		},
		{ config: { min: 0, max: 360 }, value: 0, heading: -21, expected: 339 },
		// No turn has the heading, so the nearer end is selected.
		{
			config: { min: 0, max: 180 },
			value: 0,
			heading: -176.6,
			expected: 180,
		},
		{
			config: { min: 0, max: 180 },
			value: 90,
			heading: -86.6,
			expected: 0,
		},
		{
			config: { min: 0, max: 180 },
			value: 90,
			heading: -93.4,
			expected: 180,
		},
		// A heading that rounds to an end stays on that end's turn.
		{
			config: { min: 0, max: 390 },
			value: 360,
			heading: 30.26,
			expected: 390,
		},
		{
			config: { min: -72, max: 6, stepsPerTurn: 72 },
			value: 6,
			heading: 32,
			expected: 6,
		},
		// Half a step past the end rounds beyond it, so the turn before has
		// the heading.
		{
			config: { min: 0, max: 4, stepsPerTurn: 4 },
			value: 4,
			heading: 45,
			expected: 1,
		},
		// Steps of a quarter turn, two turns either way.
		{
			config: { min: -8, max: 8, stepsPerTurn: 4 },
			value: 0,
			heading: 90,
			expected: 1,
		},
		// A wrapping dial has a single turn, however large the value.
		{ config: {}, value: 1e17, heading: 90, expected: 90 },
		{ config: {}, value: 180, heading: -45, expected: 315 },
		{ config: { stepsPerTurn: 100 }, value: 0, heading: 90, expected: 25 },
	] )(
		'selects $expected for heading $heading from $value on $config',
		( { config, value, heading, expected } ) => {
			const dial = getDial( config );
			const angle = dial.press( heading, dial.toAngle( value ) );
			expect( dial.fromAngle( angle ) ).toBe( expected );
		}
	);

	it( 'selects the pressed heading on the nearest turn that has it, for generated bounded dials', () => {
		const random = createRandom( 2 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			const stepsPerTurn = [ 360, 400, 100, 72, 12, 4 ][
				Math.floor( random() * 6 )
			];
			const stepAngle = 360 / stepsPerTurn;
			const steps = 1 + Math.floor( random() * 4 * stepsPerTurn );
			const min = Math.floor( ( random() - 0.5 ) * 4 * stepsPerTurn );
			const dial = getDial( { min, max: min + steps, stepsPerTurn } );
			const first = dial.toAngle( dial.first );
			const last = dial.toAngle( dial.last );
			const value = min - 5 + random() * ( steps + 10 );
			const heading = random() * 360 - 180;
			// The press counts from the value, kept within the range.
			const from = Math.min(
				last,
				Math.max( first, dial.toAngle( value ) )
			);
			const angle = dial.press( heading, dial.toAngle( value ) );
			const check = ( rule: string, holds: boolean ) => {
				if ( ! holds ) {
					failures.push(
						`${ rule }: ${ stepsPerTurn } per turn, ${ min } to ${
							min + steps
						}, value ${ value }, heading ${ heading }`
					);
				}
			};
			check(
				'selects a step of the dial',
				isStep( dial, dial.fromAngle( angle ) )
			);
			check(
				'has the pressed heading',
				Math.abs( turnBetween( heading, angle ) ) < 1e-6
			);
			// How far each turn of the heading is from the value, for the
			// turns whose nearest step is in the range.
			const fitting = [ -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6 ]
				.map( ( turn ) => heading + 360 * turn )
				.filter( ( candidate ) => {
					const step = Math.round( candidate / stepAngle );
					return step >= dial.first && step <= dial.last;
				} )
				.map( ( candidate ) => Math.abs( candidate - from ) );
			// With no turn that fits, the dial stops at the end nearer to
			// the heading. An exact tie may go either way.
			const toFirst = Math.abs( turnBetween( heading, first ) );
			const toLast = Math.abs( turnBetween( heading, last ) );
			const nearerEnd = toFirst < toLast ? dial.first : dial.last;
			check(
				'takes the nearest turn that fits, or else the nearer end',
				fitting.length
					? Math.abs(
							Math.abs( angle - from ) - Math.min( ...fitting )
						) < 1e-6
					: Math.abs( toFirst - toLast ) < 1e-6 ||
							dial.fromAngle( angle ) === nearerEnd
			);
		}
		expect( failures ).toEqual( [] );
	} );

	it( 'selects the step nearest to the pressed heading, for generated wrapping dials', () => {
		const random = createRandom( 3 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			const stepsPerTurn = 2 + Math.floor( random() * 2000 );
			const dial = getDial( { stepsPerTurn } );
			const heading = random() * 360 - 180;
			const selected = dial.fromAngle(
				dial.press( heading, random() * 5000 )
			);
			// No step is further than half a step from any heading.
			const away = Math.abs(
				turnBetween( heading, dial.toAngle( selected ) )
			);
			if (
				! isStep( dial, selected ) ||
				! ( away <= 180 / stepsPerTurn + 1e-9 )
			) {
				failures.push(
					`${ stepsPerTurn } per turn, heading ${ heading }: step ${ selected }`
				);
			}
		}
		expect( failures ).toEqual( [] );
	} );
} );

describe( 'turnBetween', () => {
	it( 'goes the shorter way round', () => {
		expect( turnBetween( 350, 10 ) ).toBe( 20 );
		expect( turnBetween( 10, 350 ) ).toBe( -20 );
		expect( turnBetween( -170, 170 ) ).toBe( -20 );
		expect( turnBetween( 0, 90 ) ).toBe( 90 );
	} );

	it( 'adds up to the turns a pointer makes, however finely its path is sampled', () => {
		const random = createRandom( 4 );
		// A pointer reports its heading between -180 and 180 degrees.
		const reported = ( angle: number ) => modulo( angle + 180, 360 ) - 180;
		const failures: string[] = [];
		for ( let run = 0; run < 500; run++ ) {
			// A path that never turns half a turn in one move, even when
			// only every third position is kept.
			const start = random() * 360 - 180;
			let position = start;
			let fine = 0;
			let coarse = 0;
			let lastCoarse = start;
			for ( let move = 0; move < 60; move++ ) {
				const next = position + ( random() - 0.4 ) * 80;
				fine += turnBetween( reported( position ), reported( next ) );
				position = next;
				if ( move % 3 === 2 ) {
					coarse += turnBetween(
						reported( lastCoarse ),
						reported( position )
					);
					lastCoarse = position;
				}
			}
			const turned = position - start;
			// Written so that a count that is not a number fails too.
			if (
				! ( Math.abs( fine - turned ) <= 1e-6 ) ||
				! ( Math.abs( coarse - turned ) <= 1e-6 )
			) {
				failures.push(
					`from ${ start }: turned ${ turned }, counted ${ fine } and ${ coarse }`
				);
			}
		}
		expect( failures ).toEqual( [] );
	} );
} );

describe( 'crossesMiddle', () => {
	it( 'is true only for a straight path through the middle of the dial', () => {
		const top = { x: 0, y: -17 };
		const right = { x: 17, y: 0 };
		const bottom = { x: 0, y: 17 };
		expect( crossesMiddle( top, bottom ) ).toBe( true );
		expect( crossesMiddle( bottom, top ) ).toBe( true );
		expect( crossesMiddle( top, right ) ).toBe( false );
		expect( crossesMiddle( top, top ) ).toBe( false );
		// A path that starts in the middle crosses it.
		expect( crossesMiddle( { x: 1, y: 1 }, right ) ).toBe( true );
		// A far pointer that swings almost half a turn stays well clear.
		expect( crossesMiddle( { x: 100, y: -9 }, { x: -100, y: -9 } ) ).toBe(
			false
		);
	} );
} );

describe( 'isOnDot', () => {
	it( 'follows the dot around the dial', () => {
		expect( isOnDot( { x: 0, y: -10 }, 0 ) ).toBe( true );
		expect( isOnDot( { x: 10, y: 0 }, 90 ) ).toBe( true );
		expect( isOnDot( { x: 10, y: 0 }, 450 ) ).toBe( true );
		expect( isOnDot( { x: 0, y: -10 }, 180 ) ).toBe( false );
		// The rim is past the reach of the dot.
		expect( isOnDot( { x: 0, y: -17 }, 0 ) ).toBe( false );
	} );
} );
