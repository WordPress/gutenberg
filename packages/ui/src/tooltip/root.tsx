import { Tooltip } from '@base-ui/react/tooltip';
import type { RootProps } from './types';

/**
 * `Tooltip` is used to visually show the label of an icon button, or other such
 * interactive controls that don't have a visual text label.
 *
 * Tooltip popups are visual-only and not exposed to assistive technologies.
 * The trigger's accessible name (e.g. `aria-label`) is the source of truth
 * for screen reader users. Tooltips are not available on touch devices,
 * and thus should not be used for infotips, descriptions, or dynamic status
 * messages.
 *
 * @see {@link https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-tooltip-usage-guidelines--docs Usage Guidelines}
 * @see {@link https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-iconbutton--docs IconButton}
 */
function Root( props: RootProps ) {
	return <Tooltip.Root { ...props } />;
}

export { Root };
