/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl, ExternalLink } from '@wordpress/components';
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
			label={ __( 'Enable pingbacks & trackbacks' ) }
			checked={ pingStatus === 'open' }
			onChange={ onTogglePingback }
			help={
				<ExternalLink
					href={ __(
						'https://wordpress.org/documentation/article/trackbacks-and-pingbacks/'
					) }
				>
					{ __( 'Learn more about pingbacks & trackbacks' ) }
				</ExternalLink>
			}
		/>
	);
}

/**
 * Renders a control for enabling or disabling pingbacks and trackbacks
 * in a WordPress post.
 *
 * @module PostPingbacks
 */
export default PostPingbacks;
