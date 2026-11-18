import { speak } from '@wordpress/a11y';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import type { Block, BlockType, Icon as BlockIcon } from '@wordpress/blocks';
import { Button, Icon as WCIcon, Modal } from '@wordpress/components';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataViewsPicker, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import type { ComponentProps } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, isRTL, sprintf } from '@wordpress/i18n';
import {
	archive as archiveIcon,
	blockDefault as blockDefaultIcon,
	category as categoryIcon,
	chevronDown as chevronDownIcon,
	chevronLeft as chevronLeftIcon,
	chevronRight as chevronRightIcon,
	customLink as customLinkIcon,
	file as fileIcon,
	image as imageIcon,
	page as pageIcon,
	postList as postListIcon,
} from '@wordpress/icons';
import { Badge, Icon, InputControl, Notice, Tabs } from '@wordpress/ui';
import { createMenuLinkBlock, getLinkKeys } from './bulk-add-create-block';
import { useLinksInMenu } from './bulk-add-sources';

/*
 * Ported from the "Add menu items" modal in the Create Not Learn editor
 * (`routes/navigation-edit/add-menu-items-modal.jsx`), so the two match.
 */

type WCIconType = ComponentProps< typeof WCIcon >[ 'icon' ];

// Records from `getEntityRecords`, which are untyped for these queries.
type EntityRecord = Record< string, any >;
type EntityRecordsArgs = [
	kind: string,
	name: string,
	query: Record< string, any >,
];

/**
 * An item in the picker: a page, post, block, term, archive or media item.
 */
interface PickerItem {
	group: string;
	id: string;
	linkLabel: string;
	objectId?: number;
	sourceKind: string;
	sourceType: string;
	status?: string;
	title: string;
	typeLabel: string;
	url?: string;
	blockIcon?: BlockIcon;
	blockName?: string;
	description?: string;
	mediaUrl?: string;
	inThisMenu?: boolean;
}

const EMPTY_ARRAY: EntityRecord[] = [];

const MENU_ITEM_GROUPS = [
	{
		description: __( 'Site pages and page-like content.' ),
		icon: pageIcon,
		id: 'pages',
		title: __( 'Pages' ),
	},
	{
		description: __( 'Posts and other individual content.' ),
		icon: postListIcon,
		id: 'content',
		title: __( 'Content' ),
	},
	{
		description: __( 'Blocks that can be inserted into navigation menus.' ),
		icon: blockDefaultIcon,
		id: 'blocks',
		title: __( 'Blocks' ),
	},
	{
		description: __( 'Categories, tags, and other term archives.' ),
		icon: categoryIcon,
		id: 'taxonomy',
		title: __( 'Categories & tags' ),
	},
	{
		description: __(
			'Post type archive index pages, such as all Posts, Products, or Events.'
		),
		icon: archiveIcon,
		id: 'archives',
		title: __( 'Archives' ),
	},
	{
		description: __( 'Media files and downloads.' ),
		icon: imageIcon,
		id: 'media',
		title: __( 'Media' ),
	},
	{
		description: __( 'Any URL, email, phone, anchor, or relative link.' ),
		icon: customLinkIcon,
		id: 'custom',
		title: __( 'Custom link' ),
	},
];
const PRIMARY_MENU_ITEM_GROUPS = new Set( [ 'pages', 'content', 'blocks' ] );
const EXCLUDED_BLOCK_INSERTIONS = new Set( [
	'core/navigation-link',
	'core/navigation-submenu',
	'core/home-link',
] );
const MENU_ITEM_GROUPS_BY_ID = Object.fromEntries(
	MENU_ITEM_GROUPS.map( ( group ) => [ group.id, group ] )
);

