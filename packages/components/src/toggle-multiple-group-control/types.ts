/**
 * Internal dependencies
 */
import type {
	ToggleGroupControlOptionIconProps,
	ToggleGroupControlProps,
} from '../toggle-group-control/types';

export type ToggleMultipleGroupControlProps = Pick<
	ToggleGroupControlProps,
	'children' | 'label' | 'help' | 'hideLabelFromVision' | 'size'
>;

export type ToggleMultipleGroupControlOptionIconProps =
	ToggleGroupControlOptionIconProps & {
		/**
		 * Whether the button is pressed.
		 *
		 * @default false
		 */
		isPressed: boolean;
		/**
		 * Listen to click events to manage the `isPressed` state.
		 */
		onClick: () => void;
	};
