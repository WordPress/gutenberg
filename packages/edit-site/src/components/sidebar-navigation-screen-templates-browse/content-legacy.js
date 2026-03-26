/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
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

const SOURCE_TO_ICON = {
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
	const authorSourceMap = useSelect( ( select ) => {
		const templates = select( coreStore ).getEntityRecords(
			'postType',
			TEMPLATE_POST_TYPE,
			{ per_page: -1 }
		);
		if ( ! templates ) {
			return {};
		}
		const map = {};
		for ( const template of templates ) {
			if (
				template.author_text &&
				template.original_source &&
				! map[ template.author_text ]
			) {
				map[ template.author_text ] = template.original_source;
			}
		}
		return map;
	}, [] );

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
						SOURCE_TO_ICON[ authorSourceMap[ item.slug ] ] ?? layout
					}
					aria-current={ activeView === item.slug }
				>
					{ item.title }
				</SidebarNavigationItem>
			) ) }
		</ItemGroup>
	);
}
