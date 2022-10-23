/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RovingTabIndexProvider } from './roving-tab-index-context';

/**
 * Provider for adding roving tab index behaviors to tree grid structures.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/components/src/tree-grid/README.md
 *
 * @param {Object}    props          Component props.
 * @param {WPElement} props.children Children to be rendered
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
