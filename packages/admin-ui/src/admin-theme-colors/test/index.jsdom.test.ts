import { describe, expect, it } from 'vitest';
import { ADMIN_THEME_COLORS, getAdminThemeColors } from '../index';
// The ramp builders are not public API, so reach into the package source.
import {
	buildAccentRamp,
	buildBgRamp,
} from '../../../../theme/src/color-ramps/index';

describe( 'getAdminThemeColors', () => {
	it( 'should return the colors for the admin theme from the body class', () => {
		document.body.className = 'foo admin-color-coffee bar';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#8e6544',
			background: '#5b534d',
		} );
	} );

	it( 'should fall back to the modern scheme colors when no admin-color class is present', () => {
		document.body.className = 'foo bar';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#3858e9',
			background: '#222524',
		} );
	} );

	it( 'should fall back to the default colors for an unknown scheme', () => {
		document.body.className = 'admin-color-unknown';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#3858e9',
			background: '#222524',
		} );
	} );
} );

describe( 'ADMIN_THEME_COLORS', () => {
	it.each( [ ...ADMIN_THEME_COLORS ] )(
		'should give filled brand surfaces white text on the %s scheme',
		( _scheme, { primary, background } ) => {
			const { ramp } = buildAccentRamp(
				primary,
				buildBgRamp( background )
			);

			// The text color on a brand-colored fill must be near-white, as on
			// every other admin screen, rather than black.
			expect( ramp.fgFill.toLowerCase() ).toMatch(
				/^#(f[a-f0-9]){3}$|^#fff$/
			);
		}
	);
} );
