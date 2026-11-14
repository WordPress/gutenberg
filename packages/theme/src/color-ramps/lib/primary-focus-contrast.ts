import { serialize, to, sRGB } from 'colorjs.io/fn';
import {
	MINIMUM_NON_TEXT_CONTRAST,
	MINIMUM_TEXT_CONTRAST,
} from '../../semantic-color-contrast-pairs.ts';
import { buildRamp } from './index.ts';
import { ACCENT_RAMP_CONFIG } from './ramp-configs.ts';
import { BLACK, WHITE, CONTRAST_COMBINATIONS } from './constants.ts';
import {
	clampToGamut,
	getColorString,
	getContrast,
	parseSeedColor,
} from './color-utils.ts';
import { findColorMeetingRequirements } from './find-color-with-constraints.ts';
import { adjustContrastTarget } from './utils.ts';
import type { RampResult } from './types.ts';

type BuildOptions = NonNullable< Parameters< typeof buildRamp >[ 2 ] >;

function getSurfaces( primary: RampResult, background: RampResult ) {
	return [
		background.ramp.surface1,
		background.ramp.surface2,
		background.ramp.surface3,
		primary.ramp.surface1,
	];
}

function getTightestSurface(
	surfaces: string[],
	direction: RampResult[ 'direction' ]
) {
	const endpoint = direction === 'lighter' ? WHITE : BLACK;
	return surfaces.reduce( ( tightest, current ) =>
		getContrast( current, endpoint ) < getContrast( tightest, endpoint )
			? current
			: tightest
	);
}

function enforceSurfaceTextContrast(
	primary: RampResult,
	background: RampResult
) {
	// Matching OKLCH lightness across ramps does not guarantee matching WCAG
	// luminance. Check the actual neutral colors before reusing brand text.
	const surfaces = [
		...getSurfaces( primary, background ),
		primary.ramp.surface2,
		primary.ramp.surface3,
	];
	let ramp = primary.ramp;
	for ( const step of [ 'fgSurface3', 'fgSurface4' ] as const ) {
		if (
			surfaces.every(
				( surface ) =>
					getContrast( ramp[ step ], surface ) >=
					MINIMUM_TEXT_CONTRAST
			)
		) {
			continue;
		}
		const solution = findColorMeetingRequirements(
			clampToGamut(
				parseSeedColor(
					getTightestSurface( surfaces, primary.direction )
				)
			),
			clampToGamut( parseSeedColor( ramp[ step ] ) ),
			adjustContrastTarget( MINIMUM_TEXT_CONTRAST ),
			primary.direction
		);
		const color = getColorString( solution.color );
		if (
			surfaces.every(
				( surface ) =>
					getContrast( color, surface ) >= MINIMUM_TEXT_CONTRAST
			)
		) {
			ramp = { ...ramp, [ step ]: color };
		}
	}
	return ramp === primary.ramp ? primary : { ...primary, ramp };
}

function meetsConstraints( primary: RampResult, background: RampResult ) {
	if ( primary.warnings?.length ) {
		return false;
	}
	const { ramp } = primary;
	return (
		getSurfaces( primary, background ).every( ( surface ) =>
			[ ramp.stroke3, ramp.bgFill1, ramp.bgFill2 ].every(
				( color ) =>
					getContrast( color, surface ) >= MINIMUM_NON_TEXT_CONTRAST
			)
		) &&
		CONTRAST_COMBINATIONS.every( ( { bgs, fgs, target } ) =>
			bgs.every( ( bg ) =>
				fgs.every(
					( fg ) => getContrast( ramp[ bg ], ramp[ fg ] ) >= target
				)
			)
		)
	);
}

/**
 * Keep brand fills and focus visible against neutral and brand surfaces.
 * Rebuild the whole primary ramp so text and active-state constraints remain
 * part of the calculation, then check brand text on the neutral surfaces too.
 * Leave unresolved pairs to the provider's semantic warning checks.
 *
 * @param initial    Existing primary ramp.
 * @param background Background ramp.
 * @param options    Direction and pinned surface lightness for this background.
 */
export function enforcePrimaryFocusContrast(
	initial: RampResult,
	background: RampResult,
	options: BuildOptions
): RampResult {
	if ( meetsConstraints( initial, background ) ) {
		return enforceSurfaceTextContrast( initial, background );
	}

	const direction = background.direction;
	const buildOptions = { ...options, rescaleToFitContrastTargets: false };
	let primary = initial;
	for ( let iteration = 0; iteration < 4; iteration++ ) {
		const reference = getTightestSurface(
			getSurfaces( primary, background ),
			direction
		);
		const anchor = clampToGamut( parseSeedColor( primary.ramp.bgFill1 ) );
		const solution = findColorMeetingRequirements(
			clampToGamut( parseSeedColor( reference ) ),
			anchor,
			adjustContrastTarget( MINIMUM_NON_TEXT_CONTRAST ),
			direction
		);
		let candidate = buildRamp(
			serialize( to( solution.color, sRGB ), { precision: 10 } ),
			ACCENT_RAMP_CONFIG,
			buildOptions
		);

		if ( candidate.warnings?.includes( 'fgFill' ) ) {
			// A shared foreground must contrast with both fill states. Move past
			// the middle-lightness region where neither black nor white can do so.
			const textSolution = findColorMeetingRequirements(
				direction === 'lighter' ? BLACK : WHITE,
				clampToGamut( parseSeedColor( candidate.ramp.bgFill1 ) ),
				adjustContrastTarget(
					ACCENT_RAMP_CONFIG.fgFill.contrast.target
				),
				direction
			);
			candidate = buildRamp(
				serialize( to( textSolution.color, sRGB ), { precision: 10 } ),
				ACCENT_RAMP_CONFIG,
				buildOptions
			);
		}

		if ( meetsConstraints( candidate, background ) ) {
			return enforceSurfaceTextContrast( candidate, background );
		}
		if ( candidate.ramp.bgFill1 === primary.ramp.bgFill1 ) {
			break;
		}
		primary = candidate;
	}
	return enforceSurfaceTextContrast( initial, background );
}