const PAGE_ARGS: EntityRecordsArgs = [
	'postType',
	'page',
	{
		context: 'edit',
		order: 'asc',
		orderby: 'menu_order',
		per_page: 100,
		status: 'publish',
		_fields: 'id,link,menu_order,parent,status,title,type',
	},
];
const POST_ARGS: EntityRecordsArgs = [
	'postType',
	'post',
	{
		context: 'edit',
		order: 'desc',
		orderby: 'date',
		per_page: 25,
		status: 'publish,draft,pending,private',
		_fields: 'id,link,status,title,type',
	},
];
const CATEGORY_ARGS: EntityRecordsArgs = [
	'taxonomy',
	'category',
	{
		context: 'view',
		hide_empty: false,
		order: 'asc',
		orderby: 'name',
		per_page: 25,
	},
];
const TAG_ARGS: EntityRecordsArgs = [
	'taxonomy',
	'post_tag',
	{
		context: 'view',
		hide_empty: false,
		order: 'asc',
		orderby: 'name',
		per_page: 25,
	},
];
const MEDIA_ARGS: EntityRecordsArgs = [
	'postType',
	'attachment',
	{
		context: 'edit',
		order: 'desc',
		orderby: 'date',
		per_page: 50,
		_fields: 'id,link,media_type,mime_type,source_url,status,title,type',
	},
];

function getRecordTitle( record: EntityRecord ) {
	const title =
		record?.title?.raw || record?.title?.rendered || record?.title;

	if ( typeof title === 'string' && title ) {
		return decodeEntities( title.replace( /<[^>]*>/g, '' ) ).trim();
	}

	return __( '(no title)' );
}

function createPickerView( group: string ): View {
	let fields = [ 'typeLabel', 'linkLabel', 'inThisMenu' ];

	if ( group === 'pages' ) {
		fields = [ 'status', 'inThisMenu' ];
	} else if ( group === 'blocks' ) {
		fields = [ 'description' ];
	}

	return {
		descriptionField: 'linkLabel',
		fields,
		filters: [],
		layout: {
			badgeFields: [ 'typeLabel', 'status', 'inThisMenu' ],
			previewSize: group === 'media' ? 140 : 160,
		},
		mediaField: 'preview',
		page: 1,
		perPage: 25,
		search: '',
		showDescription: false,
		showMedia: group === 'media',
		titleField: 'title',
		type: group === 'media' ? 'pickerGrid' : 'pickerTable',
		// The table view ignores the grid's `layout` options.
	} as View;
}

function getRecordStatusLabel( status?: string ) {
	return status === 'publish' ? __( 'Published' ) : __( 'Draft' );
}

function normalizeMenuItemUrl(
	rawUrl: string
): { href: string; error?: undefined } | { error: string; href?: undefined } {
	const trimmed = rawUrl.trim();

	if ( ! trimmed ) {
		return { error: __( 'Enter a URL' ) };
	}

	try {
		if ( trimmed.startsWith( '#' ) ) {
			return { href: trimmed };
		}

		if (
			trimmed.startsWith( '/' ) ||
			trimmed.startsWith( './' ) ||
			trimmed.startsWith( '../' )
		) {
			const url = new URL( trimmed, 'https://example.invalid' );
			return { href: `${ url.pathname }${ url.search }${ url.hash }` };
		}

		if ( /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( trimmed ) ) {
			return { href: `mailto:${ trimmed }` };
		}

		const href = /^[a-z][a-z0-9+.-]*:/i.test( trimmed )
			? trimmed
			: `https://${ trimmed }`;
		// Throws for a URL that can't be parsed.

		new URL( href );
		return { href };
	} catch {
		return { error: __( 'Enter a valid URL' ) };
	}
}

function createBlockFromPickerItem( item: PickerItem ): Block {
	if ( item.group === 'blocks' ) {
		return createBlock( item.blockName as string );
	}

	return createMenuLinkBlock( {
		id: item.objectId,
		kind: item.sourceKind,
		title: item.title,
		type: item.sourceType,
		url: item.url,
	} );
}

function isPickerItemInMenu(
	item: Omit< PickerItem, 'inThisMenu' >,
	linksInMenu: Set< string >
) {
	if ( item.group === 'blocks' ) {
		return false;
	}
	return getLinkKeys( {
		kind: item.sourceKind,
		type: item.sourceType,
		id: item.objectId,
		url: item.url,
	} ).some( ( key ) => linksInMenu.has( key ) );
}

/**
 * Bulk add modal for menu items (#86179).
 *
 * People tick several pages, posts or blocks and add them to the menu in one
 * go. Less common content (categories and tags, archives, media and custom
 * links) sits behind "More", so the main flow stays simple.
 *
 * @param props              Component props.
 * @param props.rootClientId Client id of the block to add items into (the Navigation block or a sub menu).
 * @param props.onClose      Called when the modal closes.
 */
