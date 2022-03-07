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
import type * as Records from './entity-types';
import type { Context } from './entity-types';
import type { EntityFromConfig, Kind, Name } from './entity-types/entities';

export const DEFAULT_ENTITY_KEY = 'id';

const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

export const attachment = {
	name: 'media',
	kind: 'root',
	baseURL: '/wp/v2/media',
	baseURLParams: { context: 'edit' },
	plural: 'mediaItems',
	label: __( 'Media' ),
} as const;

type AttachmentEntity< C extends Context > = EntityFromConfig<
	typeof attachment,
	Records.Attachment< C >
>;

export const site = {
	label: __( 'Site' ),
	name: 'site',
	kind: 'root',
	baseURL: '/wp/v2/settings',
	getTitle: ( record: Records.Settings< 'edit' > ) => {
		return get( record, [ 'title' ], __( 'Site Title' ) );
	},
} as const;

type SiteEntity< C extends Context > = EntityFromConfig<
	typeof site,
	Records.Settings< C >
>;

export const postType = {
	label: __( 'Post Type' ),
	name: 'postType',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/types',
	baseURLParams: { context: 'edit' },
	rawAttributes: POST_RAW_ATTRIBUTES,
} as const;

type TypeEntity< C extends Context > = EntityFromConfig<
	typeof postType,
	Records.Type< C >
>;

export const taxonomy = {
	name: 'taxonomy',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/taxonomies',
	baseURLParams: { context: 'edit' },
	plural: 'taxonomies',
	label: __( 'Taxonomy' ),
} as const;

type TaxonomyEntity< C extends Context > = EntityFromConfig<
	typeof taxonomy,
	Records.Taxonomy< C >
>;

export const sidebar = {
	name: 'sidebar',
	kind: 'root',
	baseURL: '/wp/v2/sidebars',
	plural: 'sidebars',
	transientEdits: { blocks: true },
	label: __( 'Widget areas' ),
} as const;

type SidebarEntity< C extends Context > = EntityFromConfig<
	typeof sidebar,
	Records.Sidebar< C >
>;

export const widget = {
	name: 'widget',
	kind: 'root',
	baseURL: '/wp/v2/widgets',
	baseURLParams: { context: 'edit' },
	plural: 'widgets',
	transientEdits: { blocks: true },
	label: __( 'Widgets' ),
} as const;

type WidgetEntity< C extends Context > = EntityFromConfig<
	typeof widget,
	Records.Widget< C >
>;

export const widgetType = {
	name: 'widgetType',
	kind: 'root',
	baseURL: '/wp/v2/widget-types',
	baseURLParams: { context: 'edit' },
	plural: 'widgetTypes',
	label: __( 'Widget types' ),
} as const;

type WidgetTypeEntity< C extends Context > = EntityFromConfig<
	typeof widgetType,
	Records.WidgetType< C >
>;

export const user = {
	label: __( 'User' ),
	name: 'user',
	kind: 'root',
	baseURL: '/wp/v2/users',
	baseURLParams: { context: 'edit' },
	plural: 'users',
} as const;

type UserEntity< C extends Context > = EntityFromConfig<
	typeof user,
	Records.User< C >
>;

export const comment = {
	name: 'comment',
	kind: 'root',
	baseURL: '/wp/v2/comments',
	baseURLParams: { context: 'edit' },
	plural: 'comments',
	label: __( 'Comment' ),
} as const;

type CommentEntity< C extends Context > = EntityFromConfig<
	typeof comment,
	Records.Comment< C >
>;

export const menu = {
	name: 'menu',
	kind: 'root',
	baseURL: '/wp/v2/menus',
	baseURLParams: { context: 'edit' },
	plural: 'menus',
	label: __( 'Menu' ),
} as const;

type NavMenuEntity< C extends Context > = EntityFromConfig<
	typeof menu,
	Records.NavMenu< C >
>;

export const menuItem = {
	name: 'menuItem',
	kind: 'root',
	baseURL: '/wp/v2/menu-items',
	baseURLParams: { context: 'edit' },
	plural: 'menuItems',
	label: __( 'Menu Item' ),
	rawAttributes: [ 'title', 'content' ],
} as const;

type NavMenuItemEntity< C extends Context > = EntityFromConfig<
	typeof menuItem,
	Records.NavMenu< C >
>;

export const menuLocation = {
	name: 'menuLocation',
	kind: 'root',
	baseURL: '/wp/v2/menu-locations',
	baseURLParams: { context: 'edit' },
	plural: 'menuLocations',
	label: __( 'Menu Location' ),
	key: 'name',
} as const;

type MenuLocationEntity< C extends Context > = EntityFromConfig<
	typeof menuLocation,
	Records.MenuLocation< C >
>;

export const navigationArea = {
	name: 'navigationArea',
	kind: 'root',
	baseURL: '/wp/v2/block-navigation-areas',
	baseURLParams: { context: 'edit' },
	plural: 'navigationAreas',
	label: __( 'Navigation Area' ),
	key: 'name',
	getTitle: ( record: Records.NavigationArea< 'edit' > | null ) =>
		record?.description,
} as const;

