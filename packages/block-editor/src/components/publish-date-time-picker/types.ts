import type { ComponentProps } from 'react';
import type { DateTimePicker } from '@wordpress/components';

/**
 * Props of `PublishDateTimePicker`: the props of `DateTimePicker`, plus the
 * popover header.
 */
export type PublishDateTimePickerProps = ComponentProps<
	typeof DateTimePicker
> & {
	/**
	 * The title displayed in the header of the popover.
	 */
	title?: string;
	/**
	 * Called when the user presses the close button.
	 */
	onClose?: () => void;
	/**
	 * Whether to render the popover header.
	 */
	showPopoverHeader?: boolean;
};

/**
 * Props of the private `PublishDateTimePicker`.
 */
export type PrivatePublishDateTimePickerProps = PublishDateTimePickerProps & {
	/**
	 * Whether to render the "Reset" action in the popover header.
	 */
	showPopoverHeaderActions?: boolean;
	/**
	 * Whether to only pick the time.
	 */
	isCompact?: boolean;
};
