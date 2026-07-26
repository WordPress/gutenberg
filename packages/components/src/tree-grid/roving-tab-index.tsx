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
 */
export default function RovingTabIndex( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const [ lastFocusedElement, setLastFocusedElement ] =
		useState< HTMLElement >();

	// Add state to track if we've already set an initial focusable item
	const [ hasInitialFocusableItem, setHasInitialFocusableItem ] =
		useState( false );

	// Use `useMemo` to avoid creation of a new object for the providerValue
	const providerValue = useMemo(
		() => ( {
			lastFocusedElement,
			setLastFocusedElement,
			hasInitialFocusableItem,
			setHasInitialFocusableItem,
		} ),
		[ lastFocusedElement, hasInitialFocusableItem ]
	);

	return (
		<RovingTabIndexProvider value={ providerValue }>
			{ children }
		</RovingTabIndexProvider>
	);
}
