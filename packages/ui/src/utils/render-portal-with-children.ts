import { cloneElement } from '@wordpress/element';
import type { ReactElement, ReactNode } from 'react';

/**
 * Renders overlay markup (`children`) through an optional `portal` element from
 * `portal={ <Component.Portal … /> }`, or through the package default portal.
 *
 * Shared by overlay `Popup` components so portal merge behavior stays consistent.
 *
 * @param portal        Optional element from the `portal` prop (should have no
 *                      `children`; callers type this via `Omit<PortalProps,'children'>`).
 *                      When omitted, `defaultPortal` is used. Injected `children`
 *                      replace any subtree on the portal element.
 * @param defaultPortal Unpopulated default portal element (e.g. `<Dialog.Portal />`).
 * @param children      Popup subtree (backdrop, positioner, etc.) to inject as the portal’s children.
 */
export function renderPortalWithChildren(
	portal: ReactElement | undefined,
	defaultPortal: ReactElement,
	children: ReactNode
): ReactElement {
	const rootPortal = portal ?? defaultPortal;

	return cloneElement( rootPortal, {
		children,
	} );
}
