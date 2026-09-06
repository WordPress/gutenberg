const FIT_TOLERANCE = 1;

type BreadcrumbLayoutMetrics = {
	availableWidth: number;
	currentItemWidth: number;
	linkItemWidths: number[];
	overflowTriggerWidth: number;
	separatorWidth: number;
};

type BreadcrumbLayout = {
	collapsedIndices: number[];
	shouldMoveFocusToOverflow: boolean;
	shouldTruncateCurrent: boolean;
};

function getCollapsedLayout(
	metrics: BreadcrumbLayoutMetrics,
	pinnedIndex?: number
): BreadcrumbLayout {
	const {
		availableWidth,
		currentItemWidth,
		linkItemWidths,
		overflowTriggerWidth,
		separatorWidth,
	} = metrics;
	const linkCount = linkItemWidths.length;

	if ( linkCount === 0 || availableWidth <= 0 ) {
		return {
			collapsedIndices: [],
			shouldMoveFocusToOverflow: false,
			shouldTruncateCurrent: false,
		};
	}

	const fullWidth =
		linkItemWidths.reduce( ( total, width ) => total + width, 0 ) +
		currentItemWidth +
		separatorWidth * linkCount;

	if ( fullWidth <= availableWidth + FIT_TOLERANCE ) {
		return {
			collapsedIndices: [],
			shouldMoveFocusToOverflow: false,
			shouldTruncateCurrent: false,
		};
	}

	const hasPinnedItem =
		pinnedIndex !== undefined &&
		pinnedIndex >= 0 &&
		pinnedIndex < linkCount;
	const visibleIndices = new Set< number >();
	let visibleWidth = currentItemWidth + overflowTriggerWidth + separatorWidth;
	const candidateFits = ( index: number ) =>
		visibleWidth + linkItemWidths[ index ] + separatorWidth <=
		availableWidth + FIT_TOLERANCE;
	const addVisibleIndex = ( index: number ) => {
		visibleIndices.add( index );
		visibleWidth += linkItemWidths[ index ] + separatorWidth;
	};

	if ( hasPinnedItem ) {
		if ( ! candidateFits( pinnedIndex ) ) {
			const layoutWithoutPin = getCollapsedLayout( metrics );
			return {
				...layoutWithoutPin,
				shouldMoveFocusToOverflow: true,
			};
		}

		addVisibleIndex( pinnedIndex );
	}

	if ( ! visibleIndices.has( 0 ) && candidateFits( 0 ) ) {
		addVisibleIndex( 0 );
	}

	for ( let index = linkCount - 1; index >= 1; index-- ) {
		if ( visibleIndices.has( index ) ) {
			continue;
		}

		if ( ! candidateFits( index ) ) {
			break;
		}
		addVisibleIndex( index );
	}

	const collapsedIndices = linkItemWidths
		.map( ( _, index ) => index )
		.filter( ( index ) => ! visibleIndices.has( index ) );
	const minimumWidth =
		overflowTriggerWidth + currentItemWidth + separatorWidth;

	return {
		collapsedIndices,
		shouldMoveFocusToOverflow: false,
		shouldTruncateCurrent: minimumWidth > availableWidth + FIT_TOLERANCE,
	};
}

export { FIT_TOLERANCE, getCollapsedLayout };
export type { BreadcrumbLayout, BreadcrumbLayoutMetrics };
