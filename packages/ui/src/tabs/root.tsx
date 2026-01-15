import { forwardRef } from '@wordpress/element';
import { Tabs as BaseUITabs } from '@base-ui/react/tabs';
import type { TabRootProps } from './types';

/**
 * Groups the tabs and the corresponding panels.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Root = forwardRef< HTMLDivElement, TabRootProps >(
	function TabsRoot( { ...otherProps }, forwardedRef ) {
		return <BaseUITabs.Root ref={ forwardedRef } { ...otherProps } />;
	}
);
