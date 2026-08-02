/**
 * WordPress dependencies
 */
import { useRef, forwardRef, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRovingTabIndexContext } from './roving-tab-index-context';
import type { RovingTabIndexItemProps } from './types';

export const RovingTabIndexItem = forwardRef(
	function UnforwardedRovingTabIndexItem(
		{ children, as: Component, ...props }: RovingTabIndexItemProps,
		forwardedRef: React.ForwardedRef< any >
	) {
		const localRef = useRef< any >( null );
		const ref = forwardedRef || localRef;
		// @ts-expect-error - We actually want to throw an error if this is undefined.
		const { lastFocusedElement, setLastFocusedElement, registerItem } =
			useRovingTabIndexContext();
		let tabIndex;

		const getElement = useMemo(
			() => () => ( 'current' in ref ? ref.current : undefined ),
			[ ref ]
		);

		// Register this item with the RovingTabIndex parent on mount.
		useEffect( () => {
			registerItem( getElement() );
		}, [ registerItem, getElement ] );

		if ( lastFocusedElement ) {
			tabIndex =
				lastFocusedElement ===
				// TODO: The original implementation simply used `ref.current` here, assuming
				// that a forwarded ref would always be an object, which is not necessarily true.
				// This workaround maintains the original runtime behavior in a type-safe way,
				// but should be revisited.
				( 'current' in ref ? ref.current : undefined )
					? 0
					: -1;
		} else {
			// On initial render, ensure all items have tabIndex="-1" by default.
			tabIndex = -1;
		}

		const onFocus: React.FocusEventHandler< HTMLElement > = ( event ) =>
			setLastFocusedElement?.( event.target );

		const allProps = {
			ref,
			tabIndex,
			onFocus,
			...props,
		};

		if ( typeof children === 'function' ) {
			return children( allProps );
		}

		if ( ! Component ) {
			return null;
		}

		return <Component { ...allProps }>{ children }</Component>;
	}
);
RovingTabIndexItem.displayName = 'RovingTabIndexItem';

export default RovingTabIndexItem;
