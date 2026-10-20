import type { ForwardedRef } from 'react';
import { DateTimePicker, TimePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { getSettings } from '@wordpress/date';
import InspectorPopoverHeader from '../inspector-popover-header';
import type {
	PrivatePublishDateTimePickerProps,
	PublishDateTimePickerProps,
} from './types';

export function PublishDateTimePicker(
	{
		onClose,
		onChange,
		showPopoverHeader = true,
		showPopoverHeaderActions,
		isCompact,
		currentDate,
		title,
		...additionalProps
	}: PrivatePublishDateTimePickerProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const datePickerProps = {
		startOfWeek: getSettings().l10n.startOfWeek,
		onChange,
		currentDate: isCompact ? undefined : currentDate,
		currentTime: isCompact ? currentDate : undefined,
		...additionalProps,
	};
	// `TimePicker` ignores the date props.
	const DatePickerComponent = (
		isCompact ? TimePicker : DateTimePicker
	) as typeof DateTimePicker;
	return (
		<div ref={ ref } className="block-editor-publish-date-time-picker">
			{ showPopoverHeader && (
				<InspectorPopoverHeader
					title={ title || __( 'Publish' ) }
					actions={
						showPopoverHeaderActions
							? [
									{
										label: __( 'Reset' ),
										onClick: () => onChange?.( null ),
									},
								]
							: undefined
					}
					onClose={ onClose }
				/>
			) }
			<DatePickerComponent { ...datePickerProps } />
		</div>
	);
}

export const PrivatePublishDateTimePicker = forwardRef( PublishDateTimePicker );

function PublicPublishDateTimePicker(
	props: PublishDateTimePickerProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	return (
		<PrivatePublishDateTimePicker
			{ ...props }
			showPopoverHeaderActions
			isCompact={ false }
			ref={ ref }
		/>
	);
}

export default forwardRef( PublicPublishDateTimePicker );
