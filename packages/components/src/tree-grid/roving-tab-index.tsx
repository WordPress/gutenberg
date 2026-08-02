/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';

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
	initialFocusedIndex = 0,
}: {
	children: React.ReactNode;
	initialFocusedIndex?: number;
} ) {
	const [ lastFocusedElement, setLastFocusedElement ] =
		useState< HTMLElement >();
	const rovingTabIndexItems = useRef< HTMLElement[] >( [] );

	/**
	 * Function to register a RovingTabIndexItem component's DOM element.
	 *
	 * @param {HTMLElement|null} element The DOM element to register.
	 */
	const registerItem = useMemo(
		() => ( element: HTMLElement | null ) => {
			if (
				element &&
				! rovingTabIndexItems.current.includes( element )
			) {
				rovingTabIndexItems.current.push( element );
			}
		},
		[]
	);

	/**
	 * Track whether the initial render has completed.
	 */
	const [ hasRendered, setHasRendered ] = useState( false );

	/**
	 * Set initial focus on the first render.
	 */
	useEffect( () => {
		if ( ! hasRendered ) {
			setHasRendered( true );

			requestAnimationFrame( () => {
				if (
					rovingTabIndexItems.current.length &&
					initialFocusedIndex >= 0 &&
					initialFocusedIndex < rovingTabIndexItems.current.length
				) {
					const initialElement =
						rovingTabIndexItems.current[ initialFocusedIndex ];
					setLastFocusedElement( initialElement );
				}
			} );
		}
	}, [ initialFocusedIndex ] );

	// Use `useMemo` to avoid creation of a new object for the providerValue
	// on every render. Only create a new object when the dependencies change.
	const providerValue = useMemo(
		() => ( {
			lastFocusedElement,
			setLastFocusedElement,
			isInitialRender: ! hasRendered,
			registerItem,
		} ),
		[ lastFocusedElement, registerItem, hasRendered ]
	);

	return (
		<RovingTabIndexProvider value={ providerValue }>
			{ children }
		</RovingTabIndexProvider>
	);
}
