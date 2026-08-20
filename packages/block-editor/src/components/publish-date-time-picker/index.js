import { Button, DateTimePicker, TimePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { getSettings } from '@wordpress/date';
import InspectorPopoverHeader from '../inspector-popover-header';

export function PublishDateTimePicker(
	{
		onClose,
		onChange,
		canReset = true,
		showPopoverHeader = true,
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
	const resetDate = () => onChange?.( null );
	// Resetting a date that is already unset does nothing, so offer the action
	// only when there is a date to clear.
	const showHeaderReset = showPopoverHeaderActions && canReset;
	const showInlineReset = ! showPopoverHeader && canReset;
	return (
		<div ref={ ref } className="block-editor-publish-date-time-picker">
			{ showPopoverHeader && (
				<InspectorPopoverHeader
					title={ title || __( 'Publish' ) }
					actions={
						showHeaderReset
							? [
									{
										label: __( 'Reset' ),
										onClick: resetDate,
									},
							  ]
							: undefined
					}
					onClose={ onClose }
				/>
			) }
			<DatePickerComponent { ...datePickerProps } />
			{ /* Without the popover header there is nowhere for the reset
			     action to live, so it closes the picker as a button. */ }
			{ showInlineReset && (
				<Button
					className="block-editor-publish-date-time-picker__reset"
					variant="secondary"
					__next40pxDefaultSize
					onClick={ resetDate }
				>
					{ __( 'Reset' ) }
				</Button>
			) }
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
