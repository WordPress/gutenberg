import { Tooltip } from '@base-ui/react/tooltip';
import type { RootProps } from './types';

/**
 * `Tooltip` is used to visually show the label of an icon button, or other such interactive controls
 * that don't have a visual text label.
 *
 * Tooltips are not available on touch devices, and thus should not be used for infotips,
 * descriptions, or dynamic status messages.
 *
 * The tooltip itself does not provide any accessible labeling, so when using the
 * `Tooltip` primitive you must ensure that the trigger is accessibly labeled (e.g. with an `aria-label`).
 *
 * See also: [IconButton](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-iconbutton--docs)
 */
function Root( props: RootProps ) {
	return <Tooltip.Root { ...props } />;
}

export { Root };
