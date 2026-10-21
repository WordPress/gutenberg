/**
 * Column count per container width. Each key is the inline size in pixels
 * from which its count applies: `{ 0: 1, 600: 2, 960: 4 }` is one column
 * from 0px, two from 600px, four from 960px. An `'auto'` step lifts the
 * cap from its width up and leaves the count to `minColumnWidth`; with no
 * floor set, the step is skipped and the count below it holds.
 */
export type ColumnSteps = Record< number, number | 'auto' >;

/**
 * Column policy shared by the surfaces: a count at every width, or a count
 * per container width, with an optional per-column floor in pixels.
 */
export interface ColumnPolicy {
	columns?: number | ColumnSteps;
	minColumnWidth?: number;
}

function resolveFloor( { minColumnWidth }: ColumnPolicy ): number | undefined {
	return minColumnWidth !== undefined && minColumnWidth > 0
		? minColumnWidth
		: undefined;
}

/**
 * The count the policy asks for at a container width, before the floor.
 *
 * @param policy         Column policy.
 * @param containerWidth Measured inline size of the surface in pixels.
 * @return The count, or `undefined` when none applies: no count was set, or
 *         an `'auto'` step lifts the cap over a floor.
 */
export function resolveColumnCap(
	policy: ColumnPolicy,
	containerWidth: number
): number | undefined {
	const { columns } = policy;
	if ( columns === undefined || typeof columns === 'number' ) {
		return columns;
	}
	const hasFloor = resolveFloor( policy ) !== undefined;
	const widths = Object.keys( columns )
		.map( Number )
		.filter( Number.isFinite )
		.filter( ( width ) => hasFloor || columns[ width ] !== 'auto' )
		.sort( ( a, b ) => b - a );
	if ( widths.length === 0 ) {
		return undefined;
	}
	const reached = widths.find( ( width ) => containerWidth >= width );
	const step = columns[ reached ?? widths[ widths.length - 1 ] ];
	return typeof step === 'number' ? step : undefined;
}

/**
 * Resolves the count a surface renders: the policy's count at the container
 * width, lowered by the floor so no column is narrower than
 * `minColumnWidth`. A floor with no count fits as many columns as the
 * container allows.
 *
 * @param policy         Column policy.
 * @param containerWidth Measured inline size of the surface in pixels.
 * @param gapPx          Column gap in pixels.
 * @param defaultColumns Count used when the policy sets neither field.
 * @return Column count, at least one.
 */
export function resolveColumnCount(
	policy: ColumnPolicy,
	containerWidth: number,
	gapPx: number,
	defaultColumns: number
): number {
	const cap = resolveColumnCap( policy, containerWidth );
	const floor = resolveFloor( policy );
	if ( floor === undefined ) {
		return Math.max( 1, cap ?? defaultColumns );
	}
	const maxFit = Math.max(
		1,
		Math.floor( ( containerWidth + gapPx ) / ( floor + gapPx ) )
	);
	return cap === undefined ? maxFit : Math.max( 1, Math.min( cap, maxFit ) );
}