export default function BulkAddModal( {
	rootClientId,
	onClose,
}: {
	rootClientId: string;
	onClose: () => void;
} ) {
	const [ activeGroup, setActiveGroup ] = useState( 'pages' );
	const [ areMoreGroupsVisible, setAreMoreGroupsVisible ] = useState( false );
	const [ customLabel, setCustomLabel ] = useState( '' );
	const [ customUrl, setCustomUrl ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ view, setView ] = useState< View >( () =>
		createPickerView( 'pages' )
	);
	const linksInMenu = useLinksInMenu( rootClientId );
	const { insertBlocks } = useDispatch( blockEditorStore );
	const {
		categories,
		isResolvingContent,
		isResolvingMedia,
		isResolvingPages,
		isResolvingTerms,
		media,
		pages,
		posts,
		tags,
	} = useSelect( ( select ) => {
		const store = select( coreDataStore );
		const getRecords = ( ...args: EntityRecordsArgs ) =>
			store.getEntityRecords( ...args ) as EntityRecord[] | null;

		return {
			isResolvingContent: store.isResolving(
				'getEntityRecords',
				POST_ARGS
			),
			isResolvingMedia: store.isResolving(
				'getEntityRecords',
				MEDIA_ARGS
			),
			isResolvingPages: store.isResolving(
				'getEntityRecords',
				PAGE_ARGS
			),
			isResolvingTerms:
				store.isResolving( 'getEntityRecords', CATEGORY_ARGS ) ||
				store.isResolving( 'getEntityRecords', TAG_ARGS ),
			media: getRecords( ...MEDIA_ARGS ) || EMPTY_ARRAY,
			pages: getRecords( ...PAGE_ARGS ) || EMPTY_ARRAY,
			posts: getRecords( ...POST_ARGS ) || EMPTY_ARRAY,
			categories: getRecords( ...CATEGORY_ARGS ) || EMPTY_ARRAY,
			tags: getRecords( ...TAG_ARGS ) || EMPTY_ARRAY,
		};
	}, [] );
	// Built here rather than in the selectors, which would hand back new
	// arrays, and re-render the modal, on every change to any store.
	const terms = useMemo(
		(): EntityRecord[] => [
			...categories.map( ( term ) => ( {
				...term,
				taxonomy: 'category',
			} ) ),
			...tags.map( ( term ) => ( {
				...term,
				taxonomy: 'post_tag',
			} ) ),
		],
		[ categories, tags ]
	);
	// Blocks the Navigation block allows, that can go where items are added:
	// a sub menu takes fewer blocks than the top level of the menu.
	const blockItems = useSelect(
		( select ) => {
			const { getBlockType, getBlockTypes } = select( blocksStore );
			const { canInsertBlockType } = select( blockEditorStore );
			const allowedBlocks =
				getBlockType( 'core/navigation' )?.allowedBlocks || [];
			const blockTypesByName = new Map(
				getBlockTypes().map( ( blockType ) => [
					blockType.name,
					blockType,
				] )
			);

			return allowedBlocks
				.filter(
					( name ) =>
						! EXCLUDED_BLOCK_INSERTIONS.has( name ) &&
						canInsertBlockType( name, rootClientId )
				)
				.map( ( name ) => blockTypesByName.get( name ) )
				.filter( ( blockType ): blockType is BlockType =>
					Boolean( blockType )
				);
		},
		[ rootClientId ]
	);
	const items = useMemo( (): PickerItem[] => {
		const nextItems: Omit< PickerItem, 'inThisMenu' >[] = [
			...pages.map( ( page ) => ( {
				group: 'pages',
				id: `post-type:page:${ page.id }`,
				linkLabel: page.link || '',
				objectId: page.id,
				sourceKind: 'post-type',
				sourceType: 'page',
				status: page.status || 'publish',
				title: getRecordTitle( page ),
				typeLabel: __( 'Page' ),
				url: page.link || '',
			} ) ),
			...posts.map( ( post ) => ( {
				group: 'content',
				id: `post-type:post:${ post.id }`,
				linkLabel: post.link || '',
				objectId: post.id,
				sourceKind: 'post-type',
				sourceType: post.type || 'post',
				status: post.status || 'publish',
				title: getRecordTitle( post ),
				typeLabel: __( 'Post' ),
				url: post.link || '',
			} ) ),
			...blockItems.map( ( blockType ) => ( {
				blockIcon: blockType.icon?.src,
				blockName: blockType.name,
				description: blockType.description,
				group: 'blocks',
				id: `block:${ blockType.name }`,
				linkLabel: blockType.name,
				sourceKind: 'custom',
				sourceType: blockType.name,
				title: blockType.title || blockType.name,
				typeLabel: __( 'Block' ),
			} ) ),
			...terms.map( ( term ) => ( {
				group: 'taxonomy',
				id: `taxonomy:${ term.taxonomy }:${ term.id }`,
				linkLabel: term.link || '',
				objectId: term.id,
				sourceKind: 'taxonomy',
				sourceType: term.taxonomy === 'post_tag' ? 'tag' : 'category',
				title: decodeEntities( term.name || __( '(no title)' ) ),
				typeLabel:
					term.taxonomy === 'post_tag'
						? __( 'Tag' )
						: __( 'Category' ),
				url: term.link || '',
			} ) ),
			{
				group: 'archives',
				id: 'post-type-archive:post',
				linkLabel: '/?post_type=post',
				sourceKind: 'post-type-archive',
				sourceType: 'post',
				title: __( 'Posts' ),
				typeLabel: __( 'Archive' ),
				url: '/?post_type=post',
			},
			...media.map( ( item ) => ( {
				group: 'media',
				id: `post-type:attachment:${ item.id }`,
				linkLabel: item.link || item.source_url || '',
				mediaUrl:
					item.media_type === 'image' ? item.source_url : undefined,
				objectId: item.id,
				sourceKind: 'post-type',
				sourceType: 'attachment',
				status: item.status || 'publish',
				title: getRecordTitle( item ),
				typeLabel:
					item.media_type === 'image' ? __( 'Image' ) : __( 'Media' ),
				url: item.link || item.source_url || '',
			} ) ),
		];

		return nextItems.map( ( item ) => ( {
			...item,
			inThisMenu: isPickerItemInMenu( item, linksInMenu ),
		} ) );
	}, [ blockItems, linksInMenu, media, pages, posts, terms ] );
	const group = MENU_ITEM_GROUPS_BY_ID[ activeGroup ];
	const activeItems = useMemo(
		() => items.filter( ( item ) => item.group === activeGroup ),
		[ activeGroup, items ]
	);
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( activeItems, view, pickerFields ),
		[ activeItems, view ]
	);
	const selectedItems = activeItems.filter( ( item ) =>
		selection.includes( item.id )
	);
	const isResolving =
		( activeGroup === 'pages' && isResolvingPages ) ||
		( activeGroup === 'content' && isResolvingContent ) ||
		( activeGroup === 'taxonomy' && isResolvingTerms ) ||
		( activeGroup === 'media' && isResolvingMedia );
	const selectGroup = ( nextGroup: string ) => {
		setActiveGroup( nextGroup );
		setError( '' );
		setSelection( [] );
		setView( createPickerView( nextGroup ) );
	};
	const addBlocks = ( blocks: Block[] ) => {
		// Keep the current selection, so the list view and inspector stay
		// where people were working.
		insertBlocks( blocks, undefined, rootClientId, false );
		speak(
			sprintf(
				/* translators: %d: number of menu items. */
				_n(
					'%d menu item added.',
					'%d menu items added.',
					blocks.length
				),
				blocks.length
			),
			'polite'
		);
		onClose();
	};
	const addSelectedItems = () => {
		if ( selectedItems.length === 0 ) {
			return;
		}

		addBlocks( selectedItems.map( createBlockFromPickerItem ) );
	};
	const addCustomLink = () => {
		const normalizedUrl = normalizeMenuItemUrl( customUrl );

		if ( normalizedUrl.error ) {
			setError( normalizedUrl.error );
			return;
		}

		const trimmedLabel = customLabel.trim();

		if ( ! trimmedLabel ) {
			setError( __( 'Enter link text' ) );
			return;
		}

		addBlocks( [
			createMenuLinkBlock( {
				kind: 'custom',
				title: trimmedLabel,
				url: normalizedUrl.href,
			} ),
		] );
	};

	return (
		<Modal
			className="navigation-add-items-modal"
			onRequestClose={ onClose }
			title={ __( 'Add menu items' ) }
		>
			<div className="navigation-add-items-modal__inner">
				<Tabs.Root
					className="navigation-add-items-modal__tabs"
					onValueChange={ selectGroup }
					orientation="vertical"
					value={ activeGroup }
				>
					<Tabs.List className="navigation-add-items-modal__tablist">
						{ MENU_ITEM_GROUPS.filter(
							( itemGroup ) =>
								PRIMARY_MENU_ITEM_GROUPS.has( itemGroup.id ) ||
								areMoreGroupsVisible
						).map( ( itemGroup ) => (
							<Tabs.Tab
								className="navigation-add-items-modal__tab"
								key={ itemGroup.id }
								value={ itemGroup.id }
							>
								<span className="navigation-add-items-modal__tab-icon">
									<Icon icon={ itemGroup.icon } />
								</span>
								<span className="navigation-add-items-modal__tab-label">
									{ itemGroup.title }
								</span>
								<span className="navigation-add-items-modal__tab-chevron">
									<Icon
										icon={
											isRTL()
												? chevronLeftIcon
												: chevronRightIcon
										}
									/>
								</span>
							</Tabs.Tab>
						) ) }
						{ ! areMoreGroupsVisible && (
							<Button
								__next40pxDefaultSize
								className="navigation-add-items-modal__more-tab"
								onClick={ () =>
									setAreMoreGroupsVisible( true )
								}
								variant="tertiary"
							>
								<span className="navigation-add-items-modal__more-tab-icon">
									<Icon icon={ chevronDownIcon } />
								</span>
								<span className="navigation-add-items-modal__tab-label">
									{ __( 'More' ) }
								</span>
							</Button>
						) }
					</Tabs.List>
					<Tabs.Panel
						className="navigation-add-items-modal__panel"
						value={ activeGroup }
					>
						<div className="navigation-add-items-modal__header">
							<div>
								<h2>{ group.title }</h2>
								<p>{ group.description }</p>
							</div>
						</div>
						{ activeGroup === 'custom' && (
							<div className="navigation-add-items-custom-link">
								{ !! error && (
									<Notice.Root intent="error">
										<Notice.Description>
											{ error }
										</Notice.Description>
									</Notice.Root>
								) }
								<InputControl
									label={ __( 'URL' ) }
									onValueChange={ ( nextUrl ) => {
										setError( '' );
										setCustomUrl( nextUrl );
									} }
									value={ customUrl }
								/>
								<InputControl
									label={ __( 'Link text' ) }
									onValueChange={ ( nextLabel ) => {
										setError( '' );
										setCustomLabel( nextLabel );
									} }
									value={ customLabel }
								/>
								<div className="navigation-add-items-custom-link__actions">
									<Button
										__next40pxDefaultSize
										onClick={ onClose }
										variant="tertiary"
									>
										{ __( 'Cancel' ) }
									</Button>
									<Button
										__next40pxDefaultSize
										onClick={ addCustomLink }
										variant="primary"
									>
										{ __( 'Add to menu' ) }
									</Button>
								</div>
							</div>
						) }
						{ activeGroup !== 'custom' && (
							<DataViewsPicker
								actions={ [
									{
										callback: addSelectedItems,
										id: 'add-to-menu',
										isPrimary: true,
										label: __( 'Add to menu' ),
										supportsBulk: true,
									},
								] }
								data={ shownData }
								defaultLayouts={ {
									pickerGrid: true,
									pickerTable: true,
								} }
								fields={ pickerFields }
								getItemId={ ( item ) => item.id }
								isLoading={ isResolving }
								itemListLabel={ group.title }
								onChangeSelection={ setSelection }
								onChangeView={ setView }
								paginationInfo={ paginationInfo }
								selection={ selection }
								view={ view }
							>
								<div className="navigation-add-items-modal__toolbar">
									<DataViewsPicker.Search
										label={ __( 'Search menu items' ) }
									/>
									<div className="navigation-add-items-modal__toolbar-actions">
										<DataViewsPicker.FiltersToggle />
										<DataViewsPicker.ViewConfig />
										<DataViewsPicker.LayoutSwitcher />
									</div>
								</div>
								<DataViewsPicker.FiltersToggled className="navigation-add-items-modal__filters" />
								<div className="navigation-add-items-modal__picker-scroll">
									<DataViewsPicker.BulkActionToolbar />
									<DataViewsPicker.Layout />
								</div>
								<div className="navigation-add-items-modal__picker-footer">
									<DataViewsPicker.Footer />
								</div>
							</DataViewsPicker>
						) }
					</Tabs.Panel>
				</Tabs.Root>
			</div>
		</Modal>
	);
}

