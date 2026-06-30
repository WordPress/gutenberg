/**
 * WordPress dependencies
 */
import {
	Button,
	Icon as WCIcon,
	Modal,
	Notice,
	TextControl,
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	DataViewsPicker,
	filterSortAndPaginate,
	type Action,
	type Field,
	type View,
} from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import {
	createBlock,
	store as blocksStore,
	// @ts-expect-error - No type declarations available for @wordpress/blocks
} from '@wordpress/blocks';
import {
	archive,
	blockDefault,
	category,
	chevronDown,
	customLink,
	file,
	image,
	page as pageIcon,
	postList,
} from '@wordpress/icons';
import { Tabs } from '@wordpress/ui';

const RESOLVE_BASE = 'https://example.invalid';

const PAGE_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft', 'pending', 'private' ],
	orderby: 'menu_order',
	order: 'asc',
};

const CONTENT_QUERY = {
	per_page: 25,
	status: [ 'publish', 'draft', 'pending', 'private' ],
	orderby: 'date',
	order: 'desc',
};

const TERMS_QUERY = {
	per_page: 25,
	hide_empty: false,
	orderby: 'name',
	order: 'asc',
};

const MEDIA_QUERY = {
	per_page: 50,
	orderby: 'date',
	order: 'desc',
};

const POST_TYPES_QUERY = { per_page: -1 };
const TAXONOMIES_QUERY = { per_page: -1 };

const DEFAULT_GROUP = 'pages';
const EXCLUDED_BLOCK_INSERTIONS = new Set( [
	'core/navigation-link',
	'core/navigation-submenu',
	'core/home-link',
] );
const GROUPS = [
	{
		id: 'pages',
		title: __( 'Pages' ),
		description: __( 'Site pages and page-like content.' ),
		icon: pageIcon,
	},
	{
		id: 'content',
		title: __( 'Content' ),
		description: __( 'Posts and other individual content.' ),
		icon: postList,
	},
	{
		id: 'blocks',
		title: __( 'Blocks' ),
		description: __( 'Blocks that can be inserted into navigation menus.' ),
		icon: blockDefault,
	},
	{
		id: 'taxonomy',
		title: __( 'Categories & tags' ),
		description: __( 'Categories, tags, and other term archives.' ),
		icon: category,
	},
	{
		id: 'archives',
		title: __( 'Archives' ),
		description: __(
			'Post type archive index pages, such as all Posts, Products, or Events.'
		),
		icon: archive,
	},
	{
		id: 'media',
		title: __( 'Media' ),
		description: __( 'Media files and downloads.' ),
		icon: image,
	},
	{
		id: 'custom',
		title: __( 'Custom link' ),
		description: __( 'Any URL, email, phone, anchor, or relative link.' ),
		icon: customLink,
	},
] as const;

type PickerGroup = ( typeof GROUPS )[ number ][ 'id' ];
type SourceKind = 'post-type' | 'post-type-archive' | 'taxonomy' | 'custom';

const PRIMARY_GROUPS = new Set< PickerGroup >( [
	'pages',
	'content',
	'blocks',
] );

interface PostRecord {
	id: number;
	link?: string;
	status?: string;
	type?: string;
	title?: {
		raw?: string;
		rendered?: string;
	};
	content?: {
		raw?: string;
		rendered?: string;
	};
}

interface PostTypeRecord {
	slug: string;
	rest_base?: string;
	viewable?: boolean;
	visibility?: {
		public?: boolean;
		show_in_nav_menus?: boolean;
	};
	site_editor_archive_url?: string | null;
	labels?: {
		archives?: string;
		name?: string;
		singular_name?: string;
	};
}

interface TaxonomyRecord {
	slug: string;
	rest_base?: string;
	visibility?: {
		public?: boolean;
		show_ui?: boolean;
	};
	labels?: {
		name?: string;
		singular_name?: string;
	};
}

interface TermRecord {
	id: number;
	link?: string;
	name?: string;
	taxonomy?: string;
}

interface MediaRecord {
	id: number;
	link?: string;
	source_url?: string;
	media_type?: string;
	mime_type?: string;
	title?: {
		raw?: string;
		rendered?: string;
	};
}

interface ContentRecordEntry {
	record: PostRecord;
	postType: PostTypeRecord;
}

interface TermRecordEntry {
	record: TermRecord;
	taxonomy: TaxonomyRecord;
}

