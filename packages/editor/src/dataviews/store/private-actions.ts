import { store as coreStore } from '@wordpress/core-data';
import type { Action, Field } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';
import type { PostType } from '@wordpress/fields';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function registerEntityAction< Item >(
	kind: string,
	name: string,
	config: Action< Item >
) {
	return {
		type: 'REGISTER_ENTITY_ACTION' as const,
		kind,
		name,
		config,
	};
}

export function unregisterEntityAction(
	kind: string,
	name: string,
	actionId: string
) {
	return {
		type: 'UNREGISTER_ENTITY_ACTION' as const,
		kind,
		name,
		actionId,
	};
}

/**
 * Receives the fields of an entity, as the `getEntityFields` resolver
 * resolves them from the server.
 *
 * @param kind   Entity kind.
 * @param name   Entity name.
 * @param fields The fields.
 * @return Action object.
 */
export function receiveEntityFields< Item >(
	kind: string,
	name: string,
	fields: Field< Item >[]
) {
	return {
		type: 'RECEIVE_ENTITY_FIELDS' as const,
		kind,
		name,
		fields,
	};
}

export function setIsReady( kind: string, name: string ) {
	return {
		type: 'SET_IS_READY' as const,
		kind,
		name,
	};
}

/**
 * Reads the actions of a settled import of a core actions script module.
 *
 * A module that failed to load is reported and yields no actions, so the
 * post type still gets the actions of the other modules.
 *
 * @param result   The settled import of the module, or of nothing when the
 *                 post type does not need the module.
 * @param postType The post type.
 * @return The actions of the module, keyed by action id.
 */
function getLoadedActions< Module extends { default: object } >(
	result: PromiseSettledResult< Module | undefined >,
	postType: string
): Partial< Module[ 'default' ] > {
	if ( result.status === 'rejected' ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Could not load the core actions of the ${ postType } post type.`,
			result.reason
		);
		return {};
	}
	return result.value?.default ?? {};
}

/**
 * Imports the script modules of the core actions a post type may get: the
 * default actions, and the actions of patterns and template parts.
 *
 * The literal `import()`s keep the modules as dependencies of the editor
 * script, and their types check the action ids the schema reads below.
 *
 * @param postType The post type.
 * @return The actions of each module, keyed by action id.
 */
async function importCoreActionModules( postType: string ) {
	const [ postTypeSupports, wpBlock, wpTemplatePart ] =
		await Promise.allSettled( [
			import( '@wordpress/core-actions/post_type_supports' ),
			postType === 'wp_block'
				? import( '@wordpress/core-actions/wp_block' )
				: undefined,
			postType === 'wp_template_part'
				? import( '@wordpress/core-actions/wp_template_part' )
				: undefined,
		] );
	return [
		getLoadedActions( postTypeSupports, postType ),
		getLoadedActions( wpBlock, postType ),
		getLoadedActions( wpTemplatePart, postType ),
	] as const;
}

export const registerPostTypeSchema =
	( postType: string ) =>
	async ( { registry }: { registry: any } ) => {
		const isReady = unlock( registry.select( editorStore ) ).isEntityReady(
			'postType',
			postType
		);
		if ( isReady ) {
			return;
		}

		unlock( registry.dispatch( editorStore ) ).setIsReady(
			'postType',
			postType
		);

		// Start importing the script modules of the core actions while the
		// post type, the permissions, and the theme resolve.
		const coreActionModules = importCoreActionModules( postType );

		const postTypeConfig = ( await registry
			.resolveSelect( coreStore )
			.getPostType( postType ) ) as PostType;

		const canCreate = await registry
			.resolveSelect( coreStore )
			.canUser( 'create', {
				kind: 'postType',
				name: postType,
			} );
		const currentTheme = await registry
			.resolveSelect( coreStore )
			.getCurrentTheme();

		const [
			postTypeSupportsActions,
			wpBlockActions,
			wpTemplatePartActions,
		] = await coreActionModules;
		const {
			'view-post': viewPost,
			'view-post-revisions': viewPostRevisions,
			'duplicate-post': duplicatePost,
			'rename-post': renamePost,
			'order-pages': reorderPage,
			restore: restorePost,
			'reset-post': resetPost,
			'delete-post': deletePost,
			'move-to-trash': trashPost,
			'permanently-delete': permanentlyDeletePost,
		} = postTypeSupportsActions;
		const {
			'duplicate-pattern': duplicatePattern,
			'export-pattern': exportPattern,
		} = wpBlockActions;
		const { 'duplicate-template-part': duplicateTemplatePart } =
			wpTemplatePartActions;

		let canDuplicate =
			! [ 'wp_block', 'wp_template_part', 'wp_template' ].includes(
				postTypeConfig.slug
			) &&
			canCreate &&
			duplicatePost;

		// @ts-expect-error `globalThis` has no index signature for this build-time global.
		if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
			// Outside Gutenberg, disable duplication.
			canDuplicate = undefined;
		}

		const actions = [
			postTypeConfig.viewable ? viewPost : undefined,
			!! postTypeConfig.supports?.revisions
				? viewPostRevisions
				: undefined,
			canDuplicate,
			postTypeConfig.slug === 'wp_template_part' &&
			canCreate &&
			currentTheme?.is_block_theme
				? duplicateTemplatePart
				: undefined,
			canCreate && postTypeConfig.slug === 'wp_block'
				? duplicatePattern
				: undefined,
			postTypeConfig.supports?.title ? renamePost : undefined,
			postTypeConfig.supports?.[ 'page-attributes' ]
				? reorderPage
				: undefined,
			postTypeConfig.slug === 'wp_block' ? exportPattern : undefined,
			restorePost,
			resetPost,
			deletePost,
			trashPost,
			permanentlyDeletePost,
		].filter( Boolean );

		registry.batch( () => {
			actions.forEach( ( action ) => {
				unlock( registry.dispatch( editorStore ) ).registerEntityAction(
					'postType',
					postType,
					action
				);
			} );
		} );

		doAction( 'core.registerPostTypeSchema', postType );
	};
