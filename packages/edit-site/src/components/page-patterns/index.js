/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	Button,
	Tooltip,
	Flex,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import {
	useState,
	useMemo,
	useCallback,
	useId,
	useEffect,
} from '@wordpress/element';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Icon, lockSmall } from '@wordpress/icons';
import { usePrevious } from '@wordpress/compose';
import { useEntityRecords } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { Async } from '../async';
import Page from '../page';
import {
	LAYOUT_GRID,
	LAYOUT_TABLE,
	LAYOUT_LIST,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_SYNC_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	OPERATOR_IS,
} from '../../utils/constants';
import {
	exportJSONaction,
	renameAction,
	resetAction,
	deleteAction,
	duplicatePatternAction,
	duplicateTemplatePartAction,
} from './dataviews-pattern-actions';
import usePatternSettings from './use-pattern-settings';
import { unlock } from '../../lock-unlock';
import usePatterns from './use-patterns';
import PatternsHeader from './header';
import { useLink } from '../routes/link';
import { useAddedBy } from '../page-templates/hooks';

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);
const { usePostActions } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const defaultConfigPerViewType = {
	[ LAYOUT_TABLE ]: {
		primaryField: 'title',
	},
	[ LAYOUT_GRID ]: {
		mediaField: 'preview',
		primaryField: 'title',
		badgeFields: [ 'sync-status' ],
	},
};
const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	search: '',
	page: 1,
	perPage: 20,
	hiddenFields: [],
	layout: {
		...defaultConfigPerViewType[ LAYOUT_GRID ],
	},
	filters: [],
};

const SYNC_FILTERS = [
	{
		value: PATTERN_SYNC_TYPES.full,
		label: _x( 'Synced', 'Option that shows all synchronized patterns' ),
		description: __( 'Patterns that are kept in sync across the site.' ),
	},
	{
		value: PATTERN_SYNC_TYPES.unsynced,
		label: _x(
			'Not synced',
			'Option that shows all patterns that are not synchronized'
		),
		description: __(
			'Patterns that can be changed freely without affecting the site.'
		),
	},
];

function PreviewWrapper( { item, onClick, ariaDescribedBy, children } ) {
	return (
		<button
			className="page-patterns-preview-field__button"
			type="button"
			onClick={ item.type !== PATTERN_TYPES.theme ? onClick : undefined }
			aria-label={ item.title }
			aria-describedby={ ariaDescribedBy }
			aria-disabled={ item.type === PATTERN_TYPES.theme }
		>
			{ children }
		</button>
	);
}

function Preview( { item, categoryId, viewType } ) {
	const descriptionId = useId();
	const isUserPattern = item.type === PATTERN_TYPES.user;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const isEmpty = ! item.blocks?.length;

	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const { onClick } = useLink( {
		postType: item.type,
		postId: isUserPattern ? item.id : item.name,
		categoryId,
		categoryType: isTemplatePart ? item.type : PATTERN_TYPES.theme,
		canvas: 'edit',
	} );

	return (
		<div
			className={ `page-patterns-preview-field is-viewtype-${ viewType }` }
			style={ { backgroundColor } }
		>
			<PreviewWrapper
				item={ item }
				onClick={ onClick }
				ariaDescribedBy={ item.description ? descriptionId : undefined }
			>
				{ isEmpty && isTemplatePart && __( 'Empty template part' ) }
				{ isEmpty && ! isTemplatePart && __( 'Empty pattern' ) }
				{ ! isEmpty && (
					<Async>
						<BlockPreview
							blocks={ item.blocks }
							viewportWidth={ item.viewportWidth }
						/>
					</Async>
				) }
			</PreviewWrapper>
			{ item.description && (
				<div hidden id={ descriptionId }>
					{ item.description }
				</div>
			) }
		</div>
	);
}

