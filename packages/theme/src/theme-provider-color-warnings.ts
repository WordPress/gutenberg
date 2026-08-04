import { getContrast } from './color-ramps/lib/color-utils';
import type { Ramp, RampResult } from './color-ramps/lib/types';

export type ThemeProviderColorRampName =
	| 'background'
	| 'primary'
	| 'info'
	| 'success'
	| 'caution'
	| 'warning'
	| 'error';

export type ThemeProviderColorWarning =
	| {
			type: 'ramp';
			ramp: ThemeProviderColorRampName;
			step: keyof Ramp;
	  }
	| {
			type: 'contrast';
			ramp: ThemeProviderColorRampName;
			backgroundStep: keyof Ramp;
			backgroundColor: string;
			foregroundStep: keyof Ramp;
			foregroundColor: string;
			requiredContrast: number;
			achievedContrast: number;
	  };

type ContrastPair = {
	backgroundStep: keyof Ramp;
	foregroundStep: keyof Ramp;
	requiredContrast: number;
};

const MINIMUM_TEXT_CONTRAST = 4.5;

const SURFACE_CONTRAST_PAIRS: ContrastPair[] = [
	{
		backgroundStep: 'surface4',
		foregroundStep: 'fgSurface4',
		requiredContrast: MINIMUM_TEXT_CONTRAST,
	},
	{
		backgroundStep: 'surface2',
		foregroundStep: 'fgSurface3',
		requiredContrast: MINIMUM_TEXT_CONTRAST,
	},
];

const FILL_CONTRAST_PAIRS: ContrastPair[] = [
	{
		backgroundStep: 'bgFill1',
		foregroundStep: 'fgFill',
		requiredContrast: MINIMUM_TEXT_CONTRAST,
	},
	{
		backgroundStep: 'bgFill2',
		foregroundStep: 'fgFill',
		requiredContrast: MINIMUM_TEXT_CONTRAST,
	},
];

const CONTRAST_PAIRS: Record< ThemeProviderColorRampName, ContrastPair[] > = {
	background: [
		{
			backgroundStep: 'surface1',
			foregroundStep: 'fgSurface4',
			requiredContrast: MINIMUM_TEXT_CONTRAST,
		},
		{
			backgroundStep: 'surface2',
			foregroundStep: 'fgSurface4',
			requiredContrast: MINIMUM_TEXT_CONTRAST,
		},
		{
			backgroundStep: 'surface3',
			foregroundStep: 'fgSurface4',
			requiredContrast: MINIMUM_TEXT_CONTRAST,
		},
		{
			backgroundStep: 'surface2',
			foregroundStep: 'fgSurface3',
			requiredContrast: MINIMUM_TEXT_CONTRAST,
		},
		{
			backgroundStep: 'bgFillInverted1',
			foregroundStep: 'fgFillInverted',
			requiredContrast: MINIMUM_TEXT_CONTRAST,
		},
		{
			backgroundStep: 'bgFillInverted2',
			foregroundStep: 'fgFillInverted',
			requiredContrast: MINIMUM_TEXT_CONTRAST,
		},
	],
	primary: FILL_CONTRAST_PAIRS,
	info: SURFACE_CONTRAST_PAIRS,
	success: SURFACE_CONTRAST_PAIRS,
	caution: SURFACE_CONTRAST_PAIRS,
	warning: SURFACE_CONTRAST_PAIRS,
	error: [ ...SURFACE_CONTRAST_PAIRS, ...FILL_CONTRAST_PAIRS ],
};

export function collectThemeProviderColorWarnings(
	ramps: Map< ThemeProviderColorRampName, RampResult >
): ThemeProviderColorWarning[] {
	const warnings: ThemeProviderColorWarning[] = [];

	for ( const [ rampName, result ] of ramps ) {
		for ( const step of result.warnings ?? [] ) {
			warnings.push( {
				type: 'ramp',
				ramp: rampName,
				step,
			} );
		}

		for ( const {
			backgroundStep,
			foregroundStep,
			requiredContrast,
		} of CONTRAST_PAIRS[ rampName ] ) {
			const backgroundColor = result.ramp[ backgroundStep ];
			const foregroundColor = result.ramp[ foregroundStep ];
			const achievedContrast = getContrast(
				backgroundColor,
				foregroundColor
			);

			if ( achievedContrast < requiredContrast ) {
				warnings.push( {
					type: 'contrast',
					ramp: rampName,
					backgroundStep,
					backgroundColor,
					foregroundStep,
					foregroundColor,
					requiredContrast,
					achievedContrast,
				} );
			}
		}
	}

	return warnings;
}
