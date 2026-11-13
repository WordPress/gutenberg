import { clampSpan } from '../shared/resize-snap';
import type { SpanBounds } from '../shared/resize-snap';

/**
 * Width tokens a resize gesture can commit, as `itemResizeWidths` lists
 * them: a numeric column span or `'full'`. A span beyond the grid's
 * resolved column count resolves down to it. `'fill'` is deliberately not
 * expressible here: it is a menu choice, not a horizontal target, since
 * its span depends on the row and a moving gesture cannot target it.
 */
export type ResizeWidthToken = number | 'full';

/**
 * One gesture target resolved for the current geometry: the token to
 * store when the target commits, and the column span it renders at.
 */
export interface ResolvedWidthChoice {
	token: ResizeWidthToken;
	span: number;
}

/**
 * The width one resize frame resolves to: the span the snap outline and
 * the preview align to, and the token the commit retains. The token is
 * whatever the choice or the gesture start carried, so `'full'` can
 * survive a gesture and a legacy `width` outside the choices stays
 * stored while the pointer has not moved it.
 */
export interface ResolvedGestureWidth {
	span: number;
	token: number | 'full' | 'fill' | undefined;
}

/**
 * Resolves the gesture targets to concrete spans for the current
 * geometry: `'full'` takes the item's largest allowed span, numeric
 * tokens clamp between the item's span bounds. Every target stays a
 * distinct candidate so ties can favor the host's declared order.
 *
 * @param tokens           Width tokens in the order the host declared.
 * @param bounds           Span bounds from the item's pixel limits, if any.
 * @param effectiveColumns Number of column tracks in the grid.
 */
export function resolveWidthChoices(
	tokens: readonly ResizeWidthToken[],
	bounds: SpanBounds | undefined,
	effectiveColumns: number
): ResolvedWidthChoice[] {
	const minWidth = bounds?.minWidth ?? 1;
	const maxWidth = bounds?.maxWidth ?? effectiveColumns;
	return tokens.map( ( token ) => ( {
		token,
		span:
			token === 'full'
				? maxWidth
				: clampSpan( token, minWidth, maxWidth ),
	} ) );
}

/**
 * Snaps one resize frame to the configured width choices.
 *
 * The pointer-implied span (gesture baseline plus the delta in columns,
 * clamped to the item's bounds) is matched against the resolved targets.
 * An unchanged horizontal span preserves the gesture-start token: a
 * narrow container where two choices look identical must not swap the
 * stored token, and a legacy width outside the choices stays stored
 * until the pointer actually moves it. Other ties prefer the
 * gesture-start choice if it is eligible (the start token is one of the
 * choices tying at the winning span), then the host's option order.
 *
 * @param args                  Frame inputs.
 * @param args.impliedSpan      Pointer-implied span, clamped internally.
 * @param args.startSpan        Resolved span of the gesture-start token.
 * @param args.startToken       The token stored at gesture start.
 * @param args.choices          Resolved choices in the host's order.
 * @param args.bounds           Span bounds from the item's pixel limits, if any.
 * @param args.effectiveColumns Number of column tracks in the grid.
 */
export function snapSpanToWidthChoices( {
	impliedSpan,
	startSpan,
	startToken,
	choices,
	bounds,
	effectiveColumns,
}: {
	impliedSpan: number;
	startSpan: number;
	startToken: number | 'full' | 'fill' | undefined;
	choices: readonly ResolvedWidthChoice[];
	bounds: SpanBounds | undefined;
	effectiveColumns: number;
} ): ResolvedGestureWidth {
	const minWidth = bounds?.minWidth ?? 1;
	const maxWidth = bounds?.maxWidth ?? effectiveColumns;
	const span = clampSpan( impliedSpan, minWidth, maxWidth );

	if ( span === startSpan ) {
		return { span, token: startToken };
	}

	let bestDistance = Infinity;
	const winners: ResolvedWidthChoice[] = [];
	for ( const choice of choices ) {
		const distance = Math.abs( choice.span - span );
		if ( distance < bestDistance ) {
			bestDistance = distance;
			winners.length = 0;
			winners.push( choice );
		} else if ( distance === bestDistance ) {
			winners.push( choice );
		}
	}
	if ( winners.length === 0 ) {
		return { span, token: startToken };
	}
	// Eligible start choice first, then option order: the winners array
	// already carries the host's order.
	const chosen =
		winners.find( ( choice ) => choice.token === startToken ) ??
		winners[ 0 ];
	return { span: chosen.span, token: chosen.token };
}
