/**
 * WordPress dependencies
 */
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

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
	const backPath = mediaType ? `/media/${ mediaType }` : '/media';

	return (
		<SidebarNavigationScreen
			title={ decodeEntities(
				record?.title?.rendered || __( '(no title)' )
			) }
			backPath={ backPath }
			content={
				<SidebarNavigationScreenDetailsPanel
					spacing={ 5 }
					title={ __( 'Details' ) }
				>
					<SidebarNavigationScreenDetailsPanelRow>
						<SidebarNavigationScreenDetailsPanelLabel>
							Something
						</SidebarNavigationScreenDetailsPanelLabel>
						<SidebarNavigationScreenDetailsPanelValue>
							Yep
						</SidebarNavigationScreenDetailsPanelValue>
					</SidebarNavigationScreenDetailsPanelRow>
				</SidebarNavigationScreenDetailsPanel>
			}
			footer={ __( 'Media Item Footer' ) }
		/>
	);
}
