/**
 * WordPress dependencies
 */
import { DateTimePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import InspectorPopoverHeader from '../inspector-popover-header';

export function PublishDateTimePicker(
	{ onClose, onChange, showPopoverHeaderActions, ...additionalProps },
	ref
) {
	return (
		<div ref={ ref } className="block-editor-publish-date-time-picker">
			<InspectorPopoverHeader
				title={ __( 'Publish' ) }
				actions={
					showPopoverHeaderActions
						? [
								{
									label: __( 'Now' ),
									onClick: () => onChange?.( null ),
								},
						  ]
						: undefined
				}
				onClose={ onClose }
			/>
			<DateTimePicker
				startOfWeek={ getSettings().l10n.startOfWeek }
				onChange={ onChange }
				{ ...additionalProps }
			/>
		</div>
	);
}

export const PrivatePublishDateTimePicker = forwardRef( PublishDateTimePicker );

function PublicPublishDateTimePicker( props, ref ) {
	return (
		<PrivatePublishDateTimePicker
			{ ...props }
			showPopoverHeaderActions
			ref={ ref }
		/>
	);
}

export default forwardRef( PublicPublishDateTimePicker );
