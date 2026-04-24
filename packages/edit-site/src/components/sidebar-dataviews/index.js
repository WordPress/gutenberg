/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import {
	trash,
	pages,
	drafts,
	published,
	scheduled,
	pending,
	notAllowed,
} from '@wordpress/icons';
import { useViewConfig } from '@wordpress/views';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import SidebarNavigationItem from '../sidebar-navigation-item';

const { useLocation } = unlock( routerPrivateApis );

const SLUG_TO_ICON = {
	all: pages,
	published,
	future: scheduled,
	drafts,
	pending,
	private: notAllowed,
	trash,
};
const defaultResolveIcon = ( view ) => {
	return SLUG_TO_ICON[ view.slug ];
};

export default function DataViewsSidebarContent( {
	postType,
	resolveIcon = defaultResolveIcon,
} ) {
	const {
		path,
		query: { activeView = 'all' },
	} = useLocation();
	const { view_list: viewList } = useViewConfig( {
		kind: 'postType',
		name: postType,
	} );
	if ( ! postType ) {
		return null;
	}

	return (
		<>
			<ItemGroup className="edit-site-sidebar-dataviews">
				{ viewList?.map( ( view ) => {
					const isActive = view.slug === activeView;
					const slug = view.slug === 'all' ? undefined : view.slug;
					const icon = resolveIcon( view );
					return (
						<SidebarNavigationItem
							key={ view.slug }
							icon={ icon }
							to={ addQueryArgs( path, {
								activeView: slug,
							} ) }
							aria-current={ isActive ? 'true' : undefined }
						>
							{ view.title }
						</SidebarNavigationItem>
					);
				} ) }
			</ItemGroup>
		</>
	);
}
