/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import SidebarButton from '../sidebar-button';
import { useLink } from '../routes/link';

export default function EditButton( { postId } ) {
	const linkInfo = useLink( {
		postId,
		postType: 'wp_navigation',
		canvas: 'edit',
	} );
	return (
		<SidebarButton { ...linkInfo } label={ __( 'Edit' ) } icon={ pencil } />
	);
}
