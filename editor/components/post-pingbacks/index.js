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

function PostPingbacks( { pingStatus = 'open', instanceId, ...props } ) {
	const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );

	const pingbacksToggleId = 'allow-pingbacks-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ pingbacksToggleId }>{ __( 'Allow Pingbacks & Trackbacks' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
			showHint={ false }
			id={ pingbacksToggleId }
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			pingStatus: getEditedPostAttribute( state, 'ping_status' ),
		};
	},
	{
		editPost,
	}
)( withInstanceId( PostPingbacks ) );

