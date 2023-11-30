/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { media, video, image, audio, pages } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
const { useLocation } = unlock( routerPrivateApis );
import DataViewItem from '../sidebar-dataviews/dataview-item';

const PATH_TO_TYPE = {
	'/media/all': 'media',
};

export default function MediaSidebarContent() {
	const {
		params: { path, activeView = 'all', isCustom = 'false' },
	} = useLocation();
	if ( ! path || ! PATH_TO_TYPE[ path ] ) {
		return null;
	}

	return (
		<>
			<ItemGroup>
				<DataViewItem
					key="image"
					slug="image"
					title="Images"
					icon={ image }
					type="image"
					isActive={ isCustom === 'false' && 'image' === activeView }
					isCustom="false"
				/>
				<DataViewItem
					key="video"
					slug="video"
					title="Videos"
					icon={ video }
					type="video"
					isActive={ isCustom === 'false' && 'video' === activeView }
					isCustom="false"
				/>
				<DataViewItem
					key="audio"
					slug="audio"
					title="Audio"
					icon={ audio }
					type="audio"
					isActive={ isCustom === 'false' && 'audio' === activeView }
					isCustom="false"
				/>
			</ItemGroup>
		</>
	);
}
