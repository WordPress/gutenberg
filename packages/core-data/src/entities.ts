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
		plural: 'globalStylesVariations', // should be different than name
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
	E = Element & {
		kind: K;
		name: N;
	}
> = 'baseURLParams' extends keyof E
	? 'context' extends keyof E[ 'baseURLParams' ]
		? E[ 'baseURLParams' ][ 'context' ]
		: 'view'
	: 'view';

type EntityKeyName<
	K extends string,
	N extends string,
	E = Element & {
		kind: K;
		name: N;
	}
> = 'key' extends keyof E ? E[ 'key' ] : 'id';

export type EntityTypeUnion< C extends Context = any > =
	| {
			kind: 'root';
			name: 'site';
			recordType: Settings< C >;
			keyType: never;
			defaultContext: DefaultEntityContext< 'root', 'site' >;
	  }
	| {
			kind: 'root';
			name: 'postType';
			recordType: Type< C >;
			keyType: Type< C >[ EntityKeyName< 'root', 'postType' > ];
			defaultContext: DefaultEntityContext< 'root', 'site' >;
	  }
	| {
			kind: 'root';
			name: 'media';
			recordType: Attachment< C >;
			keyType: Attachment< C >[ EntityKeyName< 'root', 'media' > ];
			defaultContext: DefaultEntityContext< 'root', 'media' >;
	  }
	| {
			kind: 'root';
			name: 'taxonomy';
			recordType: Taxonomy< C >;
			keyType: Taxonomy< C >[ EntityKeyName< 'root', 'taxonomy' > ];
			defaultContext: DefaultEntityContext< 'root', 'taxonomy' >;
	  }
	| {
			kind: 'root';
			name: 'sidebar';
			recordType: Sidebar< C >;
			keyType: Sidebar< C >[ EntityKeyName< 'root', 'sidebar' > ];
			defaultContext: DefaultEntityContext< 'root', 'sidebar' >;
	  }
	| {
			kind: 'root';
			name: 'widget';
			recordType: Widget< C >;
			keyType: Widget< C >[ EntityKeyName< 'root', 'widget' > ];
			defaultContext: DefaultEntityContext< 'root', 'widget' >;
	  }
	| {
			kind: 'root';
			name: 'widgetType';
			recordType: WidgetType< C >;
			keyType: WidgetType< C >[ EntityKeyName< 'root', 'widgetType' > ];
			defaultContext: DefaultEntityContext< 'root', 'widgetType' >;
	  }
	| {
			kind: 'root';
			name: 'user';
			recordType: User< C >;
			keyType: User< C >[ EntityKeyName< 'root', 'user' > ];
			defaultContext: DefaultEntityContext< 'root', 'user' >;
	  }
	| {
			kind: 'root';
			name: 'comment';
			recordType: Comment< C >;
			keyType: Attachment< C >[ EntityKeyName< 'root', 'comment' > ];
			defaultContext: DefaultEntityContext< 'root', 'comment' >;
	  }
	| {
			kind: 'root';
			name: 'menu';
			recordType: NavMenu< C >;
			keyType: NavMenu< C >[ EntityKeyName< 'root', 'menu' > ];
			defaultContext: DefaultEntityContext< 'root', 'menu' >;
	  }
	| {
			kind: 'root';
			name: 'menuItem';
			recordType: NavMenuItem< C >;
			keyType: NavMenuItem< C >[ EntityKeyName< 'root', 'menuItem' > ];
			defaultContext: DefaultEntityContext< 'root', 'menuItem' >;
	  }
	| {
			kind: 'root';
			name: 'menuLocation';
			recordType: MenuLocation< C >;
			keyType: MenuLocation< C >[ EntityKeyName<
				'root',
				'menuLocation'
			> ];
			defaultContext: DefaultEntityContext< 'root', 'menuLocation' >;
	  }
	| {
			kind: 'root';
			name: 'navigationArea';
			recordType: NavigationArea< C >;
			keyType: NavigationArea< C >[ EntityKeyName<
				'root',
				'navigationArea'
			> ];
			defaultContext: DefaultEntityContext< 'root', 'navigationArea' >;
	  }
	| {
			kind: 'root';
			name: 'theme';
			recordType: Theme< C >;
			keyType: Theme< C >[ EntityKeyName< 'root', 'theme' > ];
			defaultContext: DefaultEntityContext< 'root', 'theme' >;
	  }
	| {
			kind: 'root';
			name: 'plugin';
			recordType: Plugin< C >;
			keyType: Plugin< C >[ EntityKeyName< 'root', 'plugin' > ];
			defaultContext: DefaultEntityContext< 'root', 'plugin' >;
	  }
	| {
			kind: 'postType';
			name: 'post';
			recordType: Post< C >;
			keyType: Post< C >[ 'id' ];
			defaultContext: 'edit';
	  }
	| {
			kind: 'postType';
			name: 'page';
			recordType: Page< C >;
			keyType: Page< C >[ 'id' ];
			defaultContext: 'edit';
	  }
	| {
			kind: 'postType';
			name: 'wp_template';
			recordType: WpTemplate< C >;
			keyType: WpTemplate< C >[ 'id' ];
			defaultContext: 'edit';
	  }
	| {
			kind: 'postType';
			name: 'wp_template_part';
			recordType: WpTemplatePart< C >;
			keyType: WpTemplatePart< C >[ 'id' ];
			defaultContext: 'edit';
	  };

export type Kind = EntityTypeUnion[ 'kind' ];
export type Name< K extends Kind > = ( EntityTypeUnion & {
	kind: K;
} )[ 'name' ];

export type EntityType<
	K extends Kind,
	N extends Name< K >,
	C extends Context = any
> = EntityTypeUnion< C > & {
	kind: K;
	name: N;
};

export type Key< K extends Kind, N extends Name< K > > = EntityType<
	K,
	N
>[ 'keyType' ];

export type DefaultContext< K extends Kind, N extends Name< K > > = EntityType<
	K,
	N
>[ 'defaultContext' ];

export const kinds = [
	{ name: 'postType', loadEntities: loadPostTypeEntities },
	{ name: 'taxonomy', loadEntities: loadTaxonomyEntities },
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
	const entity = find( defaultEntities, { kind, name } );
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
export const getKindEntities = ( kind ) => async ( { select, dispatch } ) => {
	let entities = select.getEntitiesByKind( kind );
	if ( entities && entities.length !== 0 ) {
		return entities;
	}

	const kindConfig = find( kinds, { name: kind } );
	if ( ! kindConfig ) {
		return [];
	}

	entities = await kindConfig.loadEntities();
	dispatch( addEntities( entities ) );

	return entities;
};
