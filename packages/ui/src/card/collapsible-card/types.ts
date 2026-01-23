import type { ReactNode } from 'react';
import type { Collapsible } from '@base-ui/react/collapsible';

export interface CollapsibleCardProps
	extends Pick<
		Collapsible.Root.Props,
		'open' | 'onOpenChange' | 'disabled'
	> {
	/**
	 * The card title displayed in the header.
	 */
	title: ReactNode;

	/**
	 * Optional summary displayed in the header.
	 */
	summary?: ReactNode;

	/**
	 * The main content of the card.
	 */
	children?: ReactNode;

	/**
	 * Accessible label for the collapse toggle button.
	 * @default "Toggle content"
	 */
	toggleLabel?: string;

	/**
	 * Additional class name applied to the card container.
	 */
	className?: string;
}
