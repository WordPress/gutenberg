import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp } from '..';
import { getContrast } from '../lib/color-utils';

describe( 'accent focus contrast', () => {
	it.each( [
		{ background: '#fcfcfc', ring: '#3858e9' },
		{ background: '#1e1e1e', ring: '#8eb0ff' },
	] )(
		'preserves the passing ring on $background',
		( { background, ring } ) => {
			const neutral = buildBgRamp( background );
			const result = buildAccentRamp( '#3858e9', neutral );

			expect( result.ramp.stroke3 ).toBe( ring );
			for ( const surface of [
				neutral.ramp.surface1,
				neutral.ramp.surface2,
				neutral.ramp.surface3,
				result.ramp.surface1,
			] ) {
				expect(
					getContrast( result.ramp.stroke3, surface )
				).toBeGreaterThanOrEqual( 3 );
			}
		}
	);

	it.each( [
		{
			primary: '#00ff00',
			background: '#fcfcfc',
			surface: '#b6b6b6',
			fill1: '#0f0',
			fill2: '#00e800',
			foreground: '#1b1f1b',
		},
		{
			primary: '#85767a',
			background: '#fcfcfc',
			surface: '#aaa',
			fill1: '#817276',
			fill2: '#736468',
			foreground: '#fff',
		},
		{
			primary: '#3858e9',
			background: '#1e1e1e',
			surface: '#707070',
			fill1: '#3858e9',
			fill2: '#4367f9',
			foreground: '#fefeff',
		},
	] )(
		'adjusts the final ring for $primary on $surface while preserving the fill pair',
		( { primary, background, surface, fill1, fill2, foreground } ) => {
			const neutral = buildBgRamp( background );
			// Deliberately separate one final surface from the aligned ramp so the
			// cross-ramp constraint needs an adjustment, including after seed fitting.
			neutral.ramp.surface3 = surface;
			const result = buildAccentRamp( primary, neutral );

			for ( const reference of [
				neutral.ramp.surface1,
				neutral.ramp.surface2,
				neutral.ramp.surface3,
				result.ramp.surface1,
			] ) {
				expect(
					getContrast( result.ramp.stroke3, reference )
				).toBeGreaterThanOrEqual( 3 );
			}
			expect( result.ramp.bgFill1 ).toBe( fill1 );
			expect( result.ramp.bgFill2 ).toBe( fill2 );
			expect( result.ramp.fgFill ).toBe( foreground );
			for ( const [ step, target ] of [
				[ 'stroke1', 2.9 ],
				[ 'stroke2', 2.4 ],
				[ 'stroke4', 1.5 ],
			] as const ) {
				expect(
					getContrast( result.ramp.stroke3, result.ramp[ step ] )
				).toBeGreaterThanOrEqual( target );
			}
			expect( result.warnings ).toBeUndefined();
		}
	);

	it( 'reports an unreachable focus constraint without changing the fill pair', () => {
		const neutral = buildBgRamp( '#fcfcfc' );
		neutral.ramp.surface3 = '#555';
		const result = buildAccentRamp( '#3858e9', neutral );

		expect( result.warnings ).toContain( 'stroke3' );
		expect( result.ramp.bgFill1 ).toBe( '#3858e9' );
		expect( result.ramp.bgFill2 ).toBe( '#2e49d9' );
		expect( result.ramp.fgFill ).toBe( '#eff0f2' );
	} );
} );
