import type { DEFAULT_SEED_COLORS } from './color-ramps/lib/constants.ts';
import { getContrast } from './color-ramps/lib/color-utils.ts';
import type { Ramp, RampResult } from './color-ramps/lib/types.ts';
import {
	getSemanticColorCustomProperty,
	MINIMUM_TEXT_CONTRAST,
	SEMANTIC_COLOR_CONTRAST_PAIRS,
	type SemanticColorToken,
} from './semantic-color-contrast-pairs.ts';

export type ThemeProviderColorRampName = keyof typeof DEFAULT_SEED_COLORS;

export type ThemeProviderSemanticColorToken = SemanticColorToken;

export type ThemeProviderColorWarning =
	| {
			type: 'ramp';
			ramp: ThemeProviderColorRampName;
			step: keyof Ramp;
	  }
	| {
			type: 'contrast';
			backgroundToken: ThemeProviderSemanticColorToken;
			backgroundColor: string;
			foregroundToken: ThemeProviderSemanticColorToken;
			foregroundColor: string;
			requiredContrast: number;
			achievedContrast: number;
	  };

export function collectThemeProviderColorWarnings(
	ramps: ReadonlyMap< ThemeProviderColorRampName, RampResult >,
	colorValues: ReadonlyMap< string, string >
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
	}

	for ( const {
		background: backgroundToken,
		foreground: foregroundToken,
	} of SEMANTIC_COLOR_CONTRAST_PAIRS ) {
		const backgroundColor = colorValues.get(
			getSemanticColorCustomProperty( backgroundToken )
		);
		const foregroundColor = colorValues.get(
			getSemanticColorCustomProperty( foregroundToken )
		);

		if ( backgroundColor === undefined || foregroundColor === undefined ) {
			continue;
		}

		const achievedContrast = getContrast(
			backgroundColor,
			foregroundColor
		);

		if ( achievedContrast < MINIMUM_TEXT_CONTRAST ) {
			warnings.push( {
				type: 'contrast',
				backgroundToken,
				backgroundColor,
				foregroundToken,
				foregroundColor,
				requiredContrast: MINIMUM_TEXT_CONTRAST,
				achievedContrast,
			} );
		}
	}

	return warnings;
}
