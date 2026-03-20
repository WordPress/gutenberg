/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { useViewConfig } from '@wordpress/views';
import {
	commentAuthorAvatar,
	layout,
	plugins as pluginIcon,
	globe,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

const SLUG_TO_ICON = {
	all: layout,
	user: commentAuthorAvatar,
	theme: layout,
	plugin: pluginIcon,
	site: globe,
};

export default function DataviewsTemplatesSidebarContent() {
	const {
		query: { activeView = 'all' },
	} = useLocation();
	const { view_list: viewList } = useViewConfig( {
		kind: 'postType',
		name: TEMPLATE_POST_TYPE,
	} );

	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-templates-browse">
			{ viewList?.map( ( item ) => (
				<SidebarNavigationItem
					key={ item.slug }
					to={
						item.slug === 'all'
							? '/template'
							: addQueryArgs( '/template', {
									activeView: item.slug,
							  } )
					}
					icon={
						SLUG_TO_ICON[ item.icon ] || SLUG_TO_ICON[ item.slug ]
					}
					aria-current={ activeView === item.slug }
				>
					{ item.title }
				</SidebarNavigationItem>
			) ) }
		</ItemGroup>
	);
}
