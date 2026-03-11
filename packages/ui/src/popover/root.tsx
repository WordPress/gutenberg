import { Popover as _Popover } from '@base-ui/react/popover';
import type { RootProps } from './types';

/**
 * Groups the popover trigger and popup.
 *
 * `Popover` is a collection of React components that combine to render
 * an ARIA-compliant popover anchored to a trigger button.
 */
function Root( props: RootProps ) {
	return <_Popover.Root { ...props } />;
}

export { Root };
