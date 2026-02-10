/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useView } from '@wordpress/views';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	LAYOUT_GRID,
	LAYOUT_TABLE,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_DEFAULT_CATEGORY,
} from '../../utils/constants';
import usePatternSettings from './use-pattern-settings';
import { unlock } from '../../lock-unlock';
import usePatterns, { useAugmentPatternsWithPermissions } from './use-patterns';
import PatternsActions from './actions';
import { useEditPostAction } from '../dataviews-actions';
import {
	patternStatusField,
	previewField,
	templatePartAuthorField,
} from './fields';
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { usePostActions, patternTitleField } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		layout: {
			styles: {
				author: {
					width: '1%',
				},
			},
		},
	},
	[ LAYOUT_GRID ]: {
		layout: {
			badgeFields: [ 'sync-status' ],
		},
	},
};
const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	perPage: 20,
	titleField: 'title',
	mediaField: 'preview',
	fields: [ 'sync-status' ],
	filters: [],
	...defaultLayouts[ LAYOUT_GRID ],
};

function usePagePatternsHeader( type, categoryId ) {
	const { patternCategories } = usePatternCategories();
	const templatePartAreas = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()
				?.default_template_part_areas || [],
		[]
	);
	let title, description, patternCategory;
	if ( type === TEMPLATE_PART_POST_TYPE ) {
		const templatePartArea = templatePartAreas.find(
			( area ) => area.area === categoryId
		);
		title = templatePartArea?.label || __( 'All Template Parts' );
		description =
			templatePartArea?.description ||
			__( 'Includes every template part defined for any area.' );
	} else if ( type === PATTERN_TYPES.user && !! categoryId ) {
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
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: 'default',
		defaultView: DEFAULT_VIEW,
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

	const { records } = useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
		per_page: -1,
	} );

	const authors = useMemo( () => {
		if ( ! records ) {
			return EMPTY_ARRAY;
		}
		const authorsSet = new Set();
		records.forEach( ( template ) => {
			authorsSet.add( template.author_text );
		} );
		return Array.from( authorsSet ).map( ( author ) => ( {
			value: author,
			label: author,
		} ) );
	}, [ records ] );

	const fields = useMemo( () => {
		const _fields = [ previewField, patternTitleField ];

		if ( postType === PATTERN_TYPES.user ) {
			_fields.push( patternStatusField );
		} else if ( postType === TEMPLATE_PART_POST_TYPE ) {
			_fields.push( {
				...templatePartAuthorField,
				elements: authors,
			} );
		}

		return _fields;
	}, [ postType, authors ] );

	const { data, paginationInfo } = useMemo( () => {
		// Search is managed server-side as well as filters for patterns.
		// However, the author filter in template parts is done client-side.
		const viewWithoutFilters = { ...view };
		delete viewWithoutFilters.search;
		if ( postType !== TEMPLATE_PART_POST_TYPE ) {
			viewWithoutFilters.filters = [];
		}
		return filterSortAndPaginate( patterns, viewWithoutFilters, fields );
	}, [ patterns, view, fields, postType ] );

	const dataWithPermissions = useAugmentPatternsWithPermissions( data );

	const templatePartActions = usePostActions( {
		postType: TEMPLATE_PART_POST_TYPE,
		context: 'list',
	} );
	const patternActions = usePostActions( {
		postType: PATTERN_TYPES.user,
		context: 'list',
	} );
	const editAction = useEditPostAction();

	const actions = useMemo( () => {
		if ( postType === TEMPLATE_PART_POST_TYPE ) {
			return [ editAction, ...templatePartActions ].filter( Boolean );
		}
		return [ editAction, ...patternActions ].filter( Boolean );
	}, [ editAction, postType, templatePartActions, patternActions ] );
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
				subTitle={ description }
				actions={
					<PatternsActions
						categoryId={ categoryId }
						postType={ postType }
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
						item.type !== PATTERN_TYPES.theme
					}
					onClickItem={ ( item ) => {
						history.navigate(
							`/${ item.type }/${
								[
									PATTERN_TYPES.user,
									TEMPLATE_PART_POST_TYPE,
								].includes( item.type )
									? item.id
									: item.name
							}?canvas=edit`
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
