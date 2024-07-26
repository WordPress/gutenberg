/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useId, useEffect } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { usePrevious } from '@wordpress/compose';
import { useEntityRecords } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Page from '../page';
import {
	LAYOUT_GRID,
	LAYOUT_TABLE,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_DEFAULT_CATEGORY,
} from '../../utils/constants';
import usePatternSettings from './use-pattern-settings';
import { unlock } from '../../lock-unlock';
import usePatterns from './use-patterns';
import PatternsHeader from './header';
import { useEditPostAction } from '../dataviews-actions';
import {
	patternStatusField,
	previewField,
	titleField,
	templatePartAuthorField,
} from './fields';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { usePostActions } = unlock( editorPrivateApis );
const { useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		layout: {
			primaryField: 'title',
			styles: {
				preview: {
					width: '1%',
				},
				author: {
					width: '1%',
				},
			},
		},
	},
	[ LAYOUT_GRID ]: {
		layout: {
			mediaField: 'preview',
			primaryField: 'title',
			badgeFields: [ 'sync-status' ],
		},
	},
};
const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	search: '',
	page: 1,
	perPage: 20,
	layout: defaultLayouts[ LAYOUT_GRID ].layout,
	fields: [ 'title', 'sync-status' ],
	filters: [],
};

export default function DataviewsPatterns() {
	const {
		params: { postType, categoryId: categoryIdFromURL },
	} = useLocation();
	const type = postType || PATTERN_TYPES.user;
	const categoryId = categoryIdFromURL || PATTERN_DEFAULT_CATEGORY;
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const previousCategoryId = usePrevious( categoryId );
	const viewSyncStatus = view.filters?.find(
		( { field } ) => field === 'sync-status'
	)?.value;
	const { patterns, isResolving } = usePatterns( type, categoryId, {
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
		const _fields = [ previewField, titleField ];

		if ( type === PATTERN_TYPES.user ) {
			_fields.push( patternStatusField );
		} else if ( type === TEMPLATE_PART_POST_TYPE ) {
			_fields.push( {
				...templatePartAuthorField,
				elements: authors,
			} );
		}

		return _fields;
	}, [ type, authors ] );

	// Reset the page number when the category changes.
	useEffect( () => {
		if ( previousCategoryId !== categoryId ) {
			setView( ( prevView ) => ( { ...prevView, page: 1 } ) );
		}
	}, [ categoryId, previousCategoryId ] );
	const { data, paginationInfo } = useMemo( () => {
		// Search is managed server-side as well as filters for patterns.
		// However, the author filter in template parts is done client-side.
		const viewWithoutFilters = { ...view };
		delete viewWithoutFilters.search;
		if ( type !== TEMPLATE_PART_POST_TYPE ) {
			viewWithoutFilters.filters = [];
		}
		return filterSortAndPaginate( patterns, viewWithoutFilters, fields );
	}, [ patterns, view, fields, type ] );

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
		if ( type === TEMPLATE_PART_POST_TYPE ) {
			return [ editAction, ...templatePartActions ].filter( Boolean );
		}
		return [ editAction, ...patternActions ].filter( Boolean );
	}, [ editAction, type, templatePartActions, patternActions ] );
	const id = useId();
	const settings = usePatternSettings();
	// Wrap everything in a block editor provider.
	// This ensures 'styles' that are needed for the previews are synced
	// from the site editor store to the block editor store.
	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<Page
				title={ __( 'Patterns content' ) }
				className="edit-site-page-patterns-dataviews"
				hideTitleFromUI
			>
				<PatternsHeader
					categoryId={ categoryId }
					type={ type }
					titleId={ `${ id }-title` }
					descriptionId={ `${ id }-description` }
				/>
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ data || EMPTY_ARRAY }
					getItemId={ ( item ) => item.name ?? item.id }
					isLoading={ isResolving }
					view={ view }
					onChangeView={ setView }
					defaultLayouts={ defaultLayouts }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
