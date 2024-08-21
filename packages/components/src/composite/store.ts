/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import type { CompositeStoreProps } from './types';

// Props are already documented in TypeScript types.
// eslint-disable-next-line jsdoc/require-param
/**
 * Creates a composite store.
 *
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
