import { Modal, Popover as WCPopover } from '@wordpress/components';

/** Whether the Components implementations used by media support UI overlays. */
export function supportsUiOverlays() {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	const globalComponents = (
		window as Window & {
			wp?: {
				components?: {
					Modal?: { supportsUiOverlays?: boolean };
					Popover?: { supportsUiOverlays?: boolean };
				};
			};
		}
	 ).wp?.components;
	return (
		Modal.supportsUiOverlays === true &&
		WCPopover.supportsUiOverlays === true &&
		( ! globalComponents ||
			( globalComponents.Modal?.supportsUiOverlays === true &&
				globalComponents.Popover?.supportsUiOverlays === true ) )
	);
}
