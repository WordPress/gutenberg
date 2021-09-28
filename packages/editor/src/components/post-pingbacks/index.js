/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostPingbacks( { pingStatus = 'open', ...props } ) {
	const onTogglePingback = () =>
		props.editPost( {
			ping_status: pingStatus === 'open' ? 'closed' : 'open',
		} );

	return (
		<CheckboxControl
			label={ __( 'Allow pingbacks & trackbacks' ) }
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
		/>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			pingStatus: select( editorStore ).getEditedPostAttribute(
				'ping_status'
			),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		editPost: dispatch( editorStore ).editPost,
	} ) ),
] )( PostPingbacks );
