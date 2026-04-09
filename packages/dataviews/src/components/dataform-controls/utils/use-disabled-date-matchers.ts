/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

type DateMatcher = { before: Date } | { after: Date };

export default function useDisabledDateMatchers(
	minConstraint: string | undefined,
	maxConstraint: string | undefined,
	parseDateFn: ( dateString?: string ) => Date | null
): DateMatcher[] | undefined {
	return useMemo( () => {
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
}
