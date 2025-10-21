/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useTermContext } from '../utils/use-context-data';

/**
 * Hook to fetch term count based on context or fallback to template parsing.
 *
 * This hook prioritizes context-provided termId and taxonomy, but falls back to
 * template-based detection when no context is available.
 *
 * @param {string|number} termId   The term ID from context
 * @param {string}        taxonomy The taxonomy name from context
 */
export function useTermCount( termId, taxonomy ) {
	const [ count ] = useEntityProp( 'taxonomy', taxonomy, 'count', termId );
	const { hasContext, term } = useTermContext( termId, taxonomy );

	return {
		hasContext,
		termCount: hasContext ? count || '' : term?.count || '',
	};
}
