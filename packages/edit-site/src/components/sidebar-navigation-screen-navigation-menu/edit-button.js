/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { unlock } from '../../lock-unlock';

export default function EditButton() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	return (
		<SidebarButton
			onClick={ () => setCanvasMode( 'edit' ) }
			label={ __( 'Edit' ) }
			icon={ pencil }
		/>
	);
}
