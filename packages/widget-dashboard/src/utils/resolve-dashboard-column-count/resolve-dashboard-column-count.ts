import type { ColumnSteps } from '@wordpress/grid';

/**
 * Resolves the column count a host asked for. A finite number is floored,
 * with a floor of one and no ceiling; a map keeps its finite positive
 * entries, keyed by container width, each count floored the same way, and
 * an `'auto'` step only when a floor is set, since the surface skips it
 * otherwise. Anything else, or a map left with no entries, is unset. How
 * many columns a surface can carry is the host's decision, not the
 * package's.
 *
 * @param columns        Host-provided `gridSettings.columns`, if any.
 * @param minColumnWidth Host-provided `gridSettings.minColumnWidth`, if any.
 * @return The count, the steps, or `undefined` when the host set none.
 */
export function resolveDashboardColumns(
	columns?: number | ColumnSteps,
	minColumnWidth?: number
): number | ColumnSteps | undefined {
	if ( typeof columns === 'number' ) {
		return Number.isFinite( columns )
			? Math.max( 1, Math.floor( columns ) )
			: undefined;
	}

	if ( typeof columns !== 'object' || columns === null ) {
		return undefined;
	}

	const hasFloor =
		resolveDashboardMinColumnWidth( minColumnWidth ) !== undefined;
	const steps: ColumnSteps = {};
	for ( const [ width, count ] of Object.entries( columns ) ) {
		const from = Number( width );
		if ( ! Number.isFinite( from ) || from < 0 ) {
			continue;
		}
		if ( count === 'auto' ) {
			if ( hasFloor ) {
				steps[ from ] = 'auto';
			}
			continue;
		}
		if ( typeof count !== 'number' || ! Number.isFinite( count ) ) {
			continue;
		}
		steps[ from ] = Math.max( 1, Math.floor( count ) );
	}

	return Object.keys( steps ).length > 0 ? steps : undefined;
}

/**
 * Resolves the per-column floor a host asked for. A finite positive value is
 * the floor in pixels; anything else leaves it unset.
 *
 * @param minColumnWidth Host-provided `gridSettings.minColumnWidth`, if any.
 * @return The floor in pixels, or `undefined` when the host set none.
 */
export function resolveDashboardMinColumnWidth(
	minColumnWidth?: number
): number | undefined {
	if (
		typeof minColumnWidth !== 'number' ||
		! Number.isFinite( minColumnWidth ) ||
		minColumnWidth <= 0
	) {
		return undefined;
	}

	return minColumnWidth;
}
