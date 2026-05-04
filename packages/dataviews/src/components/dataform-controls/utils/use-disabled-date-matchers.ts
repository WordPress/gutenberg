/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NormalizedRules } from '../../../types';

type DateMatcher = { before: Date } | { after: Date };

export default function useDisabledDateMatchers< Item >(
	isValid: NormalizedRules< Item >,
	parseDateFn: ( dateString?: string ) => Date | null
): {
	minConstraint: string | undefined;
	maxConstraint: string | undefined;
	disabledMatchers: DateMatcher[] | undefined;
} {
	const minConstraint =
		typeof isValid.min?.constraint === 'string'
			? isValid.min.constraint
			: undefined;
	const maxConstraint =
		typeof isValid.max?.constraint === 'string'
			? isValid.max.constraint
			: undefined;

	const disabledMatchers = useMemo( () => {
		const matchers: DateMatcher[] = [];
		if ( minConstraint ) {
			const minDate = parseDateFn( minConstraint );
			if ( minDate ) {
				matchers.push( { before: minDate } );
			}
		}
		if ( maxConstraint ) {
			const maxDate = parseDateFn( maxConstraint );
			if ( maxDate ) {
				matchers.push( { after: maxDate } );
			}
		}
		return matchers.length > 0 ? matchers : undefined;
	}, [ minConstraint, maxConstraint, parseDateFn ] );

	return { minConstraint, maxConstraint, disabledMatchers };
}
