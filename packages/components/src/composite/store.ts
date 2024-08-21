/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import type { CompositeStoreProps } from './types';

/**
 * Creates a composite store.
 *
 * @param root0
 * @param root0.focusLoop
 * @param root0.focusWrap
 * @param root0.focusShift
 * @param root0.virtualFocus
 * @param root0.orientation
 * @param root0.rtl
 * @example
 * ```jsx
 * import { Composite, useCompositeStore } from '@wordpress/components';
 *
 * const store = useCompositeStore();
 * <Composite store={store}>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 * </Composite>
 * ```
 */
export function useCompositeStore( {
	focusLoop = false,
	focusWrap = false,
	focusShift = false,
	virtualFocus = false,
	orientation = 'both',
	rtl = false,
	...props
}: CompositeStoreProps = {} ) {
	return Ariakit.useCompositeStore( {
		focusLoop,
		focusWrap,
		focusShift,
		virtualFocus,
		orientation,
		rtl,
		...props,
	} );
}
