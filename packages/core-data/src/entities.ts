/**
 * External dependencies
 */
import { upperFirst, camelCase, map, find, get, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { addEntities } from './actions';
import {
	Attachment,
	Comment,
	Context,
	EntityRecord,
	MenuLocation,
	NavigationArea,
	NavMenu,
	NavMenuItem,
	Page,
	Plugin,
	Post,
	Settings,
	Sidebar,
	Taxonomy,
	Theme,
	Type,
	Updatable,
	User,
	Widget,
	WidgetType,
	WpTemplate,
	WpTemplatePart,
} from './types';

export type EntityQuery< C extends Context > = Record< string, string > & {
	context?: C;
};

export interface EntityDefinition extends Object {
	label: string;
	kind: string;
	name: string;
	baseURL: string;
	plural?: string;
	key?: string;
	baseURLParams?: EntityQuery< any >;
	getTitle?: ( unknown ) => string;
	rawAttributes?: readonly string[];
	transientEdits?: {
		blocks: boolean;
	};
}

/**
 * This function is in place to make the elements of defaultEntities
 * both compliant with the EntityDefinition interface AND a const.
 *
 * @param  definition The description of the entity.
 */
const defineEntity = < T extends EntityDefinition >( definition: T ) =>
	definition;

export const DEFAULT_ENTITY_KEY = 'id';

const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

export const defaultEntities = [
	defineEntity( {
		label: __( 'Base' ),
		name: '__unstableBase',
		kind: 'root',
		baseURL: '/',
	} as const ),
	defineEntity( {
		label: __( 'Site' ),
		name: 'site',
		kind: 'root',
		baseURL: '/wp/v2/settings',
		getTitle: ( record ) => {
			return get( record, [ 'title' ], __( 'Site Title' ) );
		},
	} as const ),
	defineEntity( {
		label: __( 'Post Type' ),
		name: 'postType',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/types',
		baseURLParams: { context: 'edit' },
		rawAttributes: POST_RAW_ATTRIBUTES,
	} as const ),
	defineEntity( {
		name: 'media',
		kind: 'root',
		baseURL: '/wp/v2/media',
		baseURLParams: { context: 'edit' },
		plural: 'mediaItems',
		label: __( 'Media' ),
	} as const ),
	defineEntity( {
		name: 'taxonomy',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/taxonomies',
		baseURLParams: { context: 'edit' },
		plural: 'taxonomies',
		label: __( 'Taxonomy' ),
	} as const ),
	defineEntity( {
		name: 'sidebar',
		kind: 'root',
		baseURL: '/wp/v2/sidebars',
		plural: 'sidebars',
		transientEdits: { blocks: true },
		label: __( 'Widget areas' ),
	} as const ),
	defineEntity( {
		name: 'widget',
		kind: 'root',
		baseURL: '/wp/v2/widgets',
		baseURLParams: { context: 'edit' },
		plural: 'widgets',
		transientEdits: { blocks: true },
		label: __( 'Widgets' ),
	} as const ),
	defineEntity( {
		name: 'widgetType',
		kind: 'root',
		baseURL: '/wp/v2/widget-types',
		baseURLParams: { context: 'edit' },
		plural: 'widgetTypes',
		label: __( 'Widget types' ),
	} as const ),
	defineEntity( {
		label: __( 'User' ),
		name: 'user',
		kind: 'root',
		baseURL: '/wp/v2/users',
		baseURLParams: { context: 'edit' },
		plural: 'users',
	} as const ),
	defineEntity( {
		name: 'comment',
		kind: 'root',
		baseURL: '/wp/v2/comments',
		baseURLParams: { context: 'edit' },
		plural: 'comments',
		label: __( 'Comment' ),
	} as const ),
	defineEntity( {
		name: 'menu',
		kind: 'root',
		baseURL: '/wp/v2/menus',
		baseURLParams: { context: 'edit' },
		plural: 'menus',
		label: __( 'Menu' ),
	} as const ),
	defineEntity( {
		name: 'menuItem',
		kind: 'root',
		baseURL: '/wp/v2/menu-items',
		baseURLParams: { context: 'edit' },
		plural: 'menuItems',
		label: __( 'Menu Item' ),
		rawAttributes: [ 'title', 'content' ],
	} as const ),
	defineEntity( {
		name: 'menuLocation',
		kind: 'root',
		baseURL: '/wp/v2/menu-locations',
		baseURLParams: { context: 'edit' },
		plural: 'menuLocations',
		label: __( 'Menu Location' ),
		key: 'name',
	} as const ),
	defineEntity( {
		name: 'navigationArea',
		kind: 'root',
		baseURL: '/wp/v2/block-navigation-areas',
		baseURLParams: { context: 'edit' },
		plural: 'navigationAreas',
		label: __( 'Navigation Area' ),
		key: 'name',
		getTitle: ( record ) => record?.description,
	} as const ),
	defineEntity( {
		label: __( 'Global Styles' ),
		name: 'globalStyles',
		kind: 'root',
		baseURL: '/wp/v2/global-styles',
		baseURLParams: { context: 'edit' },
		plural: 'globalStylesVariations', // Should be different than name.
		getTitle: ( record ) => record?.title?.rendered || record?.title,
	} as const ),
	defineEntity( {
		label: __( 'Themes' ),
		name: 'theme',
		kind: 'root',
		baseURL: '/wp/v2/themes',
		baseURLParams: { context: 'edit' },
		key: 'stylesheet',
	} as const ),
	defineEntity( {
		label: __( 'Plugins' ),
		name: 'plugin',
		kind: 'root',
		baseURL: '/wp/v2/plugins',
		baseURLParams: { context: 'edit' },
		key: 'plugin',
	} as const ),
] as const;

type Element = typeof defaultEntities[ number ];

type DefaultEntityContext<
	K extends string,
	N extends string,
	E = Extract< Element, { kind: K; name: N } >
> = 'baseURLParams' extends keyof E
	? 'context' extends keyof E[ 'baseURLParams' ]
		? E[ 'baseURLParams' ][ 'context' ]
		: 'view'
	: 'view';

type EntityKeyName<
	K extends string,
	N extends string,
	E = Extract< Element, { kind: K; name: N } >
> = 'key' extends keyof E ? E[ 'key' ] : 'id';

type DeclaredEntity< K extends string, N extends string, RecordType > = {
	kind: K;
	name: N;
	recordType: RecordType;
	keyType: EntityKeyName< K, N > extends keyof RecordType
		? RecordType[ EntityKeyName< K, N > ]
		: never;
	defaultContext: DefaultEntityContext< K, N >;
};
type APIEntity<
	K extends string,
	N extends string,
	RecordType,
	KeyName = 'id',
	C = 'edit'
> = {
	kind: K;
	name: N;
	recordType: RecordType;
	keyType: KeyName extends keyof RecordType ? RecordType[ KeyName ] : never;
	defaultContext: C;
};

export type EntityType< C extends Context = any > =
	| DeclaredEntity< 'root', 'site', Settings< C > >
	| DeclaredEntity< 'root', 'postType', Type< C > >
	| DeclaredEntity< 'root', 'media', Attachment< C > >
	| DeclaredEntity< 'root', 'taxonomy', Taxonomy< C > >
	| DeclaredEntity< 'root', 'sidebar', Sidebar< C > >
	| DeclaredEntity< 'root', 'widget', Widget< C > >
	| DeclaredEntity< 'root', 'widgetType', WidgetType< C > >
	| DeclaredEntity< 'root', 'user', User< C > >
	| DeclaredEntity< 'root', 'comment', Comment< C > >
	| DeclaredEntity< 'root', 'menu', NavMenu< C > >
	| DeclaredEntity< 'root', 'menuItem', NavMenuItem< C > >
	| DeclaredEntity< 'root', 'menuLocation', MenuLocation< C > >
	| DeclaredEntity< 'root', 'navigationArea', NavigationArea< C > >
	| DeclaredEntity< 'root', 'theme', Theme< C > >
	| DeclaredEntity< 'root', 'plugin', Plugin< C > >
	| APIEntity< 'postType', 'post', Post< C > >
	| APIEntity< 'postType', 'page', Page< C > >
	| APIEntity< 'postType', 'wp_template', WpTemplate< C > >
	| APIEntity< 'postType', 'wp_template_part', WpTemplatePart< C > >;

export type Kind = EntityType[ 'kind' ];
export type Name = EntityType[ 'name' ];

export type EntityRecordType<
	K extends Kind,
	N extends Name,
	C extends Context = any
> = Extract< EntityType< C >, { kind: K; name: N } >[ 'recordType' ];

export type Key< K extends Kind, N extends Name > = Extract<
	EntityType,
	{ kind: K; name: N }
>[ 'keyType' ];

export type DefaultContext< K extends Kind, N extends Name > = Extract<
	EntityType,
	{ kind: K; name: N }
>[ 'defaultContext' ];

export const additionalEntityConfigLoaders = [
	{ kind: 'postType', loadEntities: loadPostTypeEntities },
	{ kind: 'taxonomy', loadEntities: loadTaxonomyEntities },
];

/**
 * Returns a function to be used to retrieve extra edits to apply before persisting a post type.
 *
 * @param {Object} persistedRecord Already persisted Post
 * @param {Object} edits           Edits.
 * @return {Object} Updated edits.
 */
export const prePersistPostType = ( persistedRecord, edits ) => {
	const newEdits = {} as Updatable< Post< 'edit' > >;

	if ( persistedRecord?.status === 'auto-draft' ) {
		// Saving an auto-draft should create a draft by default.
		if ( ! edits.status && ! newEdits.status ) {
			newEdits.status = 'draft';
		}

		// Fix the auto-draft default title.
		if (
			( ! edits.title || edits.title === 'Auto Draft' ) &&
			! newEdits.title &&
			( ! persistedRecord?.title ||
				persistedRecord?.title === 'Auto Draft' )
		) {
			newEdits.title = '';
		}
	}

	return newEdits;
};

/**
 * Returns the list of post type entities.
 *
 * @return {Promise} Entities promise
 */
async function loadPostTypeEntities() {
	const postTypes = ( await apiFetch( {
		path: '/wp/v2/types?context=view',
	} ) ) as Record< string, Type< 'view' > >;
	return map( postTypes, ( postType, name ) => {
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			name
		);
		const namespace = postType?.rest_namespace ?? 'wp/v2';
		return {
			kind: 'postType',
			baseURL: `/${ namespace }/${ postType.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: postType.name,
			transientEdits: {
				blocks: true,
				selection: true,
			},
			mergedEdits: { meta: true },
			rawAttributes: POST_RAW_ATTRIBUTES,
			getTitle: ( record ) =>
				record?.title?.rendered ||
				record?.title ||
				( isTemplate ? startCase( record.slug ) : String( record.id ) ),
			__unstablePrePersist: isTemplate ? undefined : prePersistPostType,
			__unstable_rest_base: postType.rest_base,
		};
	} );
}

/**
 * Returns the list of the taxonomies entities.
 *
 * @return {Promise} Entities promise
 */
async function loadTaxonomyEntities() {
	const taxonomies = ( await apiFetch( {
		path: '/wp/v2/taxonomies?context=view',
	} ) ) as Array< Taxonomy< 'view' > >;
	return map( taxonomies, ( taxonomy, name ) => {
		const namespace = taxonomy?.rest_namespace ?? 'wp/v2';
		return {
			kind: 'taxonomy',
			baseURL: `/${ namespace }/${ taxonomy.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: taxonomy.name,
		};
	} );
}

/**
 * Returns the entity's getter method name given its kind and name.
 *
 * @example
 * ```js
 * const nameSingular = getMethodName( 'root', 'theme', 'get' );
 * // nameSingular is getRootTheme
 *
 * const namePlural = getMethodName( 'root', 'theme', 'set' );
 * // namePlural is setRootThemes
 * ```
 *
 * @param {string}  kind      Entity kind.
 * @param {string}  name      Entity name.
 * @param {string}  prefix    Function prefix.
 * @param {boolean} usePlural Whether to use the plural form or not.
 *
 * @return {string} Method name
 */
export const getMethodName = (
	kind,
	name,
	prefix = 'get',
	usePlural = false
) => {
	const entityConfig = find( rootEntitiesConfig, { kind, name } );
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix =
		upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix =
		usePlural && 'plural' in entity && entity.plural
			? upperFirst( camelCase( entity.plural ) )
			: nameSuffix;
	return `${ prefix }${ kindPrefix }${ suffix }`;
};

/**
 * Loads the kind entities into the store.
 *
 * @param {string} kind Kind
 *
 * @return {Array} Entities
 */
export const getOrLoadEntitiesConfig = ( kind ) => async ( {
	select,
	dispatch,
} ) => {
	let configs = select.getEntitiesConfig( kind );
	if ( configs && configs.length !== 0 ) {
		return configs;
	}

	const loader = find( additionalEntityConfigLoaders, { kind } );
	if ( ! loader ) {
		return [];
	}

	configs = await loader.loadEntities();
	dispatch( addEntities( configs ) );

	return configs;
};
