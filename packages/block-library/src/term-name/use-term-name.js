/**
 * Internal dependencies
 */
import { useTermData } from '../utils/use-context-data';

/**
 * Hook to fetch term name based on context or fallback to template parsing.
 *
 * This hook prioritizes context-provided termId and taxonomy, but falls back to
 * template-based detection when no context is available.
 *
 * @param {string|number} termId   The term ID from context
 * @param {string}        taxonomy The taxonomy name from context
 */
export function useTermName( termId, taxonomy ) {
	return useTermData( termId, taxonomy );
}
