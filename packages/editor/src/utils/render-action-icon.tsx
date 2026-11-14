import { Icon as WCIcon } from '@wordpress/components';
import type { IconType } from '@wordpress/components';

/**
 * Mark an editor-owned action icon without changing its size or intrinsic styles.
 *
 * String icons render Dashicons rather than SVGs and need no SVG style hook.
 */
export default function renderActionIcon(
	icon: IconType | null | undefined
): IconType | null | undefined {
	return icon && typeof icon !== 'string' ? (
		<WCIcon icon={ icon } data-wp-editor-icon />
	) : (
		icon
	);
}
