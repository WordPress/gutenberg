/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';

/*
 * Layout the widget renders at, derived from its own measured size:
 * - `compact`: too small for the drafts list; the form/message shows alone
 *   plus a link that reveals the list in place.
 * - `row`: wide enough to place the drafts list beside the form.
 * - `column`: tall enough (and not wide) to stack the list under the form.
 */
export type DisplayMode = 'compact' | 'row' | 'column';

/*
 * Thresholds, in pixels, measured on the widget's own root (the tile minus
 * card padding), not on the tile itself. `BESIDE_MIN_WIDTH` is the width at or
 * above which the list fits next to the form; `BELOW_MIN_HEIGHT` the height at
 * or above which it fits stacked below. Tuned by eye against the default grid
 * (minColumnWidth 350, rowHeight 200); revisit if the tile metrics change.
 */
const BESIDE_MIN_WIDTH = 560;
const BELOW_MIN_HEIGHT = 360;

type Size = { width: number; height: number };

const INITIAL_SIZE: Size = { width: 0, height: 0 };

/*
 * Observes the widget root and maps its size to a `DisplayMode`. Starts at
 * `compact` (zero size) until the first measurement, so the drafts list and
 * its request stay dormant until there is room to show them. Returns a
 * callback ref to attach to the element whose size should drive the layout.
 */
export function useDisplayMode(): {
	ref: ( element?: HTMLDivElement | null ) => void;
	mode: DisplayMode;
} {
	const [ size, setSize ] = useState< Size >( INITIAL_SIZE );

	const ref = useResizeObserver< HTMLDivElement >(
		( entries ) => {
			const entry = entries[ 0 ];
			if ( ! entry ) {
				return;
			}

			const box = entry.borderBoxSize?.[ 0 ];
			const width = box ? box.inlineSize : entry.contentRect.width;
			const height = box ? box.blockSize : entry.contentRect.height;

			setSize( ( prev ) =>
				prev.width === width && prev.height === height
					? prev
					: { width, height }
			);
		},
		{ box: 'border-box' }
	);

	const mode = useMemo< DisplayMode >( () => {
		if ( size.width >= BESIDE_MIN_WIDTH ) {
			return 'row';
		}

		if ( size.height >= BELOW_MIN_HEIGHT ) {
			return 'column';
		}

		return 'compact';
	}, [ size.width, size.height ] );

	return { ref, mode };
}
