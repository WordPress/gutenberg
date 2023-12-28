/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostPingbacks() {
	const pingStatus = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'ping_status' ) ??
			'open',
		[]
	);
	const { editPost } = useDispatch( editorStore );
	const onTogglePingback = () =>
		editPost( {
			ping_status: pingStatus === 'open' ? 'closed' : 'open',
		} );

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ __( 'Allow pingbacks & trackbacks' ) }
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
		/>
	);
}

export default PostPingbacks;
