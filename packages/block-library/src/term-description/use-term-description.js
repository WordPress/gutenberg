/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useTermData } from '../utils/use-context-data';

/**
 * Hook to fetch term description based on context or fallback to template parsing.
 *
 * This hook prioritizes context-provided termId and taxonomy, but falls back to
 * template-based detection when no context is available.
 *
 * @param {string|number} termId   The term ID from context
 * @param {string}        taxonomy The taxonomy name from context
 */
export function useTermDescription( termId, taxonomy ) {
	const [ description, setDescription, fullDescription ] = useEntityProp(
		'taxonomy',
		taxonomy,
		'description',
		termId
	);

	const { hasContext, term } = useTermData( termId, taxonomy );

	return {
		hasContext,
		setDescription,
		termDescription: hasContext
			? fullDescription?.rendered || description || ''
			: term?.description || '',
	};
}
