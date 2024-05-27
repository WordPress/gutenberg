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
 * A checkbox control for enabling or disabling pingbacks and trackbacks in a WordPress post.
 *
 * The checkbox's checked state is determined by the post's current `ping_status` attribute, which is retrieved from the WordPress data store using the `useSelect` hook.
 *
 * When the checkbox is toggled, the `onTogglePingback` function is called, which dispatches an `editPost` action to the WordPress data store with the new `ping_status` value. If the current `ping_status` is 'open', it is set to 'closed', and vice versa.
 *
 * The checkbox control also includes a help link that directs the user to a WordPress documentation page about pingbacks and trackbacks.
 *
 * @module PostPingbacks
 */
export default PostPingbacks;
