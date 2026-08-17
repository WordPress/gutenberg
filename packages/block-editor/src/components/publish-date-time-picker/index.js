import { DateTimePicker, TimePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { getSettings } from '@wordpress/date';
import InspectorPopoverHeader from '../inspector-popover-header';

export function PublishDateTimePicker(
	{
		onClose,
		onChange,
		showPopoverHeaderActions,
		isCompact,
		currentDate,
		title,
		...additionalProps
	},
	ref
) {
	const datePickerProps = {
		startOfWeek: getSettings().l10n.startOfWeek,
		onChange,
		currentDate: isCompact ? undefined : currentDate,
		currentTime: isCompact ? currentDate : undefined,
		...additionalProps,
	};
	const DatePickerComponent = isCompact ? TimePicker : DateTimePicker;

	const handleNowClick = () => {
		// Both TimePicker and DateTimePicker expect full ISO datetime string without timezone
		const now = new Date().toISOString().slice( 0, 19 );
		onChange?.( now );
	};

	return (
		<div ref={ ref } className="block-editor-publish-date-time-picker">
			<InspectorPopoverHeader
				title={ title || __( 'Publish' ) }
				actions={
					showPopoverHeaderActions
						? [
								{
									label: __( 'Now' ),
									onClick: handleNowClick,
								},
						  ]
						: undefined
				}
				onClose={ onClose }
			/>
			<DatePickerComponent { ...datePickerProps } />
		</div>
	);
}

export const PrivatePublishDateTimePicker = forwardRef( PublishDateTimePicker );

function PublicPublishDateTimePicker( props, ref ) {
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
