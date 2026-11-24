// In a file of its own, so that no other test has built a ramp before: the
// prebuilt ramps must work without building any.

import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeProviderStyles } from '../use-theme-provider-styles';
import {
	buildAccentRamp,
	buildBgRamp,
	DEFAULT_SEED_COLORS,
} from '../color-ramps';

describe( 'useThemeProviderStyles with prebuilt ramps', () => {
	it( 'builds a ramp for a custom primary seed on the prebuilt background ramp', () => {
		const { result } = renderHook( () =>
			useThemeProviderStyles( { color: { primary: '#cf4339' } } )
		);
		const styles = result.current.themeProviderStyles;

		expect( styles[ '--wp-admin-theme-color' ] ).toBe( '#cf4339' );
		expect(
			styles[ '--wpds-color-background-interactive-brand-strong' ]
		).toBe(
			buildAccentRamp(
				'#cf4339',
				buildBgRamp( DEFAULT_SEED_COLORS.background )
			).ramp.bgFill1
		);
	} );
} );
