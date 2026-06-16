/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
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
 * @param {string} source Annotation source identifier.
 * @param {Array}  ranges Ranges to decorate: `{ id, clientId, attributeKey, start, end }`.
 */
export function useAnnotateRanges( source, ranges ) {
	const {
		__experimentalAddAnnotation: addAnnotation,
		__experimentalRemoveAnnotationsBySource: removeAnnotationsBySource,
	} = useDispatch( annotationsStore );

	useEffect( () => {
		if ( ! ranges?.length ) {
			return;
		}
		for ( const range of ranges ) {
			addAnnotation( {
				id: range.id,
				source,
				blockClientId: range.clientId,
				richTextIdentifier: range.attributeKey,
				range: { start: range.start, end: range.end },
			} );
		}
		return () => {
			removeAnnotationsBySource( source );
		};
	}, [ source, ranges, addAnnotation, removeAnnotationsBySource ] );
}
