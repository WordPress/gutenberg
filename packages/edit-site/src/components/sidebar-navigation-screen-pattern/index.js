/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { pencil } from '@wordpress/icons';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarButton from '../sidebar-button';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import usePatternDetails from './use-pattern-details';
import useNavigationMenuContent from './use-navigation-menu-content';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function SidebarNavigationScreenPattern() {
	const { params } = useNavigator();
	const { postType, postId } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	useInitEditedEntityFromURL();

	const patternDetails = usePatternDetails( postType, postId );
	const content = useNavigationMenuContent( postType, postId );

	return (
		<SidebarNavigationScreen
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			backPath={ '/library' }
			content={ content }
			{ ...patternDetails }
		/>
	);
}
