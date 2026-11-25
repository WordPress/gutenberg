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

type Config = {
	min?: number;
	max?: number;
	step?: number;
	unitsPerTurn?: number;
};

const UNITS = [ 360, 400, 1, 2 * Math.PI ];
const WHOLE_STEPS = [ 1, 0.5, 0.1, 5, 15 ];
const FRACTION_STEPS = [ 0.01, 0.001, 0.05, 0.25 ];

// A dial in one of the supported units. Its step is a decimal, an exact
// fraction of a turn, or the default. Its range wraps, or is bounded by whole
// steps, by whole turns, or by an upper limit that is off the step grid.
function createConfig( random: () => number ): Required< Config > | Config {
	const pick = < T >( items: T[] ) =>
		items[ Math.floor( random() * items.length ) ];
	const unitsPerTurn = pick( UNITS );
	const decimal =
		unitsPerTurn > 100 ? pick( WHOLE_STEPS ) : pick( FRACTION_STEPS );
	const step = pick( [
		undefined,
		decimal,
		unitsPerTurn / ( 3 + Math.floor( random() * 500 ) ),
	] );
	const size = step ?? ( unitsPerTurn > 100 ? 1 : 0.01 );
	switch ( Math.floor( random() * 4 ) ) {
		case 0:
			return { unitsPerTurn, step };
		case 1: {
			const first = Math.floor( random() * 4000 ) - 2000;
			const steps = 2 + Math.floor( random() * 4000 );
			return {
				unitsPerTurn,
				step,
				min: first * size,
				max: ( first + steps ) * size,
			};
		}
		case 2: {
			const turns = 1 + Math.floor( random() * 3 );
			return {
				unitsPerTurn,
				step,
				min: -turns * unitsPerTurn,
				max: turns * unitsPerTurn,
			};
		}
		default:
			return {
				unitsPerTurn,
				step,
				min: 0,
				max: size * ( 2.5 + random() * 500 ),
			};
	}
}

const describeConfig = ( config: Config ) => JSON.stringify( config );