function PickerPreview( { item }: { item: PickerItem } ) {
	if ( item.group === 'media' && item.mediaUrl ) {
		return (
			<div className="navigation-add-items-picker__preview is-image">
				<img alt="" src={ item.mediaUrl } />
			</div>
		);
	}

	return (
		<div className="navigation-add-items-picker__preview">
			<div className="navigation-add-items-picker__preview-header" />
			<div className="navigation-add-items-picker__preview-line" />
			<div className="navigation-add-items-picker__preview-line is-short" />
		</div>
	);
}

function PickerSourceIcon( { item }: { item: PickerItem } ) {
	let icon: WCIconType = pageIcon;

	if ( item.group === 'blocks' ) {
		// A block's icon can be a Dashicon name, which `WCIcon` also takes.
		icon = ( item.blockIcon || blockDefaultIcon ) as WCIconType;
	} else if ( item.group === 'media' ) {
		icon = item.mediaUrl ? imageIcon : fileIcon;
	} else if ( item.group === 'taxonomy' ) {
		icon = categoryIcon;
	} else if ( item.group === 'custom' ) {
		icon = customLinkIcon;
	} else if ( item.group === 'archives' ) {
		icon = archiveIcon;
	} else if ( item.group === 'content' ) {
		icon = postListIcon;
	}

	return (
		<span className="navigation-add-items-picker__source-icon">
			{ /* Block icons are not always SVG elements, so this stays on the components `Icon`. */ }
			<WCIcon icon={ icon } />
		</span>
	);
}

