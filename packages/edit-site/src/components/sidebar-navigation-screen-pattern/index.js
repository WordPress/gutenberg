/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarButton from '../sidebar-button';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import usePatternDetails from './use-pattern-details';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import TemplateActions from '../template-actions';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function SidebarNavigationScreenPattern() {
	const history = useHistory();
	const location = useLocation();
	const {
		params: { postType, postId },
	} = location;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	useInitEditedEntityFromURL();

	const patternDetails = usePatternDetails( postType, postId );
	const isTemplatePartsMode = useSelect( ( select ) => {
		return !! select( editSiteStore ).getSettings()
			.supportsTemplatePartsMode;
	}, [] );

	/**
	 * This sidebar needs to temporarily accomodate two different "URLs" backpaths:
	 *
	 * 1. path = /patterns
	 *    Block based themes. Also classic themes can access this URL, though it's not linked anywhere.
	 *
	 * 2. path = /wp_template_part/all
	 *    Classic themes with support for block-template-parts. We need to list only Template Parts in this case.
	 *    The URL is accessible from the Appearance > Template Parts menu.
	 *
	 * Depending on whether the theme supports block-template-parts, we go back to Patterns or Template screens.
	 * This is temporary. We aim to consolidate to /patterns.
	 */
	const backPath =
		isTemplatePartsMode && postType === 'wp_template_part'
			? { path: '/wp_template_part/all' }
			: { path: '/patterns' };

	return (
		<SidebarNavigationScreen
			actions={
				<>
					<TemplateActions
						postType={ postType }
						postId={ postId }
						toggleProps={ { as: SidebarButton } }
						onRemove={ () => {
							history.push( backPath );
						} }
					/>
					<SidebarButton
						onClick={ () => setCanvasMode( 'edit' ) }
						label={ __( 'Edit' ) }
						icon={ pencil }
					/>
				</>
			}
			backPath={ backPath }
			{ ...patternDetails }
		/>
	);
}
