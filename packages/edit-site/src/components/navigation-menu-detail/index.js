/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { DataViews } from '@wordpress/dataviews';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE, LAYOUT_GRID } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useMenuUsedInTemplateParts from '../../hooks/use-menu-used-in-template-parts';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const EMPTY_ARRAY = [];

const defaultLayouts = { grid: {} };

const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	sort: { field: 'title', direction: 'asc' },
	titleField: 'title',
};

const TEMPLATE_PART_FIELDS = [
	{
		id: 'title',
		header: __( 'Title' ),
		getValue: ( { item } ) =>
			item.title?.rendered || item.slug || __( '(no title)' ),
		enableSorting: true,
		filterBy: false,
	},
	{
		id: 'area',
		header: __( 'Area' ),
		getValue: ( { item } ) => item.area || '—',
		filterBy: false,
	},
];

function getItemId( item ) {
	return String( item.id );
}

function useNavigateToTemplatePart( menuId ) {
	const history = useHistory();
	const { path } = useLocation();

	return ( templatePartId ) => {
		history.navigate(
			addQueryArgs( `/${ TEMPLATE_PART_POST_TYPE }/${ templatePartId }`, {
				canvas: 'edit',
				focusMode: true,
				navigationRef: menuId,
				parentPath: path,
			} )
		);
	};
}

export default function NavigationMenuDetail( { menuId } ) {
	const { templateParts, isResolving } = useMenuUsedInTemplateParts( menuId );
	const navigateToTemplatePart = useNavigateToTemplatePart( menuId );

	const view = useMemo( () => DEFAULT_VIEW, [] );

	const editInContextAction = useMemo(
		() => ( {
			id: 'edit-in-context',
			label: __( 'Edit in context' ),
			isPrimary: true,
			callback( items ) {
				navigateToTemplatePart( items[ 0 ].id );
			},
		} ),
		[ navigateToTemplatePart ]
	);

	const data = templateParts ?? EMPTY_ARRAY;

	return (
		<Page title={ __( 'Active Menu locations' ) }>
			<DataViews
				data={ data }
				fields={ TEMPLATE_PART_FIELDS }
				view={ view }
				onChangeView={ () => {} }
				actions={ [ editInContextAction ] }
				isLoading={ isResolving }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				isItemClickable={ () => true }
				onClickItem={ ( item ) => {
					navigateToTemplatePart( item.id );
				} }
			/>
		</Page>
	);
}
