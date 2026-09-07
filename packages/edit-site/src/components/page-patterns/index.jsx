import { Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useView, useViewConfig } from '@wordpress/views';
import { addQueryArgs } from '@wordpress/url';
import { PATTERN_TYPES, PATTERN_DEFAULT_CATEGORY } from '../../utils/constants';
import usePatternSettings from './use-pattern-settings';
import { unlock } from '../../lock-unlock';
import usePatterns, { useAugmentPatternsWithPermissions } from './use-patterns';
import PatternsActions from './actions';
import { useEditPostAction } from '../dataviews-actions';
import { previewField } from './fields';
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const VIEW_CONFIG_FIELDS = [ 'default_view', 'default_layouts' ];

function usePagePatternsHeader( type, categoryId ) {
	const { patternCategories } = usePatternCategories();
	let title, description, patternCategory;
	if ( type === PATTERN_TYPES.user && !! categoryId ) {
		patternCategory = patternCategories.find(
			( category ) => category.name === categoryId
		);
		title = patternCategory?.label;
		description = patternCategory?.description;
	}

	return { title, description };
}

export default function DataviewsPatterns() {
	const { path, query } = useLocation();
	const { postType = 'wp_block', categoryId: categoryIdFromURL } = query;
	const history = useHistory();
	const categoryId = categoryIdFromURL || PATTERN_DEFAULT_CATEGORY;
	const { default_view: defaultView, default_layouts: defaultLayouts } =
		useViewConfig( {
			kind: 'postType',
			name: postType,
			fields: VIEW_CONFIG_FIELDS,
		} );
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: 'default',
		defaultView,
		defaultLayouts,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams: ( params ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: params.page,
					search: params.search,
				} )
			);
		},
	} );
	const viewSyncStatus = view.filters?.find(
		( { field } ) => field === 'sync-status'
	)?.value;
	const { patterns, isResolving } = usePatterns( postType, categoryId, {
		search: view.search,
		syncStatus: viewSyncStatus,
	} );

	const postTypeFields = usePostFields( { postType } );
	const fields = useMemo( () => {
		return [ previewField, ...( postTypeFields || [] ) ];
	}, [ postTypeFields ] );

	const { data, paginationInfo } = useMemo( () => {
		// Search is managed server-side as well as filters for patterns.
		const viewWithoutFilters = { ...view };
		delete viewWithoutFilters.search;
		viewWithoutFilters.filters = [];
		return filterSortAndPaginate( patterns, viewWithoutFilters, fields );
	}, [ patterns, view, fields ] );

	const dataWithPermissions = useAugmentPatternsWithPermissions( data );

	const patternActions = usePostActions( {
		postType: PATTERN_TYPES.user,
		context: 'list',
	} );
	const editAction = useEditPostAction();

	const actions = useMemo(
		() => [ editAction, ...patternActions ].filter( Boolean ),
		[ editAction, patternActions ]
	);
	const settings = usePatternSettings();
	const { title, description } = usePagePatternsHeader(
		postType,
		categoryId
	);

	// Wrap everything in a block editor provider.
	// This ensures 'styles' that are needed for the previews are synced
	// from the site editor store to the block editor store.
	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<Page
				className="edit-site-page-patterns-dataviews"
				title={ title }
				headingLevel={ 2 }
				subTitle={ description }
				actions={
					<PatternsActions
						categoryId={ categoryId }
						type={ postType }
					/>
				}
			>
				<DataViews
					key={ categoryId + postType }
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ dataWithPermissions || EMPTY_ARRAY }
					getItemId={ ( item ) => item.name ?? item.id }
					isLoading={ isResolving }
					isItemClickable={ ( item ) =>
						item.type !== PATTERN_TYPES.theme ||
						!! item.customizationId
					}
					onClickItem={ ( item ) => {
						// An edited registered pattern opens its editable copy.
						if ( item.type === PATTERN_TYPES.theme ) {
							history.navigate(
								`/${ PATTERN_TYPES.user }/${ item.customizationId }?canvas=edit`
							);
							return;
						}
						history.navigate(
							`/${ item.type }/${ item.id }?canvas=edit`
						);
					} }
					view={ view }
					onChangeView={ updateView }
					defaultLayouts={ defaultLayouts }
					onReset={ isModified ? resetToDefault : false }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
