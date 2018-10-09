/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

function PostPingbacks( { pingStatus = 'open', ...props } ) {
	const onTogglePingback = () => props.editPost( { ping_status: pingStatus === 'open' ? 'closed' : 'open' } );

	return (
		<CheckboxControl
			label={ __( 'Allow Pingbacks & Trackbacks' ) }
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
		/>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			pingStatus: select( 'core/editor' ).getEditedPostAttribute( 'ping_status' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		editPost: dispatch( 'core/editor' ).editPost,
	} ) ),
] )( PostPingbacks );
