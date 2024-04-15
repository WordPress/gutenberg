/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { getQueryArgs } from '@wordpress/url';
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
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function SidebarNavigationScreenPattern() {
	const history = useHistory();
	const location = useLocation();
	const {
		params: { postType, postId },
	} = location;
	const { categoryType } = getQueryArgs( window.location.href );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

	useInitEditedEntityFromURL();

	const patternDetails = usePatternDetails( postType, postId );

	// The absence of a category type in the query params for template parts
	// indicates the user has arrived at the template part via the "manage all"
	// page and the back button should return them to that list page.
	const backPath =
		! categoryType && postType === TEMPLATE_PART_POST_TYPE
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
