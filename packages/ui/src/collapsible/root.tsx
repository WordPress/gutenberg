import { forwardRef } from '@wordpress/element';
import { Collapsible as _Collapsible } from '@base-ui/react/collapsible';
import type { RootProps } from './types';

/**
 * Groups all parts of the collapsible.
 *
 * `Collapsible` is a collection of React components that combine to render
 * a collapsible panel controlled by a button.
 */
export const Root = forwardRef< HTMLDivElement, RootProps >(
	function CollapsibleRoot( { ...otherProps }, forwardedRef ) {
		return <_Collapsible.Root ref={ forwardedRef } { ...otherProps } />;
	}
);
