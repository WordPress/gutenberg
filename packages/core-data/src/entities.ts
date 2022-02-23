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
import type { OmitNevers } from './types/helpers';

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

/**
 * Converts the defaultEntities into a TypeScript lookup type of the following shape:
 * {
 *   root: {
 *     plugin: // Plugin entity definition
 *     theme: // Theme entity definition
 *     // ...
 *   }
 * }
 */
type Element = typeof defaultEntities[ number ];
type ElementOfKind< K > = Element & { kind: K };

type DefaultEntities = {
	[ EntityGroup in Element as EntityGroup[ 'kind' ] ]: {
		[ Entity in ElementOfKind<
			EntityGroup[ 'kind' ]
		> as Entity[ 'name' ] ]: {
			key: 'key' extends keyof Entity ? Entity[ 'key' ] : 'id';
			defaultContext: 'baseURLParams' extends keyof Entity
				? 'context' extends keyof Entity[ 'baseURLParams' ]
					? Entity[ 'baseURLParams' ][ 'context' ]
					: 'view'
				: 'view';
		};
	};
};

type FlatEntities = {
	[ EntityGroup in Element as EntityGroup[ 'kind' ] ]: {
		[ Entity in ElementOfKind<
			EntityGroup[ 'kind' ]
		> as Entity[ 'name' ] ]: {
			name: Entity[ 'name' ];
			kind: Entity[ 'kind' ];
			key: 'key' extends keyof Entity ? Entity[ 'key' ] : 'id';
			defaultContext: 'baseURLParams' extends keyof Entity
				? 'context' extends keyof Entity[ 'baseURLParams' ]
					? Entity[ 'baseURLParams' ][ 'context' ]
					: 'view'
				: 'view';
		};
	};
};

type FlatEntities2 = FlatEntities[ keyof FlatEntities ];
type FlatEntities3 = FlatEntities2[ keyof FlatEntities2 ];

type FlatKind = keyof {
	[ FlatEntity in FlatEntities3 as FlatEntity[ 'kind' ] ]: {};
};
type FlatName< K extends FlatKind > = keyof OmitNevers<
	{
		[ FlatEntity in FlatEntities3 as FlatEntity[ 'name' ] ]: FlatEntity[ 'kind' ] extends K
			? true
			: never;
	}
>;

type FlatDefaultEntityContext<
	K extends FlatKind,
	N extends FlatName< K >
> = keyof OmitNevers<
	{
		[ FlatEntity in FlatEntities3 as FlatEntity[ 'defaultContext' ] ]: FlatEntity[ 'kind' ] extends K
			? FlatEntity[ 'name' ] extends N
				? true
				: never
			: never;
	}
>;



type ByKindType<C extends Context = any> = {
	'root--widget': {
		kind: 'root';
		name: 'widget';
		key: 'id';
		defaultContext: 'edit';
		recordType: Widget<C>;
	};
};

export type KindBT = ByKindType[ keyof ByKindType ][ 'kind' ];
export type NameBT< K extends KindBT > = ( ByKindType[ keyof ByKindType ] & {
	kind: K;
} )[ 'name' ];
export type KindNameBT = { kind: KindBT; name: NameBT< KindBT > };

type EntityBT<
	KN extends KindNameBT
> = ByKindType[ `${ KN[ 'kind' ] }--${ KN[ 'name' ] }` ];

type DefaultContext<
	KN extends KindNameBT
> = EntityBT< KN >[ 'defaultContext' ];
type EntityKey< KN extends KindNameBT > = EntityBT< KN >[ 'key' ];
type EntityKeyType< KN extends KindNameBT > = EntityRecordKN< KN, any >[ EntityKey< KN > ] &
	( string | number )


export type EntityRecordKN<
	KN extends KindNameBT
	C extends Context = DefaultContext< KN >
	> = EntityBT< KN >[ 'defaultContext' ]['recordType']<C>
//
// // EntityRecordByKindName< 'root', 'site' > is Settings<'view'>
// // EntityRecordByKindName< 'root', 'plugin' > is Plugin<'edit'>
// // EntityRecordByKindName< 'postType', 'wp_template' > is WpTemplate<'edit'>
//
// export type UpdatableEntityRecordByKindName<
// 	K extends Kind,
// 	N extends Name< K >
// 	> = EntityRecordByKindName< K, N, 'edit' > extends EntityRecord< 'edit' >
// 	? EntityRecordByKindName< K, N, 'edit' >
// 	: unknown;
// export type EntityRecordBT<XY extends KindNameBT>

// EntityKeyType< 'root', 'menuLocation' > is a string
// EntityKeyType< 'root', 'comment' > is a number
// EntityKeyType< 'postType', 'wp_template' > is a string

type EntityRecordLookup< C extends Context = any > = {
	root: {
		site: Settings< C >;
		postType: Type< C >;
		media: Attachment< C >;
		taxonomy: Taxonomy< C >;
		sidebar: Sidebar< C >;
		widget: Widget< C >;
		widgetType: WidgetType< C >;
		user: User< C >;
		comment: Comment< C >;
		menu: NavMenu< C >;
		menuItem: NavMenuItem< C >;
		menuLocation: MenuLocation< C >;
		navigationArea: NavigationArea< C >;
		theme: Theme< C >;
		plugin: Plugin< C >;
	};
	/**
	 * The entities of kind postType are loaded dynamically and can't be inferred from
	 * the defaultEntities constant. The expected ones are defined using a hardcoded
	 * definitions instead.
	 */
	postType: {
		post: Post< C >;
		page: Page< C >;
		wp_template: WpTemplate< C >;
		wp_template_part: WpTemplatePart< C >;
	};
};

export type EntityRecordByKindName<
	K extends Kind,
	N extends Name< K >,
	C extends Context = DefaultEntityContext< K, N >
> = K extends keyof EntityRecordLookup< C >
	? N extends keyof EntityRecordLookup< C >[ K ]
		? EntityRecordLookup< C >[ K ][ N ]
		: unknown
	: unknown;

// EntityRecordByKindName< 'root', 'site' > is Settings<'view'>
// EntityRecordByKindName< 'root', 'plugin' > is Plugin<'edit'>
// EntityRecordByKindName< 'postType', 'wp_template' > is WpTemplate<'edit'>

export type UpdatableEntityRecordByKindName<
	K extends Kind,
	N extends Name< K >
> = EntityRecordByKindName< K, N, 'edit' > extends EntityRecord< 'edit' >
	? EntityRecordByKindName< K, N, 'edit' >
	: unknown;

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
