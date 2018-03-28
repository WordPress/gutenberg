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

function PostHeader( { headerStatus = 'open', instanceId, ...props } ) {
	const onToggleHeader = () => props.editPost( { header_status: headerStatus === 'open' ? 'closed' : 'open' } );

	const headerToggleId = 'allow-header-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ headerToggleId }>{ __( 'Display header' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ headerStatus === 'open' }
			onChange={ onToggleHeader }
			showHint={ false }
			id={ headerToggleId }
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			headerStatus: getEditedPostAttribute( state, 'header_status' ),
		};
	},
	{
		editPost,
	}
)( withInstanceId( PostHeader ) );

