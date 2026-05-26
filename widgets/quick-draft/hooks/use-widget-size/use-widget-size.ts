/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';

/*
 * Size thresholds, in pixels, measured on the widget's own root (the tile minus
 * card chrome), not on the tile itself. Tuned by eye against the default grid
 * (minColumnWidth 350, rowHeight 200); each roughly marks where the tile spans
 * about two grid cells in that axis. Revisit if the grid metrics change.
 */
const WIDE_MIN_WIDTH = 560;
const TALL_MIN_HEIGHT = 420;

type Size = { width: number; height: number };

const INITIAL_SIZE: Size = { width: 0, height: 0 };

export type WidgetSize = {
	ref: ( element?: HTMLDivElement | null ) => void;
	width: number;
	height: number;
	isWide: boolean;
	isTall: boolean;
};

/*
 * Measures the widget's own root and reports its size as raw pixels plus two
 * independent boolean axes: `isWide` (room to place content beside the main
 * column) and `isTall` (room for a stacked secondary region). It reports size
 * only; what to render at each size is the consumer's policy. Starts at zero
 * size (both axes false) until the first measurement, so a consumer that gates
 * secondary content on these flags keeps it (and any request it makes) dormant
 * until there is room. Returns a callback ref to attach to the element whose
 * size should drive the layout.
 */
export function useWidgetSize(): WidgetSize {
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

	return useMemo< WidgetSize >(
		() => ( {
			ref,
			width: size.width,
			height: size.height,
			isWide: size.width >= WIDE_MIN_WIDTH,
			isTall: size.height >= TALL_MIN_HEIGHT,
		} ),
		[ ref, size.width, size.height ]
	);
}
