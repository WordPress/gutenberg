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
import { TEMPLATE_PART_POST_TYPE, LAYOUT_LIST } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useMenuUsedInTemplateParts from '../../hooks/use-menu-used-in-template-parts';

const { useHistory } = unlock( routerPrivateApis );
const EMPTY_ARRAY = [];

const defaultLayouts = { list: {} };

const DEFAULT_VIEW = {
	type: LAYOUT_LIST,
	sort: { field: 'title', direction: 'asc' },
	titleField: 'title',
};

// Minimal fields for template part display
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

export default function NavigationMenuDetail( { menuId } ) {
	const history = useHistory();
	const { templateParts, isResolving } = useMenuUsedInTemplateParts( menuId );

	const view = useMemo( () => DEFAULT_VIEW, [] );

	const editInContextAction = useMemo(
		() => ( {
			id: 'edit-in-context',
			label: __( 'Edit in context' ),
			isPrimary: true,
			callback( items ) {
				const tp = items[ 0 ];
				history.navigate(
					addQueryArgs( `/${ TEMPLATE_PART_POST_TYPE }/${ tp.id }`, {
						canvas: 'edit',
					} )
				);
			},
		} ),
		[ history ]
	);

	const data = templateParts ?? EMPTY_ARRAY;

	return (
		<Page title={ __( 'Used in' ) }>
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
					history.navigate(
						addQueryArgs(
							`/${ TEMPLATE_PART_POST_TYPE }/${ item.id }`,
							{ canvas: 'edit' }
						)
					);
				} }
			/>
		</Page>
	);
}
