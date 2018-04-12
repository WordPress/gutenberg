/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostFooter( { footerStatus = 'open', instanceId, ...props } ) {
	const onToggleFooter = () => props.editPost( { footer_status: footerStatus === 'open' ? 'closed' : 'open' } );

	const footerToggleId = 'allow-footer-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ footerToggleId }>{ __( 'Display footer' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ footerStatus === 'open' }
			onChange={ onToggleFooter }
			showHint={ false }
			id={ footerToggleId }
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			footerStatus: getEditedPostAttribute( state, 'footer_status' ),
		};
	},
	{
		editPost,
	}
)( withInstanceId( PostFooter ) );

