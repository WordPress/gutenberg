import { type ReactNode } from 'react';
import { type ComponentProps } from '../utils/types';

export interface LinkProps extends Omit< ComponentProps< 'a' >, 'target' > {
	/**
	 * The visual treatment of the link.
	 *
	 * - `default`: Applies tone-based color and underline styles.
	 * - `unstyled`: Strips all visual styles so consumers can bring their own.
	 *
	 * @default "default"
	 */
	variant?: 'default' | 'unstyled';

	/**
	 * The tone of the link. Tone describes a semantic color intent.
	 * Only applies when `variant` is `default`.
	 *
	 * @default "brand"
	 */
	tone?: 'brand' | 'neutral';

	/**
	 * Whether to open the link in a new browser tab.
	 * When true, sets `target="_blank"`, appends a visual arrow indicator,
	 * and prevents navigation for internal anchors (`#`-prefixed hrefs).
	 *
	 * @default false
	 */
	openInNewTab?: boolean;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}
