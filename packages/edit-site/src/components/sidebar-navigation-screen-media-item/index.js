/**
 * WordPress dependencies
 */
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarButton from '../sidebar-button';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function SidebarNavigationScreenMediaItem() {
	const { params } = useNavigator();
	const { postType, postId, mediaType } = params;
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { record } = useSelect(
		( select ) => {
			const { getMedia } = select( coreStore );
			return {
				record: getMedia( postId ),
			};
		},
		[ postId ]
	);

	// The absence of a media type in the query params for media
	// indicates the user has arrived at the template part via the "media" main
	// view and the back button should return them to that list page.
	const backPath = !! mediaType ? `/media/${ mediaType }` : '/media';

	return (
		<SidebarNavigationScreen
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			backPath={ backPath }
			content={
				<div className="edit-site-sidebar-navigation-screen-media-item-content">
					{ record?.title.rendered } { postType } - { postId }
				</div>
			}
			footer={ __( 'Media Item Footer' ) }
		/>
	);
}
