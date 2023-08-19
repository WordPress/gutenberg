/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { media, video, image, audio, pages } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function MediaItem( { icon, type, isActive, children } ) {
	const { goTo } = useNavigator();
	return (
		<SidebarNavigationItem
			onClick={ () =>
				goTo( type ? `/media/${ type }` : '/media', { replace: true } )
			}
			icon={ icon }
			aria-current={ isActive ? 'true' : undefined }
		>
			{ children }
		</SidebarNavigationItem>
	);
}

export default function SidebarNavigationScreenMedia() {
	const {
		params: { path },
	} = useLocation();
	return (
		<SidebarNavigationScreen
			title={ __( 'Media' ) }
			description={ __( "Browse and manage your site's media." ) }
			actions={ null }
			content={
				<ItemGroup>
					<MediaItem
						type="all"
						icon={ media }
						isActive={ path === '/media/all' }
					>
						{ __( 'All media' ) }
					</MediaItem>
					<MediaItem
						icon={ image }
						type="image"
						isActive={ path === '/media/image' }
					>
						{ __( 'Images' ) }
					</MediaItem>
					<MediaItem
						icon={ video }
						type="video"
						isActive={ path === '/media/video' }
					>
						{ __( 'Videos' ) }
					</MediaItem>
					<MediaItem
						icon={ audio }
						type="audio"
						isActive={ path === '/media/audio' }
					>
						{ __( 'Audio' ) }
					</MediaItem>
					<MediaItem
						icon={ pages }
						type="application"
						isActive={ path === '/media/application' }
					>
						{ __( 'Documents' ) }
					</MediaItem>
				</ItemGroup>
			}
		/>
	);
}
