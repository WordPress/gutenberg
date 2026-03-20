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

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import DataViewItem from './dataview-item';

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
		query: { activeView = 'all' },
	} = useLocation();
	const { default_view: defaultView, view_list: viewList } = useViewConfig( {
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
					return (
						<DataViewItem
							key={ view.slug }
							slug={ view.slug }
							title={ view.title }
							icon={ SLUG_TO_ICON[ view.slug ] }
							type={ view.view?.type ?? defaultView.type }
							isActive={ view.slug === activeView }
						/>
					);
				} ) }
			</ItemGroup>
		</>
	);
}
