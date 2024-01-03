/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	Button,
	__experimentalHeading as Heading,
	Tooltip,
	Flex,
} from '@wordpress/components';
import { getQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
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
} from '../../utils/constants';
import {
	exportJSONaction,
	renameAction,
	resetAction,
	deleteAction,
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
	hiddenFields: [],
	layout: {
		...defaultConfigPerViewType[ LAYOUT_GRID ],
	},
	filters: [],
};

function Preview( { item, viewType } ) {
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
	return (
		<>
			<div
				className={ `page-patterns-preview-field is-viewtype-${ viewType }` }
				style={ { backgroundColor } }
			>
				{ isEmpty && isTemplatePart && __( 'Empty template part' ) }
				{ isEmpty && ! isTemplatePart && __( 'Empty pattern' ) }
				{ ! isEmpty && <BlockPreview blocks={ item.blocks } /> }
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
		<HStack alignment="center" justify="flex-start" spacing={ 3 }>
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
			<Flex as="span" gap={ 0 } justify="left">
				{ item.type === PATTERN_TYPES.theme ? (
					item.title
				) : (
					<Heading level={ 5 }>
						<Button
							variant="link"
							onClick={ onClick }
							// Required for the grid's roving tab index system.
							// See https://github.com/WordPress/gutenberg/pull/51898#discussion_r1243399243.
							tabIndex="-1"
						>
							{ item.title || item.name }
						</Button>
					</Heading>
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
	const { patterns, isResolving } = usePatterns(
		type,
		isUncategorizedThemePatterns ? '' : categoryId,
		{
			search: view.search,
			// syncStatus:
			// 	deferredSyncedFilter === 'all'
			// 		? undefined
			// 		: deferredSyncedFilter,
		}
	);
	const fields = useMemo(
		() => [
			{
				header: __( 'Preview' ),
				id: 'preview',
				render: ( { item } ) => (
					<Preview item={ item } viewType={ view.type } />
				),
				minWidth: 120,
				maxWidth: 120,
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
				maxWidth: 400,
				enableHiding: false,
			},
		],
		[ view.type, categoryId ]
	);
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
		() => [ renameAction, exportJSONaction, resetAction, deleteAction ],
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
