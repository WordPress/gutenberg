/**
 * WordPress dependencies
 */
import { useRef, forwardRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRovingTabIndexContext } from './roving-tab-index-context';
import type { RovingTabIndexItemProps } from './types';

export const RovingTabIndexItem = forwardRef(
	function UnforwardedRovingTabIndexItem(
		{
			children,
			as: Component,
			initiallyFocusable = false,
			...props
		}: RovingTabIndexItemProps & { initiallyFocusable?: boolean },
		forwardedRef: React.ForwardedRef< any >
	) {
		const localRef = useRef< any >( null );
		const ref = forwardedRef || localRef;

		const [ isFirstItem, setIsFirstItem ] = useState( false );

		const {
			lastFocusedElement,
			setLastFocusedElement,
			hasInitialFocusableItem,
			setHasInitialFocusableItem,
		} = useRovingTabIndexContext() ?? {};

		useEffect( () => {
			if ( initiallyFocusable ) {
				setIsFirstItem( true );
				setHasInitialFocusableItem?.( true );
				return;
			}

			if ( ! hasInitialFocusableItem ) {
				setIsFirstItem( true );
				setHasInitialFocusableItem?.( true );
			}
		}, [
			initiallyFocusable,
			hasInitialFocusableItem,
			setHasInitialFocusableItem,
		] );

		// Determine tabIndex
		let tabIndex;

		if ( lastFocusedElement ) {
			tabIndex =
				lastFocusedElement ===
				( 'current' in ref ? ref.current : undefined )
					? 0
					: -1;
		} else {
			tabIndex = isFirstItem ? 0 : -1;
		}

		const onFocus: React.FocusEventHandler< HTMLElement > = ( event ) => {
			setLastFocusedElement?.( event.target );
		};

		const allProps = { ref, tabIndex, onFocus, ...props };

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
