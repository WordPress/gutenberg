import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp, type RampResult } from '../color-ramps';
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

	it( 'reports insufficient focus-ring contrast against brand surfaces', () => {
		const colorValues = new Map( [
			[ '--wpds-color-stroke-focus', '#fff' ],
			[ '--wpds-color-background-surface-brand', '#fff' ],
		] );

		expect(
			collectThemeProviderColorWarnings( new Map(), colorValues )
		).toEqual( [
			{
				type: 'contrast',
				backgroundToken: 'background.surface.brand',
				backgroundColor: '#fff',
				foregroundToken: 'stroke.focus',
				foregroundColor: '#fff',
				requiredContrast: 3,
				achievedContrast: 1,
			},
		] );
	} );

	it.each( [
		{ color: '#959595', warnings: 1 },
		{ color: '#949494', warnings: 0 },
	] )(
		'checks the unrounded 3:1 threshold for $color',
		( { color, warnings } ) => {
			const colorValues = new Map( [
				[ '--wpds-color-stroke-focus', color ],
				[ '--wpds-color-background-surface-neutral', '#fff' ],
			] );

			expect(
				collectThemeProviderColorWarnings( new Map(), colorValues )
			).toHaveLength( warnings );
		}
	);

	it( 'checks the final fill after seed adjustment', () => {
		const seed = '#1b7e4d';
		const background = buildBgRamp( '#1e1e1e' );
		const primary = buildAccentRamp( seed, background );
		const colorValues = new Map( [
			[
				'--wpds-color-background-interactive-brand-strong',
				primary.ramp.bgFill1,
			],
			[
				'--wpds-color-background-surface-neutral-strong',
				background.ramp.surface3,
			],
		] );

		expect( primary.ramp.bgFill1 ).not.toBe( seed );
		expect(
			collectThemeProviderColorWarnings( new Map(), colorValues )
		).toEqual( [
			{
				type: 'contrast',
				backgroundToken: 'background.surface.neutral-strong',
				backgroundColor: '#242424',
				foregroundToken: 'background.interactive.brand-strong',
				foregroundColor: '#0f7747',
				requiredContrast: 3,
				achievedContrast: expect.closeTo( 2.7719, 4 ),
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