function Author( { item, viewType } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );
	const withIcon = viewType !== LAYOUT_LIST;

	return (
		<HStack alignment="left" spacing={ 1 }>
			{ withIcon && imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ withIcon && ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

function Title( { item, categoryId } ) {
	const isUserPattern = item.type === PATTERN_TYPES.user;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const { onClick } = useLink( {
		postType: item.type,
		postId: isUserPattern ? item.id : item.name,
		categoryId,
		categoryType: isTemplatePart ? item.type : PATTERN_TYPES.theme,
		canvas: 'edit',
	} );
	return (
		<HStack alignment="center" justify="flex-start" spacing={ 2 }>
			<Flex
				as="div"
				gap={ 0 }
				justify="left"
				className="edit-site-patterns__pattern-title"
			>
				{ item.type === PATTERN_TYPES.theme ? (
					item.title
				) : (
					<Button
						variant="link"
						onClick={ onClick }
						// Required for the grid's roving tab index system.
						// See https://github.com/WordPress/gutenberg/pull/51898#discussion_r1243399243.
						tabIndex="-1"
					>
						{ item.title || item.name }
					</Button>
				) }
			</Flex>
			{ item.type === PATTERN_TYPES.theme && (
				<Tooltip
					placement="top"
					text={ __( 'This pattern cannot be edited.' ) }
				>
					<Icon
						className="edit-site-patterns__pattern-lock-icon"
						icon={ lockSmall }
						size={ 24 }
					/>
				</Tooltip>
			) }
		</HStack>
	);
}

export default function DataviewsPatterns() {
	const {
		params: { categoryType, categoryId: categoryIdFromURL },
	} = useLocation();
	const type = categoryType || PATTERN_TYPES.theme;
	const categoryId = categoryIdFromURL || PATTERN_DEFAULT_CATEGORY;
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const isUncategorizedThemePatterns =
		type === PATTERN_TYPES.theme && categoryId === 'uncategorized';
	const previousCategoryId = usePrevious( categoryId );
	const viewSyncStatus = view.filters?.find(
		( { field } ) => field === 'sync-status'
	)?.value;
	const { patterns, isResolving } = usePatterns(
		type,
		isUncategorizedThemePatterns ? '' : categoryId,
		{
			search: view.search,
			syncStatus: viewSyncStatus,
		}
	);

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
		const _fields = [
			{
				header: __( 'Preview' ),
				id: 'preview',
				render: ( { item } ) => (
					<Preview
						item={ item }
						categoryId={ categoryId }
						viewType={ view.type }
					/>
				),
				enableSorting: false,
				enableHiding: false,
				width: '1%',
			},
			{
				header: __( 'Title' ),
				id: 'title',
				render: ( { item } ) => (
					<Title item={ item } categoryId={ categoryId } />
				),
				enableHiding: false,
			},
		];

		if ( type === PATTERN_TYPES.theme ) {
			_fields.push( {
				header: __( 'Sync status' ),
				id: 'sync-status',
				render: ( { item } ) => {
					// User patterns can have their sync statuses checked directly.
					// Non-user patterns are all unsynced for the time being.
					return (
						<span
							className={ `edit-site-patterns__field-sync-status-${ item.syncStatus }` }
						>
							{ SYNC_FILTERS.find(
								( { value } ) => value === item.syncStatus
							)?.label ||
								SYNC_FILTERS.find(
									( { value } ) =>
										value === PATTERN_SYNC_TYPES.unsynced
								).label }
						</span>
					);
				},
				elements: SYNC_FILTERS,
				filterBy: {
					operators: [ OPERATOR_IS ],
					isPrimary: true,
				},
				enableSorting: false,
			} );
		} else if ( type === TEMPLATE_PART_POST_TYPE ) {
			_fields.push( {
				header: __( 'Author' ),
				id: 'author',
				getValue: ( { item } ) => item.templatePart.author_text,
				render: ( { item } ) => {
					return <Author viewType={ view.type } item={ item } />;
				},
				elements: authors,
				filterBy: {
					isPrimary: true,
				},
				width: '1%',
			} );
		}

		return _fields;
	}, [ view.type, categoryId, type, authors ] );

	// Reset the page number when the category changes.
	useEffect( () => {
		if ( previousCategoryId !== categoryId ) {
			setView( DEFAULT_VIEW );
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

	const history = useHistory();
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			if ( actionId === 'edit-post' ) {
				const post = items[ 0 ];
				history.push( {
					postId: post.id,
					postType: post.type,
					categoryId,
					categoryType: type,
					canvas: 'edit',
				} );
			}
		},
		[ history, categoryId, type ]
	);
	const [ editAction, viewRevisionsAction ] = usePostActions(
		onActionPerformed,
		[ 'edit-post', 'view-post-revisions' ]
	);
	const actions = useMemo( () => {
		if ( type === TEMPLATE_PART_POST_TYPE ) {
			return [
				editAction,
				renameAction,
				duplicateTemplatePartAction,
				viewRevisionsAction,
				resetAction,
				deleteAction,
			];
		}
		return [
			renameAction,
			duplicatePatternAction,
			exportJSONaction,
			resetAction,
			deleteAction,
		];
	}, [ type, editAction, viewRevisionsAction ] );
	const onChangeView = useCallback(
		( newView ) => {
			if ( newView.type !== view.type ) {
				newView = {
					...newView,
					layout: {
						...defaultConfigPerViewType[ newView.type ],
					},
				};
			}
			setView( newView );
		},
		[ view.type, setView ]
	);
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
					getItemId={ ( item ) => item.name }
					isLoading={ isResolving }
					view={ view }
					onChangeView={ onChangeView }
					supportedLayouts={ [ LAYOUT_GRID, LAYOUT_TABLE ] }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
