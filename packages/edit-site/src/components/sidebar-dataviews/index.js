/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
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
	appendItems,
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
				{ viewList?.map( ( view, index ) => {
					const isActive = view.slug === activeView;
					const slug = view.slug === 'all' ? undefined : view.slug;
					const icon = resolveIcon( view );
					return (
						<Fragment key={ view.slug }>
							<SidebarNavigationItem
								icon={ icon }
								to={ addQueryArgs( path, {
									activeView: slug,
								} ) }
								aria-current={ isActive ? 'true' : undefined }
							>
								{ view.title }
							</SidebarNavigationItem>
							{ /*
							 * Render `appendItems` immediately after the first
							 * view (typically the catch-all "All templates" /
							 * "All pages" entry). This promotes the extra item
							 * above the per-source rows that follow.
							 */ }
							{ index === 0 && appendItems }
						</Fragment>
					);
				} ) }
			</ItemGroup>
		</>
	);
}
