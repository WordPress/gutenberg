/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostPingbacks( { pingStatus = 'open', ...props } ) {
	const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );

	return [
		<ToggleControl
			label={ __( 'Allow Pingbacks & Trackbacks' ) }
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
			showHint={ false }
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
)( PostPingbacks );
