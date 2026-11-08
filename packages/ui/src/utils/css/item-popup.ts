import itemPopupStyles from './item-popup.module.css';

/**
 * Preset width constraints for item popups.
 */
export type ItemPopupWidth =
	'anchor' | 'content' | 'sm' | 'md' | 'lg' | 'available';

export type ItemPopupWidthProps = {
	/**
	 * Controls how the popup width is constrained relative to its anchor.
	 *
	 * For all presets, the popup is never narrower than its anchor.
	 *
	 * In Select, the size presets set a maximum width and size to content.
	 * In Combobox and Autocomplete, they set a fixed width so the popup stays
	 * stable as its content changes.
	 *
	 * - `'anchor'`: Fixed width matching the anchor width.
	 * - `'content'`: Width grows with item labels between the anchor and available
	 *   viewport bounds.
	 * - `'sm'`: Small surface width token (`--wpds-dimension-surface-width-sm`).
	 * - `'md'`: Medium surface width token (`--wpds-dimension-surface-width-md`).
	 * - `'lg'`: Large surface width token (`--wpds-dimension-surface-width-lg`).
	 * - `'available'`: Fixed width at the available viewport width (`--available-width`).
	 *
	 * @default 'anchor'
	 */
	width?: ItemPopupWidth;
};

export function getItemPopupWidthClassName(
	width: ItemPopupWidth | undefined = 'anchor'
): string | false {
	switch ( width ) {
		case 'available':
			return itemPopupStyles[ 'is-width-available' ];
		case 'content':
			return itemPopupStyles[ 'is-width-content' ];
		case 'lg':
			return itemPopupStyles[ 'is-width-lg' ];
		case 'md':
			return itemPopupStyles[ 'is-width-md' ];
		case 'sm':
			return itemPopupStyles[ 'is-width-sm' ];
		case 'anchor':
			return itemPopupStyles[ 'is-width-anchor' ];
		default:
			return false;
	}
}
