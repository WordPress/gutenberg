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
import type { EntityConfigTypeFromConst } from './entity-types/entities';

export const DEFAULT_ENTITY_KEY = 'id';

const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

const attachmentConfig = {
	name: 'media',
	kind: 'root',
	baseURL: '/wp/v2/media',
	baseURLParams: { context: 'edit' },
	plural: 'mediaItems',
	label: __( 'Media' ),
} as const;

type AttachmentConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof attachmentConfig,
	Records.Attachment< C >
>;

const siteConfig = {
	label: __( 'Site' ),
	name: 'site',
	kind: 'root',
	baseURL: '/wp/v2/settings',
	getTitle: ( record: Records.Settings< 'edit' > ) => {
		return get( record, [ 'title' ], __( 'Site Title' ) );
	},
} as const;

type SiteConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof siteConfig,
	Records.Settings< C >
>;

const postTypeConfig = {
	label: __( 'Post Type' ),
	name: 'postType',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/types',
	baseURLParams: { context: 'edit' },
	rawAttributes: POST_RAW_ATTRIBUTES,
} as const;

type TypeConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof postTypeConfig,
	Records.Type< C >
>;

const taxonomyConfig = {
	name: 'taxonomy',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/taxonomies',
	baseURLParams: { context: 'edit' },
	plural: 'taxonomies',
	label: __( 'Taxonomy' ),
} as const;

type TaxonomyConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof taxonomyConfig,
	Records.Taxonomy< C >
>;

const sidebarConfig = {
	name: 'sidebar',
	kind: 'root',
	baseURL: '/wp/v2/sidebars',
	plural: 'sidebars',
	transientEdits: { blocks: true },
	label: __( 'Widget areas' ),
} as const;

type SidebarConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof sidebarConfig,
	Records.Sidebar< C >
>;

const widgetConfig = {
	name: 'widget',
	kind: 'root',
	baseURL: '/wp/v2/widgets',
	baseURLParams: { context: 'edit' },
	plural: 'widgets',
	transientEdits: { blocks: true },
	label: __( 'Widgets' ),
} as const;

type WidgetConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof widgetConfig,
	Records.Widget< C >
>;

const widgetTypeConfig = {
	name: 'widgetType',
	kind: 'root',
	baseURL: '/wp/v2/widget-types',
	baseURLParams: { context: 'edit' },
	plural: 'widgetTypes',
	label: __( 'Widget types' ),
} as const;

type WidgetTypeConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof widgetTypeConfig,
	Records.WidgetType< C >
>;

const userConfig = {
	label: __( 'User' ),
	name: 'user',
	kind: 'root',
	baseURL: '/wp/v2/users',
	baseURLParams: { context: 'edit' },
	plural: 'users',
} as const;

type UserConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof userConfig,
	Records.User< C >
>;

const commentConfig = {
	name: 'comment',
	kind: 'root',
	baseURL: '/wp/v2/comments',
	baseURLParams: { context: 'edit' },
	plural: 'comments',
	label: __( 'Comment' ),
} as const;

type CommentConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof commentConfig,
	Records.Comment< C >
>;

const menuConfig = {
	name: 'menu',
	kind: 'root',
	baseURL: '/wp/v2/menus',
	baseURLParams: { context: 'edit' },
	plural: 'menus',
	label: __( 'Menu' ),
} as const;

type NavMenuConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof menuConfig,
	Records.NavMenu< C >
>;

const menuItemConfig = {
	name: 'menuItem',
	kind: 'root',
	baseURL: '/wp/v2/menu-items',
	baseURLParams: { context: 'edit' },
	plural: 'menuItems',
	label: __( 'Menu Item' ),
	rawAttributes: [ 'title', 'content' ],
} as const;

type NavMenuItemConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof menuItemConfig,
	Records.NavMenu< C >
>;

