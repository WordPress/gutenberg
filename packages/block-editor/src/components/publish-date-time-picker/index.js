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

function PublishDateTimePicker(
	{ onClose, onChange, ...additionalProps },
	ref
) {
	return (
		<div ref={ ref } className="block-editor-publish-date-time-picker">
			<InspectorPopoverHeader
				title={ __( 'Publish' ) }
				actions={ [
					{
						label: __( 'Now' ),
						onClick: () => onChange?.( null ),
					},
				] }
				onClose={ onClose }
			/>
			<DateTimePicker
				startOfWeek={ getSettings().l10n.startOfWeek }
				__nextRemoveHelpButton
				__nextRemoveResetButton
				onChange={ onChange }
				{ ...additionalProps }
			/>
		</div>
	);
}

export default forwardRef( PublishDateTimePicker );
