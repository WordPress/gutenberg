/**
 * Internal dependencies
 */
import { useAnnotateRanges } from '../inline-markers';
import { SUGGESTION_ANNOTATION_SOURCE } from './format';

/**
 * Decorate inline-suggestion ranges using the annotations API, under the
 * `core-suggestion` source so the decoration never collides with Notes'
 * `core-note` source. Runtime-only: nothing is written back to block content.
 *
 * Callers resolve the ranges (via `findSuggestionRange`) and memoize them; this
 * hook only registers/clears the annotations.
 *
 * @param {Array} ranges Ranges to decorate: `{ id, clientId, attributeKey, start, end }`.
 */
export function useAnnotateSuggestions( ranges ) {
	useAnnotateRanges( SUGGESTION_ANNOTATION_SOURCE, ranges );
}