type NavigationAreaEntity< C extends Context > = EntityFromConfig<
	typeof navigationArea,
	Records.NavigationArea< C >
>;

export const globalStyle = {
	label: __( 'Global Styles' ),
	name: 'globalStyles',
	kind: 'root',
	baseURL: '/wp/v2/global-styles',
	baseURLParams: { context: 'edit' },
	plural: 'globalStylesVariations', // should be different than name
	getTitle: ( record: any ) => record?.title?.rendered || record?.title,
} as const;

export const theme = {
	label: __( 'Themes' ),
	name: 'theme',
	kind: 'root',
	baseURL: '/wp/v2/themes',
	baseURLParams: { context: 'edit' },
	key: 'stylesheet',
} as const;

type ThemeEntity< C extends Context > = EntityFromConfig<
	typeof theme,
	Records.Theme< C >
>;

export const plugin = {
	label: __( 'Plugins' ),
	name: 'plugin',
	kind: 'root',
	baseURL: '/wp/v2/plugins',
	baseURLParams: { context: 'edit' },
	key: 'plugin',
} as const;

type PluginEntity< C extends Context > = EntityFromConfig<
	typeof plugin,
	Records.Plugin< C >
>;

export const defaultEntities = [
	{
		label: __( 'Base' ),
		kind: 'root',
		name: '__unstableBase',
		baseURL: '/',
	},
	site,
	postType,
	attachment,
	taxonomy,
	sidebar,
	widget,
	widgetType,
	user,
	comment,
	menu,
	menuItem,
	menuLocation,
	globalStyle,
	theme,
	plugin,
];

type PostTypeConfig = {
	kind: 'postType';
	key: 'id';
	defaultContext: 'edit';
};

type Post< C extends Context > = PostTypeConfig & {
	name: 'post';
	recordType: Records.Post< C >;
};
type Page< C extends Context > = PostTypeConfig & {
	name: 'page';
	recordType: Records.Page< C >;
};
type WpTemplate< C extends Context > = PostTypeConfig & {
	name: 'wp_template';
	recordType: Records.WpTemplate< C >;
};
type WpTemplatePart< C extends Context > = PostTypeConfig & {
	name: 'wp_template_part';
	recordType: Records.WpTemplatePart< C >;
};

export type CoreEntity< C extends Context > =
	| SiteEntity< C >
	| TypeEntity< C >
	| AttachmentEntity< C >
	| TaxonomyEntity< C >
	| SidebarEntity< C >
	| WidgetEntity< C >
	| WidgetTypeEntity< C >
	| UserEntity< C >
	| CommentEntity< C >
	| NavMenuEntity< C >
	| NavMenuItemEntity< C >
	| NavigationAreaEntity< C >
	| MenuLocationEntity< C >
	| ThemeEntity< C >
	| PluginEntity< C >
	| Post< C >
	| Page< C >
	| WpTemplate< C >
	| WpTemplatePart< C >;

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
export const prePersistPostType = ( persistedRecord: any, edits: any ) => {
	const newEdits = {} as any;

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
	} ) ) as Record< string, Records.Type< 'view' > >;
	return map( postTypes, ( _postType, name ) => {
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			name
		);
		const namespace = _postType?.rest_namespace ?? 'wp/v2';
		return {
			kind: 'postType',
			baseURL: `/${ namespace }/${ _postType.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: _postType.name,
			transientEdits: {
				blocks: true,
				selection: true,
			},
			mergedEdits: { meta: true },
			rawAttributes: POST_RAW_ATTRIBUTES,
			getTitle: ( record: any ) =>
				record?.title?.rendered ||
				record?.title ||
				( isTemplate ? startCase( record.slug ) : String( record.id ) ),
			__unstablePrePersist: isTemplate ? undefined : prePersistPostType,
			__unstable_rest_base: _postType.rest_base,
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
	} ) ) as Array< Records.Taxonomy< 'view' > >;
	return map( taxonomies, ( _taxonomy, name ) => {
		const namespace = _taxonomy?.rest_namespace ?? 'wp/v2';
		return {
			kind: 'taxonomy',
			baseURL: `/${ namespace }/${ _taxonomy.rest_base }`,
			baseURLParams: { context: 'edit' },
			name,
			label: _taxonomy.name,
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
	kind: Kind,
	name: Name,
	prefix = 'get',
	usePlural = false
) => {
	const entity = find( defaultEntities, { kind, name } ) as any;
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix =
		upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix =
		usePlural && 'plural' in entity && entity?.plural
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
export const getKindEntities = ( kind: Kind ) => async ( {
	select,
	dispatch,
}: any ) => {
	let entities = select.getEntitiesByKind( kind );
	if ( entities && entities.length !== 0 ) {
		return entities;
	}

	const loader = find( additionalEntityConfigLoaders, { kind } );
	if ( ! loader ) {
		return [];
	}

	configs = await loader.loadEntities();
	dispatch( addEntities( configs ) );

	return configs;
};