describe( 'getDial', () => {
	it.each( [
		{ config: {}, last: 359 },
		{ config: { unitsPerTurn: 400 }, last: 399 },
		{ config: { unitsPerTurn: 1 }, last: 0.99 },
		{ config: { unitsPerTurn: 2 * Math.PI }, last: 6.28 },
		{ config: { step: 100 }, last: 300 },
		// The steps divide the turn only approximately.
		{ config: { unitsPerTurn: 2.1, step: 0.3 }, last: 1.8 },
		// A step too small to count, or as large as the turn, falls back.
		{ config: { step: 1e-14 }, last: 359 },
		{ config: { step: 360 }, last: 359 },
		{ config: { min: -720, max: 720 }, last: 720 },
		{
			config: { min: -0.3, max: 0.3, step: 0.1, unitsPerTurn: 1 },
			last: 0.3,
		},
		// Decimal bounds whose difference is inexact still end on `max`.
		{ config: { min: 350.1, max: 359.9, step: 0.1 }, last: 359.9 },
		// An inexact step that lands a hair below the limit still ends on it.
		{
			config: {
				min: -2 * Math.PI,
				max: 0,
				step: ( 2 * Math.PI ) / 75,
				unitsPerTurn: 2 * Math.PI,
			},
			last: 0,
		},
		// Far from zero, a limit short of a step still keeps the step below.
		{ config: { min: 1e14, max: 1e14 + 99.875 }, last: 1e14 + 99 },
		// An upper limit off the step grid keeps the step below it.
		{ config: { min: 0, max: 100, step: 30 }, last: 90 },
		{ config: { min: 0, max: 359.9999999995 }, last: 359 },
		// An inexact step that fits a whole number of times ends on the limit.
		{
			config: {
				min: 0,
				max: 2 * Math.PI,
				step: ( 2 * Math.PI ) / 100,
				unitsPerTurn: 2 * Math.PI,
			},
			last: 2 * Math.PI,
		},
	] )( 'ends at $last for $config', ( { config, last } ) => {
		const dial = getDial( config );
		expect( dial.toValue( dial.lastStep ) ).toBe( last );
	} );

	it( 'never reports negative zero', () => {
		const dial = getDial( {
			min: -0.3,
			max: 0.3,
			step: 0.1,
			unitsPerTurn: 1,
		} );
		expect( Object.is( dial.toValue( 3 ), 0 ) ).toBe( true );
	} );

	it( 'snaps a wrapping value to the nearer of the last step and zero', () => {
		const dial = getDial( { step: 100 } );
		expect( dial.toValue( dial.toIndex( 340 ) ) ).toBe( 0 );
		expect( dial.toValue( dial.toIndex( 329 ) ) ).toBe( 300 );
		expect( dial.toValue( dial.toIndex( -45 ) ) ).toBe( 300 );
		expect( getDial( {} ).toValue( getDial( {} ).toIndex( 450 ) ) ).toBe(
			90
		);
	} );

	it( 'counts the steps of generated decimal ranges exactly', () => {
		const random = createRandom( 5 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			// Whole numbers of thousandths, so the expected count is exact.
			const places = Math.floor( random() * 3 );
			const scale = 10 ** places;
			const stepUnits = [ 1, 2, 5, 25 ][ Math.floor( random() * 4 ) ];
			const firstUnits = Math.floor( random() * 8000 ) - 4000;
			const count = 2 + Math.floor( random() * 3000 );
			// Some limits stop short of the next step.
			const extraUnits = Math.floor( random() * stepUnits );
			const config = {
				min: firstUnits / scale,
				max: ( firstUnits + count * stepUnits + extraUnits ) / scale,
				step: stepUnits / scale,
			};
			const dial = getDial( config );
			const expected = ( firstUnits + count * stepUnits ) / scale;
			if (
				dial.lastStep !== count ||
				dial.toValue( dial.lastStep ) !== expected
			) {
				failures.push(
					`${ describeConfig( config ) }: ${ dial.lastStep } steps to ${ dial.toValue(
						dial.lastStep
					) }, expected ${ count } to ${ expected }`
				);
			}
		}
		expect( failures ).toEqual( [] );
	} );

	it( 'ends exactly on a limit that inexact steps reach, for generated ranges', () => {
		const random = createRandom( 6 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			const unitsPerTurn = UNITS[ Math.floor( random() * UNITS.length ) ];
			const step = unitsPerTurn / ( 3 + Math.floor( random() * 500 ) );
			const first = Math.floor( random() * 2000 ) - 1000;
			const count = 2 + Math.floor( random() * 2000 );
			const config = {
				unitsPerTurn,
				step,
				min: first * step,
				max: ( first + count ) * step,
			};
			const dial = getDial( config );
			if (
				dial.lastStep !== count ||
				dial.toValue( dial.lastStep ) !== config.max
			) {
				failures.push(
					`${ describeConfig( config ) }: ${ dial.lastStep } steps to ${ dial.toValue(
						dial.lastStep
					) }, expected ${ count }`
				);
			}
		}
		expect( failures ).toEqual( [] );
	} );

	it( 'keeps every step distinct, in order, and within the range for generated dials', () => {
		const random = createRandom( 1 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			const config = createConfig( random );
			const dial = getDial( config );
			const { lastStep } = dial;
			const top = dial.toValue( lastStep );
			// The limit a step may reach: the full turn, which a wrapping
			// dial leaves out, or `max`.
			const limit = config.max ?? config.unitsPerTurn ?? 360;
			const check = ( rule: string, holds: boolean ) => {
				if ( ! holds ) {
					failures.push( `${ rule }: ${ describeConfig( config ) }` );
				}
			};
			check( 'has at least two steps', lastStep >= 1 );
			check(
				'ends within the range',
				config.max === undefined ? top < limit : top <= limit
			);
			check(
				'ends within a step of the limit',
				limit - top <= dial.step * ( 1 + 1e-9 )
			);
			const sampled = [
				0,
				1,
				lastStep - 1,
				lastStep,
				Math.floor( random() * ( lastStep + 1 ) ),
				Math.floor( random() * ( lastStep + 1 ) ),
			];
			for ( const index of sampled ) {
				const value = dial.toValue( index );
				check(
					'never reports negative zero',
					! Object.is( value, -0 )
				);
				check(
					'a value leads back to its step',
					dial.toIndex( value ) === index
				);
				check(
					'an angle leads back to its step',
					dial.fromAngle( dial.toAngle( index ) ) === index
				);
				check(
					'steps increase',
					index === 0 || value > dial.toValue( index - 1 )
				);
			}
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
			config: { min: -360, max: 30, step: 5 },
			value: 30,
			heading: 32,
			expected: 30,
		},
		// An end at zero is exactly zero in a fractional unit.
		{
			config: { min: -1.1, max: 0, unitsPerTurn: 1 },
			value: 0,
			heading: 0,
			expected: 0,
		},
		// A wrapping dial has a single turn, however large the value.
		{ config: {}, value: 1e17, heading: 90, expected: 90 },
		{ config: {}, value: 180, heading: -45, expected: 315 },
	] )(
		'selects $expected for heading $heading from $value on $config',
		( { config, value, heading, expected } ) => {
			const dial = getDial( config );
			const angle = dial.press( heading, dial.exactAngle( value ) );
			expect( dial.toValue( dial.fromAngle( angle ) ) ).toBe( expected );
		}
	);

	it( 'selects the pressed heading on the nearest turn that has it, for generated bounded dials', () => {
		const random = createRandom( 2 );
		const failures: string[] = [];
		for ( let run = 0; run < 3000; run++ ) {
			const steps = 2 + Math.floor( random() * 1500 );
			const min = Math.floor( random() * 1500 ) - 750;
			const dial = getDial( { min, max: min + steps } );
			const first = dial.toAngle( 0 );
			const last = dial.toAngle( dial.lastStep );
			const value = min - 50 + random() * ( steps + 100 );
			const heading = random() * 360 - 180;
			const from = dial.exactAngle( value );
			const angle = dial.press( heading, from );
			const check = ( rule: string, holds: boolean ) => {
				if ( ! holds ) {
					failures.push(
						`${ rule }: ${ min } to ${ min + steps }, value ${ value }, heading ${ heading }`
					);
				}
			};
			const selected = dial.fromAngle( angle );
			check(
				'selects a step of the dial',
				Number.isInteger( selected ) &&
					selected >= 0 &&
					selected <= dial.lastStep
			);
			check(
				'has the pressed heading',
				Math.abs( turnBetween( heading, angle ) ) < 1e-6
			);
			// How far each turn of the heading is from the value, for the
			// turns that fit the range, give or take the half step that
			// rounds to an end.
			const fitting = [ -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6 ]
				.map( ( turn ) => heading + 360 * turn )
				.filter(
					( candidate ) =>
						candidate >= first - 0.5 && candidate <= last + 0.5
				)
				.map( ( candidate ) => Math.abs( candidate - from ) );
			// With no turn that fits, the dial stops at the end nearer to
			// the heading. An exact tie may go either way.
			const toFirst = Math.abs( turnBetween( heading, first ) );
			const toLast = Math.abs( turnBetween( heading, last ) );
			const nearerEnd = toFirst < toLast ? 0 : dial.lastStep;
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
			const unitsPerTurn = UNITS[ Math.floor( random() * UNITS.length ) ];
			const step = unitsPerTurn / ( 3 + Math.floor( random() * 500 ) );
			const dial = getDial( { unitsPerTurn, step } );
			const heading = random() * 360 - 180;
			const selected = dial.fromAngle(
				dial.press( heading, random() * 5000 )
			);
			const distance = ( index: number ) =>
				Math.abs( turnBetween( heading, dial.toAngle( index ) ) );
			const neighbors = [
				modulo( selected - 1, dial.lastStep + 1 ),
				modulo( selected + 1, dial.lastStep + 1 ),
			];
			if (
				! Number.isInteger( selected ) ||
				selected < 0 ||
				selected > dial.lastStep ||
				neighbors.some(
					( other ) => distance( other ) < distance( selected ) - 1e-6
				)
			) {
				failures.push(
					`${ unitsPerTurn } per turn, step ${ step }, heading ${ heading }`
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
			if (
				Math.abs( fine - turned ) > 1e-6 ||
				Math.abs( coarse - turned ) > 1e-6
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
