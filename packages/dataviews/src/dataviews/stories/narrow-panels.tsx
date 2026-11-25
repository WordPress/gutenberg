import type { ReactNode } from 'react';
import { useState, useMemo } from '@wordpress/element';
import { Button } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
	Text,
} from '@wordpress/ui';
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { Field, View } from '../../types';
import styles from './style.module.css';

/**
 * A fixed 350px-wide frame, the width of a sidebar such as the block inserter.
 */
function NarrowPanel( {
	children,
	note,
}: {
	children: ReactNode;
	note?: ReactNode;
} ) {
	return (
		<Stack direction="column" gap="lg" align="start">
			<div className={ styles[ 'narrow-panel' ] }>{ children }</div>
			{ note && (
				<Text
					variant="body-sm"
					render={ <p /> }
					className={ styles[ 'narrow-panel-note' ] }
				>
					{ note }
				</Text>
			) }
		</Stack>
	);
}

/**
 * The first row of a narrow panel: search and the settings button.
 */
function NarrowPanelSearchRow( { children }: { children: ReactNode } ) {
	return (
		<Stack
			direction="row"
			align="center"
			gap="xs"
			className={ styles[ 'narrow-panel-row' ] }
		>
			{ children }
		</Stack>
	);
}

/**
 * The last row of a narrow panel, provided by the consumer.
 */
function NarrowPanelFooter( { children }: { children: ReactNode } ) {
	return (
		<Stack
			direction="column"
			gap="md"
			className={ styles[ 'narrow-panel-footer' ] }
		>
			{ children }
		</Stack>
	);
}

const isSameView = ( a: View, b: View ) =>
	JSON.stringify( a ) === JSON.stringify( b );

const toElements = ( values: string[] ) =>
	values.map( ( value ) => ( { value, label: value } ) );

/*
 * Patterns.
 */

type Pattern = {
	id: number;
	title: string;
	categories: string[];
	source: string;
	syncStatus: string;
};

const PATTERN_CATEGORIES = [
	'About',
	'Banners',
	'Call to action',
	'Contact',
	'Footers',
	'Gallery',
	'Headers',
	'Posts',
];
const PATTERN_SOURCES = [ 'Pattern Directory', 'Theme & Plugins', 'User' ];
const PATTERN_TYPES = [ 'Synced', 'Not synced' ];

const patterns: Pattern[] = [
	'Hero with a large heading',
	'Three columns of text',
	'Call to action with a button',
	'Contact details and a map',
	'Footer with a site title',
	'Offset gallery',
	'Header with navigation',
	'List of recent posts',
	'About the team',
	'Banner with a cover image',
	'Newsletter sign-up',
	'Opening hours',
	'Footer with three columns',
	'Gallery with captions',
	'Centered header',
	'Featured posts grid',
].map( ( title, index ) => ( {
	id: index + 1,
	title,
	// Like real patterns, some belong to more than one category.
	categories:
		index % 3 === 0
			? [
					PATTERN_CATEGORIES[ index % PATTERN_CATEGORIES.length ],
					PATTERN_CATEGORIES[
						( index + 2 ) % PATTERN_CATEGORIES.length
					],
				]
			: [ PATTERN_CATEGORIES[ index % PATTERN_CATEGORIES.length ] ],
	source: PATTERN_SOURCES[ index % PATTERN_SOURCES.length ],
	syncStatus:
		PATTERN_SOURCES[ index % PATTERN_SOURCES.length ] === 'User' &&
		index % 2 === 0
			? 'Synced'
			: 'Not synced',
} ) );

const patternFields: Field< Pattern >[] = [
	{
		id: 'preview',
		label: 'Preview',
		type: 'media',
		render: () => (
			<div className={ styles[ 'narrow-panel-pattern' ] }>
				<span />
				<span />
			</div>
		),
		enableSorting: false,
	},
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		enableGlobalSearch: true,
		enableSorting: false,
		filterBy: false,
	},
	{
		// Shown as tabs. A pattern can be in several categories, so the
		// value is a list and a tab matches when the list contains it.
		id: 'category',
		label: 'Category',
		type: 'array',
		getValue: ( { item } ) => item.categories,
		elements: toElements( PATTERN_CATEGORIES ),
		filterBy: { operators: [ 'isAny' ] },
		enableSorting: false,
	},
	{
		id: 'source',
		label: 'Source',
		type: 'text',
		elements: toElements( PATTERN_SOURCES ),
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
	{
		id: 'syncStatus',
		label: 'Type',
		type: 'text',
		elements: toElements( PATTERN_TYPES ),
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
];

const PATTERNS_DEFAULT_VIEW: View = {
	type: 'grid',
	search: '',
	page: 1,
	perPage: 20,
	filters: [],
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
	// Wider than half the panel, so the grid has a single column.
	layout: { previewSize: 230, aspectRatio: '16/9' },
};

/**
 * The row anatomy for a narrow panel, as in the Patterns tab of the inserter:
 * search and the settings button, the pattern categories as tabs, the content
 * and a footer. "Category" is shown as tabs, so it is left out of the menu.
 */
export const NarrowPatternsComponent = () => {
	const [ view, setView ] = useState< View >( PATTERNS_DEFAULT_VIEW );
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( patterns, view, patternFields ),
		[ view ]
	);
	return (
		<NarrowPanel>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ patternFields }
				onChangeView={ setView }
				defaultLayouts={ { grid: {} } }
				onReset={
					isSameView( view, PATTERNS_DEFAULT_VIEW )
						? false
						: () => setView( PATTERNS_DEFAULT_VIEW )
				}
			>
				<NarrowPanelSearchRow>
					<DataViews.Search />
					<DataViews.ViewMenu excludeFields={ [ 'category' ] }>
						<Menu.LinkItem
							href="https://wordpress.org/patterns/"
							openInNewTab
						>
							<Menu.ItemLabel>
								About pattern sources
							</Menu.ItemLabel>
						</Menu.LinkItem>
					</DataViews.ViewMenu>
				</NarrowPanelSearchRow>
				<DataViews.FilterTabs field="category" />
				<NarrowPanelFooter>
					<Button variant="secondary" __next40pxDefaultSize>
						Explore all patterns
					</Button>
				</NarrowPanelFooter>
			</DataViews>
		</NarrowPanel>
	);
};

