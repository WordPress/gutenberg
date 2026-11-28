import warning from '@wordpress/warning';
import type { DashboardGridItemResizeWidths } from '@wordpress/grid';
import type {
	DashboardWidthOption,
	DashboardWidthValue,
	WidgetGridModel,
} from '../../types';

/**
 * What a host's `widthOptions` resolve to, validated once for the whole
 * dashboard:
 *
 * - `default`: no list supplied, or the dashboard runs the masonry
 *   model (which stores numeric widths only), so the feature does not
 *   engage and the dashboard keeps its current width menu and snapping.
 * - `custom`: the host's choices, validated and in declared order; the
 *   first choice is the insertion default.
 * - `invalid`: the list is malformed. Width changes and insertions fail
 *   closed for width governance rather than restoring unrestricted
 *   choices.
 */
export type WidthOptionsResolution =
	| { kind: 'default' }
	| { kind: 'custom'; options: readonly DashboardWidthOption[] }
	| { kind: 'invalid' };

/**
 * Dev-only hint for an invalid list; the warning package is a no-op in
 * production builds.
 *
 * @param reason What is wrong with the configuration.
 */
function warnInvalid( reason: string ): void {
	warning(
		`WidgetDashboard: ${ reason } Width changes and insertions now fail closed for width governance instead of restoring the unrestricted choices.`
	);
}

/**
 * Dev-only hint for a list the masonry model cannot consume. The
 * dashboard keeps its current behavior, so this is not a failure.
 */
function warnIgnoredOnMasonry(): void {
	warning(
		'WidgetDashboard: widthOptions applies to the grid model only; the masonry model stores numeric widths only, so the list is ignored there.'
	);
}

function isWidthValue( value: unknown ): value is DashboardWidthValue {
	if ( value === 'fill' || value === 'full' ) {
		return true;
	}
	return typeof value === 'number' && Number.isInteger( value ) && value > 0;
}

function isWidthOption( option: unknown ): option is DashboardWidthOption {
	if ( option === null || typeof option !== 'object' ) {
		return false;
	}
	const candidate = option as Partial< DashboardWidthOption >;
	return (
		isWidthValue( candidate.value ) &&
		typeof candidate.label === 'string' &&
		candidate.label.length > 0
	);
}

/**
 * Validates a host's width choices for the dashboard model. The first
 * choice is the insertion default; every value must be unique. On the
 * masonry model the choices are not applicable (`DashboardLanes` stores
 * numeric widths only), so the dashboard keeps its current behavior and
 * the list is ignored, with a development warning.
 *
 * @param options The host's choices, as passed on `WidgetDashboard`.
 * @param model   The dashboard's grid model.
 * @return The validated list, or the `default`/`invalid` resolution.
 */
export function resolveWidthOptions(
	options: readonly DashboardWidthOption[] | undefined,
	model: WidgetGridModel
): WidthOptionsResolution {
	if ( options === undefined ) {
		return { kind: 'default' };
	}
	if ( model === 'masonry' ) {
		warnIgnoredOnMasonry();
		return { kind: 'default' };
	}
	if ( ! Array.isArray( options ) || options.length === 0 ) {
		warnInvalid( 'widthOptions must be a nonempty array of choices.' );
		return { kind: 'invalid' };
	}

	const seen = new Set< DashboardWidthValue >();
	for ( const option of options ) {
		if ( ! isWidthOption( option ) ) {
			warnInvalid(
				"Every width option needs a value (a positive integer, 'fill', or 'full') and a nonempty label."
			);
			return { kind: 'invalid' };
		}
		if ( seen.has( option.value ) ) {
			warnInvalid( 'Every width option needs a unique value.' );
			return { kind: 'invalid' };
		}
		seen.add( option.value );
	}

	return { kind: 'custom', options };
}

/**
 * Projects the resolved choices onto the grid's per-item gesture
 * targets. Every item receives the same tokens, `'fill'` is stripped (it
 * is a menu choice, not a horizontal target), and a failed configuration
 * yields empty lists, which freeze the width axis. The `default`
 * resolution returns `undefined`, keeping the grid's current snapping.
 *
 * @param widthOptions The resolved width choices.
 * @param itemKeys     Keys of the items to govern.
 * @return Per-item width tokens, or `undefined` for the default behavior.
 */
export function toItemResizeWidths(
	widthOptions: WidthOptionsResolution,
	itemKeys: readonly string[]
): DashboardGridItemResizeWidths | undefined {
	if ( widthOptions.kind === 'default' ) {
		return undefined;
	}

	const tokens =
		widthOptions.kind === 'custom'
			? widthOptions.options
					.filter( ( option ) => option.value !== 'fill' )
					.map( ( option ) => option.value as number | 'full' )
			: [];
	const map: DashboardGridItemResizeWidths = {};
	for ( const key of itemKeys ) {
		map[ key ] = tokens;
	}
	return map;
}
