/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { isValidTemplate } from '../../store/selectors';
import { setTemplateValidity, synchronizeTemplate } from '../../store/actions';

function TemplateValidationNotice( { isValid, ...props } ) {
	if ( isValid ) {
		return null;
	}

	const confirmSynchronization = () => {
		// eslint-disable-next-line no-alert
		if ( window.confirm( __( 'Resetting the template may result in loss of content, do you want to continue?' ) ) ) {
			props.synchronizeTemplate();
		}
	};

	return (
		<Notice className="editor-template-validation-notice" isDismissible={ false } status="warning">
			<p>{ __( 'The content of your post doesn\'t match the template assigned to your post type.' ) }</p>
			<div>
				<Button className="button" onClick={ props.resetTemplateValidity }>{ __( 'Keep it as is' ) }</Button>
				<Button onClick={ confirmSynchronization } isPrimary>{ __( 'Reset the template' ) }</Button>
			</div>
		</Notice>
	);
}

export default connect(
	( state ) => ( {
		isValid: isValidTemplate( state ),
	} ),
	{
		resetTemplateValidity: () => setTemplateValidity( true ),
		synchronizeTemplate,
	}
)( TemplateValidationNotice );
