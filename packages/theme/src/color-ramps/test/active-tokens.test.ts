/**
 * Internal dependencies
 */
import { buildBgRamp, buildAccentRamp } from '../index';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

describe( 'active state primitive tokens differ from idle', () => {
	const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.bg );
	const primaryRamp = buildAccentRamp( DEFAULT_SEED_COLORS.primary, bgRamp );
	const errorRamp = buildAccentRamp( DEFAULT_SEED_COLORS.error, bgRamp );

	it.each( [
		[ 'bg', bgRamp.ramp, 'fgSurface3', 'fgSurface3Active' ],
		[ 'bg', bgRamp.ramp, 'fgSurface4', 'fgSurface4Active' ],
		[ 'bg', bgRamp.ramp, 'fgFill', 'fgFillActive' ],
		[ 'bg', bgRamp.ramp, 'fgFillInverted', 'fgFillInvertedActive' ],
		[ 'primary', primaryRamp.ramp, 'fgSurface3', 'fgSurface3Active' ],
		[ 'primary', primaryRamp.ramp, 'fgFill', 'fgFillActive' ],
		[ 'error', errorRamp.ramp, 'fgSurface3', 'fgSurface3Active' ],
		[ 'error', errorRamp.ramp, 'fgFill', 'fgFillActive' ],
	] )(
		'%s ramp: %s should differ from %s',
		( _scale, ramp, idleKey, activeKey ) => {
			expect( ramp[ activeKey ] ).toBeDefined();
			expect( ramp[ activeKey ] ).not.toBe( ramp[ idleKey ] );
		}
	);
} );
