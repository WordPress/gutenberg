import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp } from '..';
import { getContrast } from '../lib/color-utils';

describe( 'accent focus contrast', () => {
	it( 'keeps generated rings above 3:1 against neutral and brand surfaces', () => {
		for ( const background of [
			'#fcfcfc',
			'#1e1e1e',
			'#777777',
			'#608010',
		] ) {
			const neutral = buildBgRamp( background );
			for ( const primary of [
				'#3858e9',
				'#00ff00',
				'#ffff00',
				'#85767a',
			] ) {
				const { ramp } = buildAccentRamp( primary, neutral );
				for ( const surface of [
					neutral.ramp.surface1,
					neutral.ramp.surface2,
					neutral.ramp.surface3,
					ramp.surface1,
				] ) {
					expect(
						getContrast( ramp.stroke3, surface )
					).toBeGreaterThanOrEqual( 3 );
				}
			}
		}
	} );
} );
