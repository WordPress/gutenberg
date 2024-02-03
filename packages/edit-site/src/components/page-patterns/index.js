/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	Button,
	Tooltip,
	Flex,
} from '@wordpress/components';
import { getQueryArgs } from '@wordpress/url';
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
import {
	DataViews,
	sortByTextFields,
	getPaginationResults,
} from '@wordpress/dataviews';
import {
	Icon,
	header,
	footer,
	symbolFilled as uncategorized,
	symbol,
	lockSmall,
} from '@wordpress/icons';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Page from '../page';
import {
	LAYOUT_GRID,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_SYNC_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	ENUMERATION_TYPE,
	OPERATOR_IN,
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

const { ExperimentalBlockEditorProvider, useGlobalStyle } = unlock(
	blockEditorPrivateApis
);

const templatePartIcons = { header, footer, uncategorized };
const EMPTY_ARRAY = [];
const defaultConfigPerViewType = {
	[ LAYOUT_GRID ]: {
		mediaField: 'preview',
		primaryField: 'title',
	},
};
const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	search: '',
	page: 1,
	perPage: 20,
	hiddenFields: [ 'sync-status' ],
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
	if ( item.type === PATTERN_TYPES.theme ) {
		return children;
	}
	return (
		<button
			className="page-patterns-preview-field__button"
			type="button"
			onClick={ onClick }
			aria-label={ item.title }
			aria-describedby={ ariaDescribedBy }
		>
			{ children }
		</button>
	);
}

function Preview( { item, categoryId, viewType } ) {
	const descriptionId = useId();
	const isUserPattern = item.type === PATTERN_TYPES.user;
	const isNonUserPattern = item.type === PATTERN_TYPES.theme;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const isEmpty = ! item.blocks?.length;
	// Only custom patterns or custom template parts can be renamed or deleted.
	const isCustomPattern =
		isUserPattern || ( isTemplatePart && item.isCustom );
	const ariaDescriptions = [];
	if ( isCustomPattern ) {
		// User patterns don't have descriptions, but can be edited and deleted, so include some help text.
		ariaDescriptions.push(
			__( 'Press Enter to edit, or Delete to delete the pattern.' )
		);
	} else if ( item.description ) {
		ariaDescriptions.push( item.description );
	}

	if ( isNonUserPattern ) {
		ariaDescriptions.push(
			__( 'Theme & plugin patterns cannot be edited.' )
		);
	}
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const { onClick } = useLink( {
		postType: item.type,
		postId: isUserPattern ? item.id : item.name,
		categoryId,
		categoryType: isTemplatePart ? item.type : PATTERN_TYPES.theme,
	} );

	return (
		<>
			<div
				className={ `page-patterns-preview-field is-viewtype-${ viewType }` }
				style={ { backgroundColor } }
			>
				<PreviewWrapper
					item={ item }
					onClick={ onClick }
					ariaDescribedBy={
						ariaDescriptions.length
							? ariaDescriptions
									.map(
										( _, index ) =>
											`${ descriptionId }-${ index }`
									)
									.join( ' ' )
							: undefined
					}
				>
					{ isEmpty && isTemplatePart && __( 'Empty template part' ) }
					{ isEmpty && ! isTemplatePart && __( 'Empty pattern' ) }
					{ ! isEmpty && <BlockPreview blocks={ item.blocks } /> }
				</PreviewWrapper>
			</div>
			{ ariaDescriptions.map( ( ariaDescription, index ) => (
				<div
					key={ index }
					hidden
					id={ `${ descriptionId }-${ index }` }
				>
					{ ariaDescription }
				</div>
			) ) }
		</>
	);
}

function Title( { item, categoryId } ) {
	const isUserPattern = item.type === PATTERN_TYPES.user;
	const isNonUserPattern = item.type === PATTERN_TYPES.theme;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	let itemIcon;
	const { onClick } = useLink( {
		postType: item.type,
		postId: isUserPattern ? item.id : item.name,
		categoryId,
		categoryType: isTemplatePart ? item.type : PATTERN_TYPES.theme,
	} );
	if ( ! isUserPattern && templatePartIcons[ categoryId ] ) {
		itemIcon = templatePartIcons[ categoryId ];
	} else {
		itemIcon =
			item.syncStatus === PATTERN_SYNC_TYPES.full ? symbol : undefined;
	}
	return (
		<HStack alignment="center" justify="flex-start" spacing={ 2 }>
			{ itemIcon && ! isNonUserPattern && (
				<Tooltip
					placement="top"
					text={ __(
						'Editing this pattern will also update anywhere it is used'
					) }
				>
					<Icon
						className="edit-site-patterns__pattern-icon"
						icon={ itemIcon }
					/>
				</Tooltip>
			) }
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
		</HStack>
	);
}

export default function DataviewsPatterns() {
	const { categoryType, categoryId = PATTERN_DEFAULT_CATEGORY } =
		getQueryArgs( window.location.href );
	const type = categoryType || PATTERN_TYPES.theme;
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
			},
			{
				header: __( 'Title' ),
				id: 'title',
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => (
					<Title item={ item } categoryId={ categoryId } />
				),
				enableHiding: false,
			},
		];
		if ( type === PATTERN_TYPES.theme ) {
			_fields.push( {
				header: __( 'Sync Status' ),
				id: 'sync-status',
				render: ( { item } ) => {
					// User patterns can have their sync statuses checked directly.
					// Non-user patterns are all unsynced for the time being.
					return (
						SYNC_FILTERS.find(
							( { value } ) => value === item.syncStatus
						)?.label ||
						SYNC_FILTERS.find(
							( { value } ) =>
								value === PATTERN_SYNC_TYPES.unsynced
						).label
					);
				},
				type: ENUMERATION_TYPE,
				elements: SYNC_FILTERS,
				filterBy: {
					operators: [ OPERATOR_IN ],
					isPrimary: true,
				},
				enableSorting: false,
			} );
		}
		return _fields;
	}, [ view.type, categoryId, type ] );
	// Reset the page number when the category changes.
	useEffect( () => {
		if ( previousCategoryId !== categoryId ) {
			setView( DEFAULT_VIEW );
		}
	}, [ categoryId, previousCategoryId ] );
	const { data, paginationInfo } = useMemo( () => {
		if ( ! patterns ) {
			return {
				data: EMPTY_ARRAY,
				paginationInfo: { totalItems: 0, totalPages: 0 },
			};
		}
		let filteredData = [ ...patterns ];
		// Handle sorting.
		if ( view.sort ) {
			filteredData = sortByTextFields( {
				data: filteredData,
				view,
				fields,
				textFields: [ 'title', 'author' ],
			} );
		}
		// Handle pagination.
		return getPaginationResults( {
			data: filteredData,
			view,
		} );
	}, [ patterns, view, fields ] );

	const actions = useMemo(
		() => [
			renameAction,
			duplicatePatternAction,
			duplicateTemplatePartAction,
			exportJSONaction,
			resetAction,
			deleteAction,
		],
		[]
	);
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
	// TODO: check if I add the provider in every preview like in templates...
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
					deferredRendering={ true }
					supportedLayouts={ [ LAYOUT_GRID ] }
				/>
			</Page>
		</ExperimentalBlockEditorProvider>
	);
}
