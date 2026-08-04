import { renderHook } from '@testing-library/react';
import { buildBgRamp, type RampResult } from '../color-ramps';
import {
	collectThemeProviderColorWarnings,
	type ThemeProviderColorRampName,
} from '../theme-provider-color-warnings';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

describe( 'ThemeProvider color warnings', () => {
	it( 'reports structured semantic contrast warnings', () => {
		const { result } = renderHook( () =>
			useThemeProviderStyles( {
				color: {
					primary: '#608010',
					background: '#4f386e',
				},
			} )
		);
		const warning = result.current.colorWarnings.find(
			( item ) =>
				item.type === 'contrast' &&
				item.backgroundToken ===
					'background.interactive.brand-strong-active'
		);

		expect( warning ).toEqual(
			expect.objectContaining( {
				type: 'contrast',
				backgroundToken: 'background.interactive.brand-strong-active',
				foregroundToken: 'foreground.interactive.brand-strong-active',
				requiredContrast: 4.5,
			} )
		);
		expect(
			warning?.type === 'contrast'
				? warning.achievedContrast
				: Number.POSITIVE_INFINITY
		).toBeLessThan( 4.5 );
	} );

	it( 'reports structured ramp-generation warnings', () => {
		const backgroundRamp: RampResult = {
			...buildBgRamp( '#fcfcfc' ),
			warnings: [ 'stroke4' ],
		};
		const ramps = new Map< ThemeProviderColorRampName, RampResult >( [
			[ 'background', backgroundRamp ],
		] );

		expect( collectThemeProviderColorWarnings( ramps, new Map() ) ).toEqual(
			[
				{
					type: 'ramp',
					ramp: 'background',
					step: 'stroke4',
				},
			]
		);
	} );
} );
