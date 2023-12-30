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
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function EditButton( { postId } ) {
	const linkInfo = useLink( {
		postId,
		postType: NAVIGATION_POST_TYPE,
		canvas: 'edit',
	} );
	return (
		<SidebarButton { ...linkInfo } label={ __( 'Edit' ) } icon={ pencil } />
	);
}