/*
 * Media.
 */

type Media = {
	id: number;
	title: string;
	mediaType: string;
	source: string;
	date: string;
	colors: [ string, string ];
};

const MEDIA_TYPES = [
	{ value: 'image', label: 'Images' },
	{ value: 'video', label: 'Videos' },
	{ value: 'audio', label: 'Audio' },
];
const MEDIA_SOURCES = [
	{ value: 'library', label: 'Media Library' },
	{ value: 'attached', label: 'Attached to this page' },
	{ value: 'openverse', label: 'Openverse' },
];
const MEDIA_COLORS: [ string, string ][] = [
	[ '#b4cdf0', '#2b3f78' ],
	[ '#e3c7ab', '#726251' ],
	[ '#e1ea94', '#827e40' ],
	[ '#d4c1a8', '#413931' ],
	[ '#cbbfb4', '#36393b' ],
	[ '#d7d7d7', '#4b4b4b' ],
];
const MEDIA_TITLES = [
	'Morning light',
	'Harbour',
	'Field notes',
	'Workshop',
	'Paper cranes',
	'Sea wall',
	'Night market',
	'Staircase',
	'Orchard',
	'Signal',
];

const media: Media[] = Array.from( { length: 60 }, ( _item, index ) => ( {
	id: index + 1,
	title: `${ MEDIA_TITLES[ index % MEDIA_TITLES.length ] } ${
		Math.floor( index / MEDIA_TITLES.length ) + 1
	}`,
	mediaType: MEDIA_TYPES[ index % MEDIA_TYPES.length ].value,
	source: MEDIA_SOURCES[ index % 2 === 0 ? 0 : ( index % 5 ) % 3 ].value,
	date: `2025-${ String( ( index % 12 ) + 1 ).padStart( 2, '0' ) }-${ String(
		( index % 27 ) + 1
	).padStart( 2, '0' ) }T09:00:00`,
	colors: MEDIA_COLORS[ index % MEDIA_COLORS.length ],
} ) );

const mediaFields: Field< Media >[] = [
	{
		id: 'preview',
		label: 'Preview',
		type: 'media',
		render: ( { item } ) => (
			<div
				className={ styles[ 'narrow-panel-media' ] }
				style={ {
					background: `linear-gradient(135deg, ${ item.colors[ 0 ] }, ${ item.colors[ 1 ] })`,
				} }
			/>
		),
		enableSorting: false,
	},
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		enableGlobalSearch: true,
		filterBy: false,
	},
	{
		id: 'date',
		label: 'Date',
		type: 'datetime',
		filterBy: false,
	},
	{
		// Shown as tabs.
		id: 'mediaType',
		label: 'Media type',
		type: 'text',
		elements: MEDIA_TYPES,
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
	{
		id: 'source',
		label: 'Source',
		type: 'text',
		elements: MEDIA_SOURCES,
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
];

const MEDIA_DEFAULT_VIEW: View = {
	type: 'grid',
	search: '',
	page: 1,
	perPage: 8,
	// Media is always browsed one type and one source at a time, so the
	// view starts with both filters and neither has an "All" option.
	filters: [
		{ field: 'mediaType', operator: 'is', value: 'image' },
		{ field: 'source', operator: 'is', value: 'library' },
	],
	sort: { field: 'date', direction: 'desc' },
	titleField: 'title',
	mediaField: 'preview',
	fields: [],
	// Narrower than half the panel, so the grid has two columns.
	layout: { previewSize: 120, density: 'compact' },
};

/**
 * The row anatomy for a narrow panel, as in the Media tab of the inserter:
 * search and the settings button, the media types as tabs, the content and a
 * footer. "Media type" is shown as tabs, so it is left out of the menu, and
 * "Source" always has a value, so it has no "All" option.
 */
export const NarrowMediaComponent = () => {
	const [ view, setView ] = useState< View >( MEDIA_DEFAULT_VIEW );
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( media, view, mediaFields ),
		[ view ]
	);
	return (
		<NarrowPanel>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ mediaFields }
				onChangeView={ setView }
				defaultLayouts={ { grid: {} } }
				onReset={
					isSameView( view, MEDIA_DEFAULT_VIEW )
						? false
						: () => setView( MEDIA_DEFAULT_VIEW )
				}
			>
				<NarrowPanelSearchRow>
					<DataViews.Search />
					<DataViews.ViewMenu
						excludeFields={ [ 'mediaType' ] }
						requiredFields={ [ 'source' ] }
						showSort
					/>
				</NarrowPanelSearchRow>
				<DataViews.FilterTabs field="mediaType" showAll={ false } />
				<NarrowPanelFooter>
					<DataViews.Pagination />
					<Button variant="secondary" __next40pxDefaultSize>
						Attach images
					</Button>
				</NarrowPanelFooter>
			</DataViews>
		</NarrowPanel>
	);
};