interface MenuItemSourceRecords {
	archivePostTypes: PostTypeRecord[];
	contentPostTypes: PostTypeRecord[];
	contentRecords: ContentRecordEntry[];
	termRecords: TermRecordEntry[];
	mediaRecords: MediaRecord[];
}

interface PickerItem {
	id: string;
	title: string;
	linkLabel: string;
	description?: string;
	status?: string;
	typeLabel: string;
	group: PickerGroup;
	sourceKind: SourceKind;
	sourceType: string;
	objectId?: number;
	url?: string;
	inThisMenu: boolean;
	mediaUrl?: string;
	blockName?: string;
	blockIcon?: unknown;
}

interface NavigationBlock {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks?: NavigationBlock[];
}

interface LinkedNavigationState {
	entityKeys: Set< string >;
	urls: Set< string >;
}

interface AddMenuItemsModalProps {
	navigationBlocks: NavigationBlock[];
	navigationMenu: PostRecord;
	onClose: () => void;
	onAddBlocks: ( blocks: NavigationBlock[] ) => void;
}

const EMPTY_SOURCE_RECORDS: MenuItemSourceRecords = {
	archivePostTypes: [],
	contentPostTypes: [],
	contentRecords: [],
	termRecords: [],
	mediaRecords: [],
};

interface BlockTypeRecord {
	name: string;
	title?: string;
	description?: string;
	icon?: {
		src?: unknown;
	};
	allowedBlocks?: string[];
}

function getDefaultFieldsForGroup( group: PickerGroup ) {
	if ( group === 'pages' ) {
		return [ 'status', 'inThisMenu' ];
	}

	if ( group === 'blocks' ) {
		return [ 'description' ];
	}

	return [ 'typeLabel', 'linkLabel', 'inThisMenu' ];
}

function getPostTypeFilterLabel( postType: PostTypeRecord ) {
	return (
		postType.labels?.name || postType.labels?.singular_name || postType.slug
	);
}

function getPostTypeItemLabel( postType: PostTypeRecord ) {
	return (
		postType.labels?.singular_name || postType.labels?.name || postType.slug
	);
}

function createDefaultView( group: PickerGroup ): View {
	const isGrid = group === 'media';
	return {
		type: isGrid ? 'pickerGrid' : 'pickerTable',
		search: '',
		filters: [],
		page: 1,
		perPage: 25,
		titleField: 'title',
		mediaField: 'preview',
		descriptionField: 'linkLabel',
		fields: getDefaultFieldsForGroup( group ),
		layout: {
			badgeFields: [ 'typeLabel', 'status', 'inThisMenu' ],
			previewSize: group === 'media' ? 140 : 160,
		},
		showMedia: isGrid,
		showDescription: false,
	};
}

function getPostTitle( record: PostRecord | MediaRecord ) {
	return decodeEntities(
		record.title?.rendered || record.title?.raw || __( '(no title)' )
	);
}

function getTaxonomyTypeForBlock( taxonomySlug: string ) {
	return taxonomySlug === 'post_tag' ? 'tag' : taxonomySlug;
}

function getEntityKey( kind: SourceKind, type: string, objectId?: number ) {
	if ( kind === 'custom' || ! objectId ) {
		return undefined;
	}
	return `${ kind }:${ type }:${ objectId }`;
}

function getLinkedNavigationState( content = '' ): LinkedNavigationState {
	const entityKeys = new Set< string >();
	const urls = new Set< string >();
	const blockPattern =
		/<!--\s+wp:navigation-(?:link|submenu)\s+(\{[\s\S]*?\})\s*(?:\/)?-->/g;

	let match;
	while ( ( match = blockPattern.exec( content ) ) ) {
		try {
			const attributes = JSON.parse( match[ 1 ] );
			if ( attributes.url ) {
				urls.add( attributes.url );
			}
			const entityKey = getEntityKey(
				attributes.kind,
				attributes.type,
				attributes.id
			);
			if ( entityKey ) {
				entityKeys.add( entityKey );
			}
		} catch {
			// Ignore malformed block comments. The editor will preserve them.
		}
	}

	return { entityKeys, urls };
}

