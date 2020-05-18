/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RovingTabIndexProvider } from './roving-tab-index-context';

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/components/src/roving-tab-index/README.md
 */
export default function RovingTabIndex( { children } ) {
	const [ lastFocusedElement, setLastFocusedElement ] = useState();

	// Use `useMemo` to avoid creation of a new object for the providerValue
	// on every render. Only create a new object when the `lastFocusedElement`
	// value changes.
	const providerValue = useMemo(
		() => ( { lastFocusedElement, setLastFocusedElement } ),
		[ lastFocusedElement ]
	);

	return (
		<RovingTabIndexProvider value={ providerValue }>
			{ children }
		</RovingTabIndexProvider>
	);
}
