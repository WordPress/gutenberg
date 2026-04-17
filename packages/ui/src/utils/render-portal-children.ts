import { cloneElement, isValidElement } from '@wordpress/element';
import type { ReactElement, ReactNode } from 'react';

/**
 * Renders overlay markup (`children`) through an optional `portal` element from
 * `portal={ <Component.Portal … /> }`, or through the package default portal.
 *
 * Shared by overlay `Popup` components so portal merge behavior stays consistent.
 *
 * @param portal        Optional element from the `portal` prop; when omitted, `defaultPortal` is used.
 * @param defaultPortal Unpopulated default portal element (e.g. `<Dialog.Portal />`).
 * @param children      Popup subtree (backdrop, positioner, etc.) to inject as the portal’s children.
 */
export function renderPortalChildren(
	portal: ReactElement | undefined,
	defaultPortal: ReactElement,
	children: ReactNode
): ReactElement {
	const rootPortal = portal ?? defaultPortal;

	if ( isValidElement( rootPortal ) ) {
		return cloneElement( rootPortal, { children } );
	}

	return cloneElement( defaultPortal, { children } );
}