const pickerFields: Field< PickerItem >[] = [
	{
		enableGlobalSearch: false,
		enableHiding: false,
		enableSorting: false,
		filterBy: false,
		id: 'preview',
		label: __( 'Preview' ),
		render: PickerPreview,
		type: 'media',
	},
	{
		enableGlobalSearch: true,
		enableHiding: false,
		id: 'title',
		label: __( 'Title' ),
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__title-cell">
				<PickerSourceIcon item={ item } />
				<span className="navigation-add-items-picker__title">
					{ item.title }
				</span>
			</span>
		),
		type: 'text',
	},
	{
		enableGlobalSearch: true,
		enableSorting: false,
		filterBy: false,
		id: 'description',
		label: __( 'Description' ),
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__description">
				{ item.description || item.typeLabel }
			</span>
		),
		type: 'text',
	},
	{
		enableGlobalSearch: true,
		enableHiding: false,
		enableSorting: false,
		filterBy: false,
		id: 'typeLabel',
		label: __( 'Type' ),
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__type">
				{ item.typeLabel }
			</span>
		),
		type: 'text',
	},
	{
		enableGlobalSearch: true,
		enableSorting: false,
		filterBy: false,
		id: 'linkLabel',
		label: __( 'Link' ),
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__link">
				{ item.linkLabel }
			</span>
		),
		type: 'text',
	},
	{
		enableGlobalSearch: false,
		enableHiding: false,
		enableSorting: false,
		filterBy: false,
		id: 'status',
		label: __( 'Status' ),
		render: ( { item } ) => (
			<Badge intent={ item.status === 'publish' ? 'stable' : 'draft' }>
				{ getRecordStatusLabel( item.status ) }
			</Badge>
		),
		type: 'text',
	},
	{
		enableGlobalSearch: false,
		enableHiding: false,
		enableSorting: false,
		filterBy: false,
		id: 'inThisMenu',
		label: __( 'Menu' ),
		render: ( { item } ) =>
			item.inThisMenu ? (
				<Badge intent="informational">{ __( 'In this menu' ) }</Badge>
			) : (
				<span className="navigation-add-items-picker__empty">-</span>
			),
		type: 'text',
	},
];
