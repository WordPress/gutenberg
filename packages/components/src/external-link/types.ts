/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ExternalLinkProps = {
	/**
	 * The content to be displayed within the link.
	 */
	children: ReactNode;
	/**
	 * The URL of the external resource.
	 */
	href: string;
	/**
	 * Allows for markup other than icons or shortcuts to be added to the menu item.
	 *
	 */
	suffix?: ReactNode;
};
