import { Icon as WCIcon, type IconType } from '@wordpress/components';

export default function renderActionIcon(
	icon: IconType | null | undefined
): IconType | null | undefined {
	// Preserve the default size of Dashicon strings.
	if ( ! icon || typeof icon === 'string' ) {
		return icon;
	}
	return <WCIcon icon={ icon } data-wp-editor-icon />;
}
