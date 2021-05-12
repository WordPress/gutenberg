/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';

function TemplateValidationNotice( { isValid, ...props } ) {
	if ( isValid ) {
		return null;
	}

	const confirmSynchronization = () => {
		if (
			// eslint-disable-next-line no-alert
			window.confirm(
				__(
					'Resetting the template may result in loss of content, do you want to continue?'
				)
			)
		) {
			props.synchronizeTemplate();
		}
	};

	return (
		<Notice
			className="editor-template-validation-notice"
			isDismissible={ false }
			status="warning"
			actions={ [
				{
					label: __( 'Keep it as is' ),
					onClick: props.resetTemplateValidity,
				},
				{
					label: __( 'Reset the template' ),
					onClick: confirmSynchronization,
				},
			] }
		>
			{ __(
				'The content of your post doesn’t match the template assigned to your post type.'
			) }
		</Notice>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isValid: select( blockEditorStore ).isValidTemplate(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { setTemplateValidity, synchronizeTemplate } = dispatch(
			blockEditorStore
		);
		return {
			resetTemplateValidity: () => setTemplateValidity( true ),
			synchronizeTemplate,
		};
	} ),
] )( TemplateValidationNotice );
