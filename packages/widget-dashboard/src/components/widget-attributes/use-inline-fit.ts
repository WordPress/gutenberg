import type { Ref } from 'react';
import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { useWidgetHeaderAvailableSize } from '../widget-header/widget-header-fit';

// Spare room (px) a collapsed presentation needs before it expands again, so
// a tile resized around a threshold cannot flip between presentations.
const EXPAND_BUFFER = 16;

/**
 * How the high-relevance controls show in the header, from most to least
 * expanded: the inline controls, one select holding a single field's
 * options, or the "Widget controls" button and its popover.
 */
export type InlinePresentation = 'inline' | 'select' | 'dropdown';

const RANK: Record< InlinePresentation, number > = {
	inline: 0,
	select: 1,
	dropdown: 2,
};

interface InlineFitOptions {
	/**
	 * Whether the select step is available: exactly one high-relevance
	 * field, with a fixed set of options. Without it the inline controls
	 * collapse straight to the dropdown.
	 */
	canSelect?: boolean;

	/**
	 * Holds a collapsed presentation while the user interacts with it (a
	 * focused select, an open dropdown, focus on its trigger), so it does
	 * not expand under them; the expansion applies when the hold releases.
	 * Collapsing is never held: controls that no longer fit would be
	 * clipped, so they collapse even while the user interacts with them.
	 */
	locked?: boolean;
}

interface InlineFit {
	/**
	 * Ref for the element wrapping the inline controls at their natural
	 * width. While mounted, the measurement tracks it live; when the caller
	 * unmounts it, the last value is retained and drives the expand-back
	 * decision, and remounting re-measures it.
	 */
	measureRef: Ref< HTMLDivElement >;

	/**
	 * Ref for the element wrapping the select, measured and retained the
	 * same way. Until the select has mounted once its width is unknown, so
	 * the first collapse tries it and steps on if it does not fit.
	 */
	selectMeasureRef: Ref< HTMLSpanElement >;

	/**
	 * The presentation that fits the header's budget.
	 */
	presentation: InlinePresentation;
}

/**
 * Decides which presentation of the attribute controls fits the space the
 * header row can grant its toolbar.
 *
 * Each step compares a measured natural width against the budget: the
 * inline controls collapse once they exceed it, and the select steps down
 * to the dropdown once it exceeds it in turn. Going back up, a step needs
 * `EXPAND_BUFFER` to spare. The budget does not depend on the presentation,
 * so each threshold sits at the same tile width whichever way it is
 * resized.
 *
 * @param {InlineFitOptions} [options] Fit options.
 */
export function useInlineFit( options: InlineFitOptions = {} ): InlineFit {
	const { canSelect = false, locked = false } = options;

	const availableSize = useWidgetHeaderAvailableSize();
	const [ naturalSize, setNaturalSize ] = useState( 0 );
	const [ selectSize, setSelectSize ] = useState( 0 );
	const [ held, setHeld ] = useState< InlinePresentation >( 'inline' );

	const measureRef = useResizeObserver< HTMLDivElement >( ( [ entry ] ) =>
		setNaturalSize( entry.contentRect.width )
	);
	const selectMeasureRef = useResizeObserver< HTMLSpanElement >(
		( [ entry ] ) => setSelectSize( entry.contentRect.width )
	);

	// Whether a presentation `size` wide fits, given where the fit stands:
	// once collapsed past it, it needs spare room to return.
	const fits = ( size: number, step: InlinePresentation ) =>
		availableSize !== null &&
		size + ( RANK[ held ] > RANK[ step ] ? EXPAND_BUFFER : 0 ) <=
			availableSize;

	// The zero guard keeps environments without layout (JSDOM) on the
	// inline presentation. An unmeasured select is tried, so it can be
	// measured.
	let computed: InlinePresentation;
	if ( availableSize === null || naturalSize === 0 ) {
		computed = 'inline';
	} else if ( fits( naturalSize, 'inline' ) ) {
		computed = 'inline';
	} else if (
		canSelect &&
		( selectSize === 0 || fits( selectSize, 'select' ) )
	) {
		computed = 'select';
	} else {
		computed = 'dropdown';
	}

	// The latch: while locked, a collapsed presentation is not expanded
	// under the user; releasing the lock lets the expansion apply. A
	// collapse applies at once, locked or not. Losing the select step
	// (the fields changed) drops a held select to the dropdown.
	let presentation = computed;
	if ( locked && RANK[ held ] > RANK[ computed ] ) {
		presentation = held === 'select' && ! canSelect ? 'dropdown' : held;
	}
	if ( held !== presentation ) {
		setHeld( presentation );
	}

	return { measureRef, selectMeasureRef, presentation };
}
