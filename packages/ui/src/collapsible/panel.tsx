import { Collapsible as _Collapsible } from '@base-ui/react/collapsible';
import { forwardRef } from '@wordpress/element';
import type { PanelProps } from './types';

/**
 * A panel with the collapsible contents. Hidden when collapsed, visible
 * when expanded.
 *
 * `Collapsible` is a collection of React components that combine to render
 * a collapsible panel controlled by a button.
 */
export const Panel = forwardRef< HTMLDivElement, PanelProps >(
	function CollapsiblePanel( props, forwardedRef ) {
		return <_Collapsible.Panel ref={ forwardedRef } { ...props } />;
	}
);
