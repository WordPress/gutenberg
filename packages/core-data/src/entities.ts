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
import type {
	EntityType,
	Context,
	Post,
	Taxonomy,
	Type,
	Updatable,
} from './entity-types';

export const DEFAULT_ENTITY_KEY = 'id';

const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

type AttachmentEntity< C extends Context = Context > = EntityType<
	{
		name: 'media';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.Attachment< C >,
	C
>;

const attachmentConfig: AttachmentEntity[ 'config' ] = {
	name: 'media',
	kind: 'root',
	baseURL: '/wp/v2/media',
	baseURLParams: { context: 'edit' },
	plural: 'mediaItems',
	label: __( 'Media' ),
	rawAttributes: [ 'caption', 'title', 'description' ],
};

type SiteEntity< C extends Context = Context > = EntityType<
	{
		name: 'site';
		kind: 'root';
	},
	Records.Settings< C >,
	C
>;

const siteConfig: SiteEntity[ 'config' ] = {
	label: __( 'Site' ),
	name: 'site',
	kind: 'root',
	baseURL: '/wp/v2/settings',
	getTitle: ( record: Records.Settings< 'edit' > ) => {
		return get( record, [ 'title' ], __( 'Site Title' ) );
	},
};

type PostTypeEntity< C extends Context = Context > = EntityType<
	{
		name: 'postType';
		kind: 'root';
		key: 'slug';
		baseURLParams: { context: 'edit' };
	},
	Records.Type< C >,
	C
>;

const postTypeConfig: PostTypeEntity[ 'config' ] = {
	label: __( 'Post Type' ),
	name: 'postType',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/types',
	baseURLParams: { context: 'edit' },
};

type TaxonomyEntity< C extends Context = Context > = EntityType<
	{
		name: 'taxonomy';
		kind: 'root';
		key: 'slug';
		baseURLParams: { context: 'edit' };
	},
	Records.Taxonomy< C >,
	C
>;

const taxonomyConfig: TaxonomyEntity[ 'config' ] = {
	name: 'taxonomy',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/taxonomies',
	baseURLParams: { context: 'edit' },
	plural: 'taxonomies',
	label: __( 'Taxonomy' ),
};

type SidebarEntity< C extends Context = Context > = EntityType<
	{
		name: 'sidebar';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.Sidebar< C >,
	C
>;

const sidebarConfig: SidebarEntity[ 'config' ] = {
	name: 'sidebar',
	kind: 'root',
	baseURL: '/wp/v2/sidebars',
	baseURLParams: { context: 'edit' },
	plural: 'sidebars',
	transientEdits: { blocks: true },
	label: __( 'Widget areas' ),
};

type WidgetEntity< C extends Context = Context > = EntityType<
	{
		name: 'widget';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.Widget< C >,
	C
>;
const widgetConfig: WidgetEntity[ 'config' ] = {
	name: 'widget',
	kind: 'root',
	baseURL: '/wp/v2/widgets',
	baseURLParams: { context: 'edit' },
	plural: 'widgets',
	transientEdits: { blocks: true },
	label: __( 'Widgets' ),
};

type WidgetTypeEntity< C extends Context = Context > = EntityType<
	{
		name: 'widgetType';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.WidgetType< C >,
	C
>;
const widgetTypeConfig: WidgetTypeEntity[ 'config' ] = {
	name: 'widgetType',
	kind: 'root',
	baseURL: '/wp/v2/widget-types',
	baseURLParams: { context: 'edit' },
	plural: 'widgetTypes',
	label: __( 'Widget types' ),
};

type UserEntity< C extends Context = Context > = EntityType<
	{
		name: 'user';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.User< C >,
	C
>;
const userConfig: UserEntity[ 'config' ] = {
	label: __( 'User' ),
	name: 'user',
	kind: 'root',
	baseURL: '/wp/v2/users',
	baseURLParams: { context: 'edit' },
	plural: 'users',
};

type CommentEntity< C extends Context = Context > = EntityType<
	{
		name: 'comment';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.Comment< C >,
	C
>;
const commentConfig: CommentEntity[ 'config' ] = {
	name: 'comment',
	kind: 'root',
	baseURL: '/wp/v2/comments',
	baseURLParams: { context: 'edit' },
	plural: 'comments',
	label: __( 'Comment' ),
};

type NavMenuEntity< C extends Context = Context > = EntityType<
	{
		name: 'menu';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.NavMenu< C >,
	C
>;

const menuConfig: NavMenuEntity[ 'config' ] = {
	name: 'menu',
	kind: 'root',
	baseURL: '/wp/v2/menus',
	baseURLParams: { context: 'edit' },
	plural: 'menus',
	label: __( 'Menu' ),
};

type NavMenuItemEntity< C extends Context = Context > = EntityType<
	{
		name: 'menuItem';
		kind: 'root';
		baseURLParams: { context: 'edit' };
	},
	Records.NavMenuItem< C >,
	C
>;

const menuItemConfig: NavMenuItemEntity[ 'config' ] = {
	name: 'menuItem',
	kind: 'root',
	baseURL: '/wp/v2/menu-items',
	baseURLParams: { context: 'edit' },
	plural: 'menuItems',
	label: __( 'Menu Item' ),
	rawAttributes: [ 'title' ],
};

type MenuLocationEntity< C extends Context = Context > = EntityType<
	{
		name: 'menuLocation';
		kind: 'root';
		key: 'name';
		baseURLParams: { context: 'edit' };
	},
	Records.MenuLocation< C >,
	C
>;

const menuLocationConfig: MenuLocationEntity[ 'config' ] = {
	name: 'menuLocation',
	kind: 'root',
	baseURL: '/wp/v2/menu-locations',
	baseURLParams: { context: 'edit' },
	plural: 'menuLocations',
	label: __( 'Menu Location' ),
	key: 'name',
};

const globalStyleConfig = {
	label: __( 'Global Styles' ),
	name: 'globalStyles',
	kind: 'root',
	baseURL: '/wp/v2/global-styles',
	baseURLParams: { context: 'edit' },
	plural: 'globalStylesVariations', // Should be different than name.
	getTitle: ( record ) => record?.title?.rendered || record?.title,
};

type ThemeEntity< C extends Context = Context > = EntityType<
	{
		name: 'theme';
		kind: 'root';
		baseURLParams: { context: 'edit' };
		key: 'stylesheet';
	},
	Records.Theme< C >,
	C
>;

const themeConfig: ThemeEntity[ 'config' ] = {
	label: __( 'Themes' ),
	name: 'theme',
	kind: 'root',
	baseURL: '/wp/v2/themes',
	baseURLParams: { context: 'edit' },
	key: 'stylesheet',
};

type PluginEntity< C extends Context = Context > = EntityType<
	{
		name: 'plugin';
		kind: 'root';
		baseURLParams: { context: 'edit' };
		key: 'plugin';
	},
	Records.Plugin< C >,
	C
>;
const pluginConfig: PluginEntity[ 'config' ] = {
	label: __( 'Plugins' ),
	name: 'plugin',
	kind: 'root',
	baseURL: '/wp/v2/plugins',
	baseURLParams: { context: 'edit' },
	key: 'plugin',
};

export const rootEntitiesConfig = [
	{
		label: __( 'Base' ),
		kind: 'root',
		name: '__unstableBase',
		baseURL: '/',
		baseURLParams: {
			_fields: [
				'description',
				'gmt_offset',
				'home',
				'name',
				'site_icon',
				'site_icon_url',
				'site_logo',
				'timezone_string',
				'url',
			].join( ',' ),
		},
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

type PostEntity< C extends Context = Context > = EntityType<
	PostTypeConfig & { name: 'post' },
	Records.Post< C >,
	C
>;
type PageEntity< C extends Context > = EntityType<
	PostTypeConfig & { name: 'page' },
	Records.Page< C >,
	C
>;
type WpTemplateEntity< C extends Context > = EntityType<
	PostTypeConfig & { name: 'wp_template' },
	Records.WpTemplate< C >,
	C
>;
type WpTemplatePartEntity< C extends Context > = EntityType<
	PostTypeConfig & { name: 'wp_template_part' },
	Records.WpTemplatePart< C >,
	C
>;

export type CoreEntities< C extends Context > =
	| SiteEntity< C >
	| PostTypeEntity< C >
	| AttachmentEntity< C >
	| TaxonomyEntity< C >
	| SidebarEntity< C >
	| WidgetEntity< C >
	| WidgetTypeEntity< C >
	| UserEntity< C >
	| CommentEntity< C >
	| NavMenuEntity< C >
	| NavMenuItemEntity< C >
	| MenuLocationEntity< C >
	| ThemeEntity< C >
	| PluginEntity< C >
	| PostEntity< C >
	| PageEntity< C >
	| WpTemplateEntity< C >
	| WpTemplatePartEntity< C >;

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
	const newEdits = {} as Partial< Updatable< Post< 'edit' > > >;

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
	} ) ) as Record< string, Taxonomy< 'view' > >;
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
		usePlural && 'plural' in entityConfig && entityConfig?.plural
			? upperFirst( camelCase( entityConfig.plural ) )
			: nameSuffix;
	return `${ prefix }${ kindPrefix }${ suffix }`;
};

/**
 * Loads the kind entities into the store.
 *
 * @param {string} kind Kind
 *
 * @return {(thunkArgs: object) => Promise<Array>} Entities
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