const menuLocationConfig = {
	name: 'menuLocation',
	kind: 'root',
	baseURL: '/wp/v2/menu-locations',
	baseURLParams: { context: 'edit' },
	plural: 'menuLocations',
	label: __( 'Menu Location' ),
	key: 'name',
} as const;

type MenuLocationConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof menuLocationConfig,
	Records.MenuLocation< C >
>;

const navigationAreaConfig = {
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

type NavigationAreaConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof navigationAreaConfig,
	Records.NavigationArea< C >
>;

const globalStyleConfig = {
	label: __( 'Global Styles' ),
	name: 'globalStyles',
	kind: 'root',
	baseURL: '/wp/v2/global-styles',
	baseURLParams: { context: 'edit' },
	plural: 'globalStylesVariations', // should be different than name
	getTitle: ( record: any ) => record?.title?.rendered || record?.title,
} as const;

const themeConfig = {
	label: __( 'Themes' ),
	name: 'theme',
	kind: 'root',
	baseURL: '/wp/v2/themes',
	baseURLParams: { context: 'edit' },
	key: 'stylesheet',
} as const;

type ThemeConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof themeConfig,
	Records.Theme< C >
>;

const pluginConfig = {
	label: __( 'Plugins' ),
	name: 'plugin',
	kind: 'root',
	baseURL: '/wp/v2/plugins',
	baseURLParams: { context: 'edit' },
	key: 'plugin',
} as const;

type PluginConfig< C extends Context > = EntityConfigTypeFromConst<
	typeof pluginConfig,
	Records.Plugin< C >
>;

const rootEntitiesConfig = [
	{
		label: __( 'Base' ),
		kind: 'root',
		name: '__unstableBase',
		baseURL: '/',
	},
	siteConfig,
	postTypeConfig,
	attachmentConfig,
	taxonomyConfig,
	sidebarConfig,
	widgetConfig,
	widgetTypeConfig,
	userConfig,
	commentConfig,
	menuConfig,
	menuItemConfig,
	menuLocationConfig,
	globalStyleConfig,
	themeConfig,
	pluginConfig,
];

type PostTypeConfig = {
	kind: 'postType';
	key: 'id';
	defaultContext: 'edit';
};

type PostConfig< C extends Context > = PostTypeConfig & {
	name: 'post';
	recordType: Records.Post< C >;
};
type PageConfig< C extends Context > = PostTypeConfig & {
	name: 'page';
	recordType: Records.Page< C >;
};
type WpTemplateConfig< C extends Context > = PostTypeConfig & {
	name: 'wp_template';
	recordType: Records.WpTemplate< C >;
};
type WpTemplatePartConfig< C extends Context > = PostTypeConfig & {
	name: 'wp_template_part';
	recordType: Records.WpTemplatePart< C >;
};

export type CoreEntityConfig< C extends Context > =
	| SiteConfig< C >
	| TypeConfig< C >
	| AttachmentConfig< C >
	| TaxonomyConfig< C >
	| SidebarConfig< C >
	| WidgetConfig< C >
	| WidgetTypeConfig< C >
	| UserConfig< C >
	| CommentConfig< C >
	| NavMenuConfig< C >
	| NavMenuItemConfig< C >
	| NavigationAreaConfig< C >
	| MenuLocationConfig< C >
	| ThemeConfig< C >
	| PluginConfig< C >
	| PostConfig< C >
	| PageConfig< C >
	| WpTemplateConfig< C >
	| WpTemplatePartConfig< C >;

const additionalEntityConfigLoaders = [
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
			getTitle: ( record ) =>
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
	kind,
	name,
	prefix = 'get',
	usePlural = false
) => {
	const entityConfig = find( rootEntitiesConfig, { kind, name } ) as any;
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix =
		upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix =
		usePlural && entityConfig.plural
			? upperFirst( camelCase( entityConfig.plural ) )
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
const getOrLoadEntitiesConfig = ( kind ) => async ( { select, dispatch } ) => {
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
