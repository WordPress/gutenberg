/**
 * Internal dependencies
 */
import { GRID_ITEM_DATA_KEY } from './grid-item-key';
import exitStyles from './item-exit-animation.module.css';
import type { RectSnapshot } from './use-layout-shift-animation';

export type ItemExitOverlayRect = Pick<
	RectSnapshot,
	'left' | 'top' | 'width' | 'height'
>;

export type ItemExitOverlayProps = {
	itemKey: string;
	rect: ItemExitOverlayRect;
	children: React.ReactNode;
	onAnimationEnd: () => void;
};

/**
 * Ghost tile shown at the removed item's last position while siblings
 * reflow. Not a sortable grid cell — only visual exit feedback.
 *
 * @param root0                Component props.
 * @param root0.itemKey        Layout key of the removed tile.
 * @param root0.rect           Last bounds relative to the grid surface.
 * @param root0.children       Cached tile content to render in the ghost.
 * @param root0.onAnimationEnd Called when the exit animation finishes.
 */
export function ItemExitOverlay( {
	itemKey,
	rect,
	children,
	onAnimationEnd,
}: ItemExitOverlayProps ) {
	return (
		<div
			className={ exitStyles[ 'exit-overlay' ] }
			style={ {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height,
			} }
			{ ...{ [ GRID_ITEM_DATA_KEY ]: itemKey } }
			data-wp-grid-item-exiting=""
			onAnimationEnd={ ( event ) => {
				if ( event.target !== event.currentTarget ) {
					return;
				}
				onAnimationEnd();
			} }
		>
			{ children }
		</div>
	);
}
