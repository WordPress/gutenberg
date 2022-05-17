/**
 * WordPress dependencies
 */
import {
	DateTimePicker,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Button,
} from '@wordpress/components';
import { close as closeIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function PublishDateTimePicker( {
	onClose,
	onChange,
	...additionalProps
} ) {
	return (
		<div className="block-editor-publish-date-time-picker">
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
					isSmall
					icon={ closeIcon }
					label={ __( 'Close' ) }
					onClick={ onClose }
				/>
			</HStack>
			<DateTimePicker onChange={ onChange } { ...additionalProps } />
		</div>
	);
}
