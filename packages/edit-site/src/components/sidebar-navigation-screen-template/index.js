/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';

export default function SidebarNavigationScreenTemplate() {
	const { params } = useNavigator();
	const { postType, postId } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { getDescription, getTitle, record } = useEditedEntityRecord(
		postType,
		postId
	);
	let description = getDescription();
	if ( ! description ) {
		if ( record.type === 'wp_template' && record.is_custom ) {
			description = __(
				'This is a custom template that can be applied manually to any Post or Page.'
			);
		} else if ( record.type === 'wp_template_part' ) {
			description = sprintf(
				// translators: %s: template part title e.g: "Header".
				__( 'This is your %s template part.' ),
				getTitle()
			);
		}
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
			description={ description }
		/>
	);
}
