import { type ReactNode } from 'react';
import { type ComponentProps } from '../utils/types';

export interface LinkProps extends Omit< ComponentProps< 'a' >, 'target' > {
	/**
	 * Where to open the linked document. `"_blank"` also adds the visual
	 * indicator and accessible new-tab notice.
	 *
	 * When both `target` and `openInNewTab` are set, `target` determines the
	 * browsing context.
	 */
	target?: ComponentProps< 'a' >[ 'target' ];

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
	 * Adds a visual indicator and accessible notice for opening in a new tab.
	 * Defaults `target` to `"_blank"` when no explicit target is set.
	 *
	 * @default false
	 */
	openInNewTab?: boolean;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}
