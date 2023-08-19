/**
 * WordPress dependencies
 */
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
export default function SidebarNavigationScreenMediaItem() {
	const { params } = useNavigator();
	const { postId, mediaType } = params;
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
			backPath={ backPath }
			content={
				<div className="edit-site-sidebar-navigation-screen-media-item-content">
					{ record?.title.rendered } { postId }
				</div>
			}
			footer={ __( 'Media Item Footer' ) }
		/>
	);
}
