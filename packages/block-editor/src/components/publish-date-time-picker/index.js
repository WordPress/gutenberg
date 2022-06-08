/**
 * WordPress dependencies
 */
import {
	DateTimePicker,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Button,
} from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

function PublishDateTimePicker(
	{ onClose, onChange, ...additionalProps },
	ref
) {
	return (
		<div ref={ ref } className="block-editor-publish-date-time-picker">
			{ /* TODO: This header is essentially the same as the one in <PostVisiblity />. DRY it up. */ }
			<HStack className="block-editor-publish-date-time-picker__header">
				<h2 className="block-editor-publish-date-time-picker__heading">
					{ __( 'Publish' ) }
				</h2>
				<Spacer />
				<Button
					className="block-editor-publish-date-time-picker__reset"
					variant="tertiary"
					onClick={ () => onChange?.( null ) }
				>
					{ __( 'Now' ) }
				</Button>
				<Button
					className="block-editor-publish-date-time-picker__close"
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ onClose }
				/>
			</HStack>
			<DateTimePicker
				__nextRemoveHelpButton
				__nextRemoveResetButton
				onChange={ onChange }
				{ ...additionalProps }
			/>
		</div>
	);
}

export default forwardRef( PublishDateTimePicker );
