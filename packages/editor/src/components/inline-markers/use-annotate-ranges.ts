import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as annotationsStore } from '@wordpress/annotations';

/**
 * Decorate a set of inline ranges using the annotations API. Decoration is
 * runtime-only: annotations are never written back to block content, and every
 * range registered under `source` is cleared together on cleanup.
 *
 * Each consumer passes its own `source` (e.g. `core-note`, `core-suggestion`),
 * which the annotations API turns into an `annotation-text-{source}` class on
 * the rendered `<mark>`, so different consumers' decorations never collide.
 *
 * Callers are responsible for memoizing `ranges` so the effect only re-runs
 * when the resolved ranges actually change.
 *
 * Ranges are applied in the order given, and the annotations API keeps one
 * `core/annotation` format per character, so where two ranges overlap the
 * later one wins. A caller whose ranges can nest orders them itself: the
 * enclosing ranges first and the one that must stay visible (the selected
 * thread) last.
 *
 * @param source Annotation source identifier.
 * @param ranges Ranges to decorate: `{ id, clientId, attributeKey, start, end }`.
 */
export function useAnnotateRanges( source: string, ranges: any[] ) {
	const registry = useRegistry();
	const {
		__experimentalAddAnnotation: addAnnotation,
		__experimentalRemoveAnnotationsBySource: removeAnnotationsBySource,
		__experimentalUpdateAnnotationRange: updateAnnotationRange,
	} = useDispatch( annotationsStore );
	// The ranges currently registered under `source`.
	const appliedRef = useRef< any[] >( [] );

	useEffect( () => {
		const applied = appliedRef.current;
		const next = ranges ?? [];
		/*
		 * Typing inside a marker only moves its range. Updating that range in
		 * place is one annotations store change; clearing the source and
		 * adding everything back is two, and each one re-renders every block
		 * and re-applies the edited rich text, caret included.
		 */
		const isMove =
			applied.length === next.length &&
			next.every(
				( range, index ) =>
					range.id === applied[ index ].id &&
					range.clientId === applied[ index ].clientId &&
					range.attributeKey === applied[ index ].attributeKey
			);
		registry.batch( () => {
			if ( isMove ) {
				next.forEach( ( range, index ) => {
					if (
						range.start !== applied[ index ].start ||
						range.end !== applied[ index ].end
					) {
						updateAnnotationRange(
							range.id,
							range.start,
							range.end
						);
					}
				} );
				return;
			}
			if ( applied.length ) {
				removeAnnotationsBySource( source );
			}
			for ( const range of next ) {
				addAnnotation( {
					id: range.id,
					source,
					blockClientId: range.clientId,
					richTextIdentifier: range.attributeKey,
					range: { start: range.start, end: range.end },
				} );
			}
		} );
		appliedRef.current = next;
	}, [
		registry,
		source,
		ranges,
		addAnnotation,
		removeAnnotationsBySource,
		updateAnnotationRange,
	] );

	useEffect(
		() => () => {
			if ( appliedRef.current.length ) {
				removeAnnotationsBySource( source );
				appliedRef.current = [];
			}
		},
		[ source, removeAnnotationsBySource ]
	);
}