/*
 * Ineligible filters.
 */

type Post = {
	id: number;
	title: string;
	status: string;
	author: string;
	date: string;
	tags: string[];
	format: string;
};

const AUTHORS = [
	'Ada',
	'Bao',
	'Carmen',
	'Dmitri',
	'Esi',
	'Farah',
	'Goran',
	'Hana',
	'Ines',
	'Jomo',
	'Kaito',
	'Lucía',
];
const STATUSES = [ 'Draft', 'Scheduled', 'Published', 'Private' ];
const TAGS = [ 'News', 'Guides', 'Releases', 'Community' ];
const FORMATS = [ 'Standard', 'Gallery', 'Video' ];

const posts: Post[] = [
	'Welcome to the handbook',
	'How we plan a release',
	'Notes from the contributor day',
	'A tour of the new sidebar',
	'Writing accessible documentation',
	'What changed in the editor',
	'Five tips for faster reviews',
	'Meet the design team',
	'Roadmap for the next quarter',
	'Behind the scenes of the redesign',
	'Getting started with patterns',
	'Community questions, answered',
	'A short history of the project',
	'Keyboard shortcuts worth knowing',
	'Looking back at the year',
	'How to report a good bug',
].map( ( title, index ) => ( {
	id: index + 1,
	title,
	status: STATUSES[ index % STATUSES.length ],
	author: AUTHORS[ index % AUTHORS.length ],
	date: `2025-${ String( ( index % 12 ) + 1 ).padStart( 2, '0' ) }-15T09:00:00`,
	tags: [ TAGS[ index % TAGS.length ], TAGS[ ( index + 1 ) % TAGS.length ] ],
	format: FORMATS[ index % FORMATS.length ],
} ) );

const postFields: Field< Post >[] = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		enableGlobalSearch: true,
		enableSorting: false,
		filterBy: false,
	},
	{
		// Eligible: a short fixed list, and one value at a time.
		id: 'status',
		label: 'Status',
		type: 'text',
		elements: toElements( STATUSES ),
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
	{
		// Left out: the list is too long for a menu.
		id: 'author',
		label: 'Author',
		type: 'text',
		elements: toElements( AUTHORS ),
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
	{
		// Left out: a date is not a list of choices.
		id: 'date',
		label: 'Date',
		type: 'datetime',
		enableSorting: false,
	},
	{
		// Left out: several values can be chosen at once.
		id: 'tags',
		label: 'Tags',
		type: 'array',
		elements: toElements( TAGS ),
		enableSorting: false,
	},
	{
		// Left out: the choices are loaded on demand.
		id: 'format',
		label: 'Format',
		type: 'text',
		getElements: async () => toElements( FORMATS ),
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
];

const POSTS_DEFAULT_VIEW: View = {
	type: 'list',
	search: '',
	page: 1,
	perPage: 8,
	filters: [],
	titleField: 'title',
	fields: [ 'status', 'author', 'date' ],
};

/**
 * `DataViews.ViewMenu` only shows what works as menu items. Of the five
 * filterable fields in this dataset, only "Status" is in the menu:
 *
 * - "Author" has a list of 12 options, too long for a menu.
 * - "Date" is not a list of choices.
 * - "Tags" lets you choose several values at once.
 * - "Format" loads its choices on demand.
 */
export const NarrowIneligibleFiltersComponent = () => {
	const [ view, setView ] = useState< View >( POSTS_DEFAULT_VIEW );
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( posts, view, postFields ),
		[ view ]
	);
	return (
		<NarrowPanel note="Only “Status” is in the menu. “Author” (12 options), “Date” (not a list), “Tags” (several values at once) and “Format” (loaded on demand) are left out.">
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ postFields }
				onChangeView={ setView }
				defaultLayouts={ { list: {} } }
				onReset={
					isSameView( view, POSTS_DEFAULT_VIEW )
						? false
						: () => setView( POSTS_DEFAULT_VIEW )
				}
			>
				<NarrowPanelSearchRow>
					<DataViews.Search />
					<DataViews.ViewMenu />
				</NarrowPanelSearchRow>
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
		</NarrowPanel>
	);
};
