/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { DataViews } from '@wordpress/dataviews';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE, LAYOUT_GRID } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useMenuUsedInTemplateParts from '../../hooks/use-menu-used-in-template-parts';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { previewField } from '../page-patterns/fields';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const EMPTY_ARRAY = [];

const defaultLayouts = { grid: {} };

const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	sort: { field: 'title', direction: 'asc' },
	titleField: 'title',
	mediaField: 'preview',
};

const TEMPLATE_PART_FIELDS = [
	previewField,
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
	const settings = usePatternSettings();

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
		<ExperimentalBlockEditorProvider settings={ settings }>
			<Page title={ __( 'Active Menu locations' ) }>
				<DataViews
					data={ data }
					fields={ TEMPLATE_PART_FIELDS }
					view={ view }
					onChangeView={ () => {} }
					actions={ [ editInContextAction ] }
					isLoading={ isResolving }
					paginationInfo={ {
						totalItems: data.length,
						totalPages: 1,
					} }
					getItemId={ getItemId }
					defaultLayouts={ defaultLayouts }
					isItemClickable={ () => true }
					onClickItem={ ( item ) => {
						navigateToTemplatePart( item.id );
					} }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
