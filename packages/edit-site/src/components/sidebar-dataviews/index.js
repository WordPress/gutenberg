/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
} from '@wordpress/components';
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

export default function DataViewsSidebarContent( { postType } ) {
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
					return (
						<HStack
							key={ view.slug }
							justify="flex-start"
							className={ clsx(
								'edit-site-sidebar-dataviews-dataview-item',
								{
									'is-selected': isActive,
								}
							) }
						>
							<SidebarNavigationItem
								icon={ SLUG_TO_ICON[ view.slug ] }
								to={ addQueryArgs( path, {
									activeView: slug,
								} ) }
								aria-current={ isActive ? 'true' : undefined }
							>
								{ view.title }
							</SidebarNavigationItem>
						</HStack>
					);
				} ) }
			</ItemGroup>
		</>
	);
}
