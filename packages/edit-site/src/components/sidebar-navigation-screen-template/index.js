/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';

export default function SidebarNavigationScreenTemplate() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { getDescription, getTitle, record } = useEditedEntityRecord();
	let description = getDescription();
	if ( ! description && record.is_custom ) {
		description = __(
			'This is a custom template that can be applied manually to any Post or Page.'
		);
	}

	return (
		<SidebarNavigationScreen
			title={ getTitle() }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			content={ description ? <p>{ description }</p> : undefined }
		/>
	);
}
