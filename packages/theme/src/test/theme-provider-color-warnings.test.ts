import { describe, expect, it } from 'vitest';
import { buildBgRamp, type RampResult } from '../color-ramps';
import {
	collectThemeProviderColorWarnings,
	type ThemeProviderColorRampName,
} from '../theme-provider-color-warnings';

describe( 'collectThemeProviderColorWarnings', () => {
	it( 'reports semantic contrast warnings', () => {
		const colorValues = new Map( [
			[
				'--wpds-color-background-interactive-brand-strong-active',
				'#608010',
			],
			[
				'--wpds-color-foreground-interactive-brand-strong-active',
				'#608010',
			],
		] );

		expect(
			collectThemeProviderColorWarnings( new Map(), colorValues )
		).toEqual( [
			{
				type: 'contrast',
				backgroundToken: 'background.interactive.brand-strong-active',
				backgroundColor: '#608010',
				foregroundToken: 'foreground.interactive.brand-strong-active',
				foregroundColor: '#608010',
				requiredContrast: 4.5,
				achievedContrast: 1,
			},
		] );
	} );

	it( 'reports ramp-generation warnings', () => {
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