function getLinkedNavigationStateFromBlocks(
	blocks: NavigationBlock[] = []
): LinkedNavigationState {
	const linkedState: LinkedNavigationState = {
		entityKeys: new Set< string >(),
		urls: new Set< string >(),
	};

	function visitBlock( block: NavigationBlock ) {
		if (
			block.name === 'core/navigation-link' ||
			block.name === 'core/navigation-submenu'
		) {
			const attributes = block.attributes || {};
			if ( typeof attributes.url === 'string' ) {
				linkedState.urls.add( attributes.url );
			}

			const entityKey = getEntityKey(
				attributes.kind as SourceKind,
				attributes.type as string,
				attributes.id as number | undefined
			);
			if ( entityKey ) {
				linkedState.entityKeys.add( entityKey );
			}
		}

		block.innerBlocks?.forEach( visitBlock );
	}

	blocks.forEach( visitBlock );

	return linkedState;
}

function isItemInNavigation(
	item: Omit< PickerItem, 'inThisMenu' >,
	linkedState: LinkedNavigationState
) {
	const entityKey = getEntityKey(
		item.sourceKind,
		item.sourceType,
		item.objectId
	);
	return (
		!! ( entityKey && linkedState.entityKeys.has( entityKey ) ) ||
		!! ( item.url && linkedState.urls.has( item.url ) )
	);
}

function getNavigationLinkBlock( item: PickerItem ): NavigationBlock {
	const attributes: Record< string, unknown > = {
		label: item.title,
		type: item.sourceType,
		kind: item.sourceKind,
		url: item.url || '',
	};

	if (
		item.objectId &&
		( item.sourceKind === 'post-type' || item.sourceKind === 'taxonomy' )
	) {
		attributes.id = item.objectId;
		attributes.metadata = {
			bindings: {
				url: {
					source:
						item.sourceKind === 'taxonomy'
							? 'core/term-data'
							: 'core/post-data',
					args: {
						field: 'link',
					},
				},
			},
		};
	}

	return createBlock( 'core/navigation-link', attributes );
}

function getNavigationBlock( item: PickerItem ): NavigationBlock {
	if ( item.group === 'blocks' && item.blockName ) {
		return createBlock( item.blockName );
	}

	return getNavigationLinkBlock( item );
}

function normalizeNavMenuHref( raw: string ) {
	const trimmed = raw.trim();
	if ( ! trimmed ) {
		return { ok: false, error: __( 'Enter a URL' ) };
	}

	try {
		if ( trimmed.startsWith( '#' ) ) {
			new URL( trimmed, RESOLVE_BASE );
			return { ok: true, href: trimmed };
		}

		if (
			trimmed.startsWith( '/' ) ||
			trimmed.startsWith( './' ) ||
			trimmed.startsWith( '../' )
		) {
			const url = new URL( trimmed, RESOLVE_BASE );
			return {
				ok: true,
				href: `${ url.pathname }${ url.search }${ url.hash }`,
			};
		}

		const hasColonScheme = /^[a-z][a-z0-9+.-]*:/i.test( trimmed );
		if ( hasColonScheme ) {
			new URL( trimmed );
			return { ok: true, href: trimmed };
		}

		if ( /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( trimmed ) ) {
			const href = `mailto:${ trimmed }`;
			new URL( href );
			return { ok: true, href };
		}

		const href = `https://${ trimmed }`;
		new URL( href );
		return { ok: true, href };
	} catch {
		return { ok: false, error: __( 'Enter a valid URL' ) };
	}
}

function parseMenuItemSourceRecords( payload: string ): MenuItemSourceRecords {
	try {
		return JSON.parse( payload ) as MenuItemSourceRecords;
	} catch {
		return EMPTY_SOURCE_RECORDS;
	}
}

function isContentPostType( postType: PostTypeRecord ) {
	const excluded = new Set( [
		'page',
		'attachment',
		'wp_block',
		'wp_navigation',
		'wp_template',
		'wp_template_part',
		'wp_font_family',
		'wp_font_face',
	] );
	return (
		!! postType?.slug &&
		! excluded.has( postType.slug ) &&
		! postType.slug.startsWith( 'wp_' ) &&
		postType.visibility?.public !== false &&
		postType.viewable !== false
	);
}

function isArchivePostType( postType: PostTypeRecord ) {
	return (
		!! postType?.slug &&
		postType.visibility?.show_in_nav_menus !== false &&
		postType.visibility?.public !== false &&
		postType.viewable !== false &&
		typeof postType.site_editor_archive_url === 'string' &&
		postType.site_editor_archive_url.length > 0
	);
}

function isLinkableTaxonomy( taxonomy: TaxonomyRecord ) {
	const excluded = new Set( [ 'nav_menu', 'link_category', 'post_format' ] );
	return (
		!! taxonomy?.slug &&
		! excluded.has( taxonomy.slug ) &&
		! taxonomy.slug.startsWith( 'wp_' ) &&
		taxonomy.visibility?.show_ui !== false &&
		taxonomy.visibility?.public !== false
	);
}

function PagePreview( { item }: { item: PickerItem } ) {
	if ( item.group === 'media' && item.mediaUrl ) {
		return (
			<div className="navigation-add-items-picker__preview is-image">
				<img src={ item.mediaUrl } alt="" />
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

function SourceIcon( { item }: { item: PickerItem } ) {
	let icon = pageIcon;

	if ( item.group === 'blocks' ) {
		icon = item.blockIcon || blockDefault;
	} else if ( item.group === 'media' ) {
		icon = item.mediaUrl ? image : file;
	} else if ( item.group === 'taxonomy' ) {
		icon = category;
	} else if ( item.group === 'custom' ) {
		icon = customLink;
	} else if ( item.group === 'archives' ) {
		icon = archive;
	} else if ( item.group === 'content' ) {
		icon = postList;
	}

	return (
		<span className="navigation-add-items-picker__source-icon">
			<WCIcon icon={ icon } />
		</span>
	);
}

const fields: Field< PickerItem >[] = [
	{
		id: 'preview',
		type: 'media',
		label: __( 'Preview' ),
		render: PagePreview,
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		enableGlobalSearch: false,
	},
	{
		id: 'title',
		type: 'text',
		label: __( 'Title' ),
		enableHiding: false,
		enableGlobalSearch: true,
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__title-cell">
				<SourceIcon item={ item } />
				<span className="navigation-add-items-picker__title">
					{ item.title }
				</span>
			</span>
		),
	},
	{
		id: 'description',
		type: 'text',
		label: __( 'Description' ),
		enableSorting: false,
		filterBy: false,
		enableGlobalSearch: true,
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__description">
				{ item.description || item.typeLabel }
			</span>
		),
	},
	{
		id: 'typeLabel',
		type: 'text',
		label: __( 'Type' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		enableGlobalSearch: true,
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__type">
				{ item.typeLabel }
			</span>
		),
	},
	{
		id: 'linkLabel',
		type: 'text',
		label: __( 'Link' ),
		enableSorting: false,
		filterBy: false,
		enableGlobalSearch: true,
		render: ( { item } ) => (
			<span className="navigation-add-items-picker__link">
				{ item.linkLabel }
			</span>
		),
	},
	{
		id: 'status',
		type: 'text',
		label: __( 'Status' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		enableGlobalSearch: false,
		render: ( { item } ) => (
			<span
				className={
					item.status === 'publish'
						? 'navigation-add-items-picker__badge is-published'
						: 'navigation-add-items-picker__badge is-draft'
				}
			>
				{ item.status === 'publish'
					? __( 'Published' )
					: __( 'Draft' ) }
			</span>
		),
	},
	{
		id: 'inThisMenu',
		type: 'text',
		label: __( 'Menu' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		enableGlobalSearch: false,
		render: ( { item } ) =>
			item.inThisMenu ? (
				<span className="navigation-add-items-picker__badge is-linked">
					{ __( 'In this menu' ) }
				</span>
			) : (
				<span className="navigation-add-items-picker__empty">-</span>
			),
	},
];

export default function AddMenuItemsModal( {
	navigationBlocks,
	navigationMenu,
	onAddBlocks,
	onClose,
}: AddMenuItemsModalProps ) {
	const [ activeGroup, setActiveGroup ] =
		useState< PickerGroup >( DEFAULT_GROUP );
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ view, setView ] = useState< View >( () =>
		createDefaultView( DEFAULT_GROUP )
	);
	const [ error, setError ] = useState< string >();
	const [ customUrl, setCustomUrl ] = useState( '' );
	const [ customLabel, setCustomLabel ] = useState( '' );
	const [ areMoreGroupsVisible, setAreMoreGroupsVisible ] = useState( false );

	const { records: pageRecords, isResolving: isResolvingPages } =
		useEntityRecords( 'postType', 'page', PAGE_QUERY );

	const blockItems = useSelect( ( select ) => {
		const { getBlockType } = select( blocksStore );
		const navigationBlock = getBlockType( 'core/navigation' ) as
			| BlockTypeRecord
			| undefined;

		return ( navigationBlock?.allowedBlocks || [] )
			.filter( ( name ) => ! EXCLUDED_BLOCK_INSERTIONS.has( name ) )
			.map( ( name ) => getBlockType( name ) as BlockTypeRecord )
			.filter( Boolean )
			.map( ( blockType ) => ( {
				id: `block:${ blockType.name }`,
				title: blockType.title || blockType.name,
				description: blockType.description,
				linkLabel: blockType.name,
				status: 'publish',
				typeLabel: __( 'Block' ),
				group: 'blocks' as const,
				sourceKind: 'custom' as const,
				sourceType: blockType.name,
				inThisMenu: false,
				blockName: blockType.name,
				blockIcon: blockType.icon?.src,
			} ) );
	}, [] ) as PickerItem[];

	const sourceRecordsPayload = useSelect( ( select ) => {
		const core = select( coreStore );
		const resolvedPostTypes = ( core.getPostTypes( POST_TYPES_QUERY ) ||
			[] ) as PostTypeRecord[];
		const resolvedContentPostTypes =
			resolvedPostTypes.filter( isContentPostType );
		const resolvedArchivePostTypes =
			resolvedPostTypes.filter( isArchivePostType );
		const resolvedTaxonomies = (
			core.getTaxonomies( TAXONOMIES_QUERY ) || []
		).filter( isLinkableTaxonomy ) as TaxonomyRecord[];

		const contentRecords = resolvedContentPostTypes.flatMap( ( postType ) =>
			(
				core.getEntityRecords(
					'postType',
					postType.slug,
					CONTENT_QUERY
				) || []
			).map( ( record: PostRecord ) => ( {
				record: {
					id: record.id,
					link: record.link,
					status: record.status,
					type: record.type,
					title: record.title,
				},
				postType: {
					slug: postType.slug,
					labels: postType.labels,
				},
			} ) )
		);
		const termRecords = resolvedTaxonomies.flatMap( ( taxonomy ) =>
			(
				core.getEntityRecords(
					'taxonomy',
					taxonomy.slug,
					TERMS_QUERY
				) || []
			).map( ( record: TermRecord ) => ( {
				record: {
					id: record.id,
					link: record.link,
					name: record.name,
					taxonomy: record.taxonomy,
				},
				taxonomy: {
					slug: taxonomy.slug,
					labels: taxonomy.labels,
				},
			} ) )
		);
		const mediaRecords = (
			core.getEntityRecords( 'postType', 'attachment', MEDIA_QUERY ) || []
		).map( ( record: MediaRecord ) => ( {
			id: record.id,
			link: record.link,
			source_url: record.source_url,
			media_type: record.media_type,
			mime_type: record.mime_type,
			title: record.title,
		} ) );

		/*
		 * Returning a primitive keeps useSelect stable while still
		 * subscribing to the dynamic entity selectors above.
		 */
		return JSON.stringify( {
			archivePostTypes: resolvedArchivePostTypes.map( ( postType ) => ( {
				slug: postType.slug,
				labels: postType.labels,
				site_editor_archive_url: postType.site_editor_archive_url,
			} ) ),
			contentPostTypes: resolvedContentPostTypes.map( ( postType ) => ( {
				slug: postType.slug,
				labels: postType.labels,
			} ) ),
			contentRecords,
			termRecords,
			mediaRecords,
		} );
	}, [] );
	const {
		archivePostTypes,
		contentPostTypes,
		contentRecords,
		termRecords,
		mediaRecords,
	} = useMemo(
		() => parseMenuItemSourceRecords( sourceRecordsPayload ),
		[ sourceRecordsPayload ]
	);

	const menuContent = navigationMenu.content?.raw || '';
	const linkedState = useMemo(
		() =>
			navigationBlocks.length
				? getLinkedNavigationStateFromBlocks( navigationBlocks )
				: getLinkedNavigationState( menuContent ),
		[ menuContent, navigationBlocks ]
	);

	const pageItems: PickerItem[] = useMemo(
		() =>
			( Array.isArray( pageRecords )
				? ( pageRecords as PostRecord[] )
				: []
			).map( ( page ) => {
				const item = {
					id: `page:${ page.id }`,
					title: getPostTitle( page ),
					linkLabel: page.link || '',
					status: page.status,
					typeLabel: __( 'Page' ),
					group: 'pages' as const,
					sourceKind: 'post-type' as const,
					sourceType: 'page',
					objectId: page.id,
					url: page.link,
				};
				return {
					...item,
					inThisMenu: isItemInNavigation( item, linkedState ),
				};
			} ),
		[ linkedState, pageRecords ]
	);

	const contentItems: PickerItem[] = useMemo(
		() =>
			contentRecords.map( ( { record, postType } ) => {
				const item = {
					id: `${ postType.slug }:${ record.id }`,
					title: getPostTitle( record ),
					linkLabel: record.link || '',
					status: record.status,
					typeLabel: getPostTypeItemLabel( postType ),
					group: 'content' as const,
					sourceKind: 'post-type' as const,
					sourceType: postType.slug,
					objectId: record.id,
					url: record.link,
				};
				return {
					...item,
					inThisMenu: isItemInNavigation( item, linkedState ),
				};
			} ),
		[ contentRecords, linkedState ]
	);

	const contentPostTypeElements = useMemo(
		() =>
			contentPostTypes.map( ( postType ) => ( {
				value: postType.slug,
				label: getPostTypeFilterLabel( postType ),
			} ) ),
		[ contentPostTypes ]
	);

	const archiveItems: PickerItem[] = useMemo(
		() =>
			archivePostTypes.map( ( postType ) => {
				const item = {
					id: `archive:${ postType.slug }`,
					title:
						postType.labels?.archives ||
						postType.labels?.name ||
						postType.slug,
					linkLabel: postType.site_editor_archive_url || '',
					status: 'publish',
					typeLabel: __( 'Archive' ),
					group: 'archives' as const,
					sourceKind: 'post-type-archive' as const,
					sourceType: postType.slug,
					url: postType.site_editor_archive_url || '',
				};
				return {
					...item,
					inThisMenu: isItemInNavigation( item, linkedState ),
				};
			} ),
		[ archivePostTypes, linkedState ]
	);

	const taxonomyItems: PickerItem[] = useMemo(
		() =>
			termRecords.map( ( { record, taxonomy } ) => {
				const sourceType = getTaxonomyTypeForBlock( taxonomy.slug );
				const item = {
					id: `${ taxonomy.slug }:${ record.id }`,
					title: decodeEntities( record.name || __( '(no title)' ) ),
					linkLabel: record.link || '',
					status: 'publish',
					typeLabel:
						taxonomy.labels?.singular_name ||
						taxonomy.labels?.name ||
						taxonomy.slug,
					group: 'taxonomy' as const,
					sourceKind: 'taxonomy' as const,
					sourceType,
					objectId: record.id,
					url: record.link,
				};
				return {
					...item,
					inThisMenu: isItemInNavigation( item, linkedState ),
				};
			} ),
		[ linkedState, termRecords ]
	);

	const mediaItems: PickerItem[] = useMemo(
		() =>
			( mediaRecords as MediaRecord[] ).map( ( mediaRecord ) => {
				const item = {
					id: `attachment:${ mediaRecord.id }`,
					title: getPostTitle( mediaRecord ),
					linkLabel: mediaRecord.link || mediaRecord.source_url || '',
					status: 'publish',
					typeLabel:
						mediaRecord.media_type === 'image'
							? __( 'Image' )
							: __( 'Media' ),
					group: 'media' as const,
					sourceKind: 'post-type' as const,
					sourceType: 'attachment',
					objectId: mediaRecord.id,
					url: mediaRecord.link || mediaRecord.source_url,
					mediaUrl:
						mediaRecord.media_type === 'image'
							? mediaRecord.source_url
							: undefined,
				};
				return {
					...item,
					inThisMenu: isItemInNavigation( item, linkedState ),
				};
			} ),
		[ linkedState, mediaRecords ]
	);

	const itemsByGroup = useMemo(
		() => ( {
			pages: pageItems,
			content: contentItems,
			archives: archiveItems,
			taxonomy: taxonomyItems,
			media: mediaItems,
			blocks: blockItems,
			custom: [],
		} ),
		[
			archiveItems,
			blockItems,
			contentItems,
			mediaItems,
			pageItems,
			taxonomyItems,
		]
	);

	const activeGroupConfig =
		GROUPS.find( ( group ) => group.id === activeGroup ) || GROUPS[ 0 ];
	const activeItems = itemsByGroup[ activeGroup ];
	const pickerFields = useMemo( () => {
		if ( activeGroup !== 'content' || contentPostTypeElements.length < 2 ) {
			return fields;
		}

		const postTypeFilterField: Field< PickerItem > = {
			id: 'sourceType',
			type: 'text',
			label: __( 'Content type' ),
			elements: contentPostTypeElements,
			getValue: ( { item } ) => item.sourceType,
			filterBy: {
				operators: [ 'is' ],
				isPrimary: true,
			},
			enableSorting: false,
			enableHiding: false,
			enableGlobalSearch: false,
			render: ( { item } ) => item.typeLabel,
		};

		return [ ...fields, postTypeFilterField ];
	}, [ activeGroup, contentPostTypeElements ] );
	const { data: processedItems, paginationInfo } = useMemo(
		() => filterSortAndPaginate( activeItems, view, pickerFields ),
		[ activeItems, pickerFields, view ]
	);

	const addItems = useCallback(
		( items: PickerItem[] ) => {
			if ( items.length === 0 ) {
				setError( __( 'Select at least one item.' ) );
				return;
			}

			onAddBlocks( items.map( getNavigationBlock ) );
			onClose();
		},
		[ onAddBlocks, onClose ]
	);

	const addSelectedItems = useCallback( () => {
		const selectedIds = new Set( selection );
		addItems(
			activeItems.filter( ( item ) => selectedIds.has( item.id ) )
		);
	}, [ activeItems, addItems, selection ] );

	const actions: Action< PickerItem >[] = useMemo(
		() => [
			{
				id: 'cancel',
				label: __( 'Cancel' ),
				supportsBulk: true,
				callback: onClose,
			},
			{
				id: 'confirm',
				label: __( 'Add to menu' ),
				isPrimary: true,
				supportsBulk: true,
				callback: addSelectedItems,
			},
		],
		[ addSelectedItems, onClose ]
	);

	const selectGroup = useCallback( ( nextGroup: PickerGroup ) => {
		setActiveGroup( nextGroup );
		if ( ! PRIMARY_GROUPS.has( nextGroup ) ) {
			setAreMoreGroupsVisible( true );
		}
		setSelection( [] );
		setError( undefined );
		setView( createDefaultView( nextGroup ) );
	}, [] );

	const addCustomLink = useCallback( () => {
		const label = customLabel.trim();

		if ( ! label ) {
			setError( __( 'Enter a label.' ) );
			return;
		}

		const normalized = normalizeNavMenuHref( customUrl );
		if ( ! normalized.ok || ! normalized.href ) {
			setError( normalized.error || __( 'Enter a valid URL.' ) );
			return;
		}

		const item: PickerItem = {
			id: `custom:${ normalized.href }`,
			title: label,
			linkLabel: normalized.href,
			status: 'publish',
			typeLabel: __( 'Custom link' ),
			group: 'custom',
			sourceKind: 'custom',
			sourceType: 'custom',
			url: normalized.href,
			inThisMenu: linkedState.urls.has( normalized.href ),
		};

		addItems( [ item ] );
	}, [ addItems, customLabel, customUrl, linkedState.urls ] );

	const isLoading = activeGroup === 'pages' ? isResolvingPages : false;
	const primaryGroups = GROUPS.filter( ( group ) =>
		PRIMARY_GROUPS.has( group.id )
	);
	const secondaryGroups = GROUPS.filter(
		( group ) => ! PRIMARY_GROUPS.has( group.id )
	);
	const renderGroupTab = ( group: ( typeof GROUPS )[ number ] ) => (
		<Tabs.Tab
			key={ group.id }
			value={ group.id }
			className="navigation-add-items-modal__tab"
		>
			<span
				className="navigation-add-items-modal__tab-icon"
				aria-hidden="true"
			>
				<WCIcon icon={ group.icon } />
			</span>
			<span className="navigation-add-items-modal__tab-label">
				{ group.title }
			</span>
		</Tabs.Tab>
	);

	return (
		<Modal
			className="navigation-add-items-modal"
			title={ __( 'Add menu items' ) }
			onRequestClose={ onClose }
			size="fill"
		>
			<div className="navigation-add-items-modal__inner">
				<Tabs.Root
					orientation="vertical"
					value={ activeGroup }
					onValueChange={ ( value ) =>
						selectGroup( value as PickerGroup )
					}
					className="navigation-add-items-modal__tabs"
				>
					<Tabs.List
						className="navigation-add-items-modal__tablist"
						aria-label={ __( 'Menu item types' ) }
					>
						{ primaryGroups.map( renderGroupTab ) }
						{ areMoreGroupsVisible ? (
							secondaryGroups.map( renderGroupTab )
						) : (
							<Button
								className="navigation-add-items-modal__more-tab"
								variant="tertiary"
								onClick={ () =>
									setAreMoreGroupsVisible( true )
								}
								__next40pxDefaultSize
							>
								<span className="navigation-add-items-modal__tab-label">
									{ __( 'More…' ) }
								</span>
								<span
									className="navigation-add-items-modal__more-tab-icon"
									aria-hidden="true"
								>
									<WCIcon icon={ chevronDown } />
								</span>
							</Button>
						) }
					</Tabs.List>

					<div className="navigation-add-items-modal__panel">
						<div className="navigation-add-items-modal__header">
							<div>
								<h2>{ activeGroupConfig.title }</h2>
								<p>{ activeGroupConfig.description }</p>
							</div>
						</div>

						{ error && (
							<Notice
								status="error"
								isDismissible
								onRemove={ () => setError( undefined ) }
							>
								{ error }
							</Notice>
						) }

						{ activeGroup === 'custom' ? (
							<div className="navigation-add-items-custom-link">
								<TextControl
									label={ __( 'URL' ) }
									value={ customUrl }
									onChange={ ( value ) => {
										setCustomUrl( value );
										setError( undefined );
									} }
									placeholder="https://wordpress.org"
									autoComplete="off"
									__next40pxDefaultSize
								/>
								<TextControl
									label={ __( 'Label' ) }
									value={ customLabel }
									onChange={ ( value ) => {
										setCustomLabel( value );
										setError( undefined );
									} }
									help={ __( 'Label shown in the menu' ) }
									__next40pxDefaultSize
								/>
								<div className="navigation-add-items-custom-link__actions">
									<Button
										variant="tertiary"
										onClick={ onClose }
										__next40pxDefaultSize
									>
										{ __( 'Cancel' ) }
									</Button>
									<Button
										variant="primary"
										onClick={ addCustomLink }
										__next40pxDefaultSize
									>
										{ __( 'Add link' ) }
									</Button>
								</div>
							</div>
						) : (
							<DataViewsPicker
								data={ processedItems }
								fields={ pickerFields }
								view={ view }
								onChangeView={ setView }
								actions={ actions }
								selection={ selection }
								onChangeSelection={ setSelection }
								isLoading={ isLoading }
								paginationInfo={ paginationInfo }
								defaultLayouts={ {
									pickerGrid: {
										badgeFields: [
											'typeLabel',
											'status',
											'inThisMenu',
										],
										layout: {
											previewSize:
												activeGroup === 'media'
													? 140
													: 160,
										},
									},
									pickerTable: {},
								} }
								getItemId={ ( item ) => item.id }
								itemListLabel={ activeGroupConfig.title }
							>
								<div className="navigation-add-items-modal__toolbar">
									<DataViewsPicker.Search
										label={ sprintf(
											/* translators: %s: item type label. */
											__( 'Search %s' ),
											activeGroupConfig.title.toLowerCase()
										) }
									/>
									<div className="navigation-add-items-modal__toolbar-actions">
										<DataViewsPicker.FiltersToggle />
										<DataViewsPicker.LayoutSwitcher />
										<DataViewsPicker.ViewConfig />
									</div>
								</div>
								<DataViewsPicker.FiltersToggled className="navigation-add-items-modal__filters" />
								<div className="navigation-add-items-modal__picker-scroll">
									<DataViewsPicker.Layout />
								</div>
								<div className="navigation-add-items-modal__picker-footer">
									<DataViewsPicker.Footer />
								</div>
							</DataViewsPicker>
						) }
					</div>
				</Tabs.Root>
			</div>
		</Modal>
	);
}
