/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	EntityProvider,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockContextProvider,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { store as editorStore } from '../../store';
import useBlockEditorSettings from './use-block-editor-settings';
import { unlock } from '../../lock-unlock';
import DisableNonPageContentBlocks from './disable-non-page-content-blocks';
import NavigationBlockEditingMode from './navigation-block-editing-mode';
import { useHideBlocksFromInserter } from './use-hide-blocks-from-inserter';
import useCommands from '../commands';
import BlockRemovalWarnings from '../block-removal-warnings';
import StartPageOptions from '../start-page-options';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';
import ContentOnlySettingsMenu from '../block-settings-menu/content-only-settings-menu';
import StartTemplateOptions from '../start-template-options';
import EditorKeyboardShortcuts from '../global-keyboard-shortcuts';
import PatternRenameModal from '../pattern-rename-modal';
import PatternDuplicateModal from '../pattern-duplicate-modal';
import TemplatePartMenuItems from '../template-part-menu-items';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );

const noop = () => {};

/**
 * These are global entities that are only there to split blocks into logical units
 * They don't provide a "context" for the current post/page being rendered.
 * So we should not use their ids as post context. This is important to allow post blocks
 * (post content, post title) to be used within them without issues.
 */
const NON_CONTEXTUAL_POST_TYPES = [
	'wp_block',
	'wp_navigation',
	'wp_template_part',
];

/**
 * Depending on the post, template and template mode,
 * returns the appropriate blocks and change handlers for the block editor provider.
 *
 * @param {Array}   post     Block list.
 * @param {boolean} template Whether the page content has focus (and the surrounding template is inert). If `true` return page content blocks. Default `false`.
 * @param {string}  mode     Rendering mode.
 *
 * @example
 * ```jsx
 * const [ blocks, onInput, onChange ] = useBlockEditorProps( post, template, mode );
 * ```
 *
 * @return {Array} Block editor props.
 */
function useBlockEditorProps( post, template, mode ) {
	const rootLevelPost = mode === 'template-locked' ? 'template' : 'post';
	const [ postBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		post.type,
		{ id: post.id }
	);
	const [ templateBlocks, onInputTemplate, onChangeTemplate ] =
		useEntityBlockEditor( 'postType', template?.type, {
			id: template?.id,
		} );
	const maybeNavigationBlocks = useMemo( () => {
		if ( post.type === 'wp_navigation' ) {
			return [
				createBlock( 'core/navigation', {
					ref: post.id,
					// As the parent editor is locked with `templateLock`, the template locking
					// must be explicitly "unset" on the block itself to allow the user to modify
					// the block's content.
					templateLock: false,
				} ),
			];
		}
	}, [ post.type, post.id ] );

	// It is important that we don't create a new instance of blocks on every change
	// We should only create a new instance if the blocks them selves change, not a dependency of them.
	const blocks = useMemo( () => {
		if ( maybeNavigationBlocks ) {
			return maybeNavigationBlocks;
		}

		if ( rootLevelPost === 'template' ) {
			return templateBlocks;
		}

		return postBlocks;
	}, [ maybeNavigationBlocks, rootLevelPost, templateBlocks, postBlocks ] );

	// Handle fallback to postBlocks outside of the above useMemo, to ensure
	// that constructed block templates that call `createBlock` are not generated
	// too frequently. This ensures that clientIds are stable.
	const disableRootLevelChanges =
		( !! template && mode === 'template-locked' ) ||
		post.type === 'wp_navigation';
	if ( disableRootLevelChanges ) {
		return [ blocks, noop, noop ];
	}

	return [
		blocks,
		rootLevelPost === 'post' ? onInput : onInputTemplate,
		rootLevelPost === 'post' ? onChange : onChangeTemplate,
	];
}

/**
 * This component provides the editor context and manages the state of the block editor.
 *
 * @param {Object}  props                                The component props.
 * @param {Object}  props.post                           The post object.
 * @param {Object}  props.settings                       The editor settings.
 * @param {boolean} props.recovery                       Indicates if the editor is in recovery mode.
 * @param {Array}   props.initialEdits                   The initial edits for the editor.
 * @param {Object}  props.children                       The child components.
 * @param {Object}  [props.BlockEditorProviderComponent] The block editor provider component to use. Defaults to ExperimentalBlockEditorProvider.
 * @param {Object}  [props.__unstableTemplate]           The template object.
 *
 * @example
 * ```jsx
 * <ExperimentalEditorProvider
 *   post={ post }
 *   settings={ settings }
 *   recovery={ recovery }
 *   initialEdits={ initialEdits }
 *   __unstableTemplate={ template }
 * >
 *   { children }
 * </ExperimentalEditorProvider>
 *
 * @return {Object} The rendered ExperimentalEditorProvider component.
 */
export const ExperimentalEditorProvider = withRegistryProvider(
	( {
		post,
		settings,
		recovery,
		initialEdits,
		children,
		BlockEditorProviderComponent = ExperimentalBlockEditorProvider,
		__unstableTemplate: template,
	} ) => {
		const hasTemplate = !! template;
		const {
			editorSettings,
			selection,
			isReady,
			mode,
			defaultMode,
			postTypeEntities,
			hasLoadedPostObject,
		} = useSelect(
			( select ) => {
				const {
					getEditorSettings,
					getEditorSelection,
					getRenderingMode,
					__unstableIsEditorReady,
				} = select( editorStore );
				const { getEntitiesConfig } = select( coreStore );

				const postTypeObject = select( coreStore ).getPostType(
					post.type
				);

				const _hasLoadedPostObject = select(
					coreStore
				).hasFinishedResolution( 'getPostType', [ post.type ] );

				return {
					hasLoadedPostObject: _hasLoadedPostObject,
					editorSettings: getEditorSettings(),
					isReady: __unstableIsEditorReady(),
					mode: getRenderingMode(),
					defaultMode:
						hasTemplate && postTypeObject?.default_rendering_mode
							? postTypeObject?.default_rendering_mode
							: 'post-only',
					selection: getEditorSelection(),
					postTypeEntities:
						post.type === 'wp_template'
							? getEntitiesConfig( 'postType' )
							: null,
				};
			},
			[ post.type, hasTemplate ]
		);

		const shouldRenderTemplate = !! template && mode !== 'post-only';
		const rootLevelPost = shouldRenderTemplate ? template : post;
		const defaultBlockContext = useMemo( () => {
			const postContext = {};
			// If it is a template, try to inherit the post type from the name.
			if ( post.type === 'wp_template' ) {
				if ( post.slug === 'page' ) {
					postContext.postType = 'page';
				} else if ( post.slug === 'single' ) {
					postContext.postType = 'post';
				} else if ( post.slug.split( '-' )[ 0 ] === 'single' ) {
					// If the slug is single-{postType}, infer the post type from the name.
					const postTypeNames =
						postTypeEntities?.map( ( entity ) => entity.name ) ||
						[];
					const match = post.slug.match(
						`^single-(${ postTypeNames.join( '|' ) })(?:-.+)?$`
					);
					if ( match ) {
						postContext.postType = match[ 1 ];
					}
				}
			} else if (
				! NON_CONTEXTUAL_POST_TYPES.includes( rootLevelPost.type ) ||
				shouldRenderTemplate
			) {
				postContext.postId = post.id;
				postContext.postType = post.type;
			}

			return {
				...postContext,
				templateSlug:
					rootLevelPost.type === 'wp_template'
						? rootLevelPost.slug
						: undefined,
			};
		}, [
			shouldRenderTemplate,
			post.id,
			post.type,
			post.slug,
			rootLevelPost.type,
			rootLevelPost.slug,
			postTypeEntities,
		] );
		const { id, type } = rootLevelPost;
		const blockEditorSettings = useBlockEditorSettings(
			editorSettings,
			type,
			id,
			mode
		);
		const [ blocks, onInput, onChange ] = useBlockEditorProps(
			post,
			template,
			mode
		);

		const {
			updatePostLock,
			setupEditor,
			updateEditorSettings,
			setCurrentTemplateId,
			setEditedPost,
			setRenderingMode,
		} = unlock( useDispatch( editorStore ) );
		const { createWarningNotice } = useDispatch( noticesStore );

		// Ideally this should be synced on each change and not just something you do once.
		useLayoutEffect( () => {
			// Assume that we don't need to initialize in the case of an error recovery.
			if ( recovery ) {
				return;
			}

			updatePostLock( settings.postLock );
			setupEditor( post, initialEdits, settings.template );
			if ( settings.autosave ) {
				createWarningNotice(
					__(
						'There is an autosave of this post that is more recent than the version below.'
					),
					{
						id: 'autosave-exists',
						actions: [
							{
								label: __( 'View the autosave' ),
								url: settings.autosave.editLink,
							},
						],
					}
				);
			}

			// The dependencies of the hook are omitted deliberately
			// We only want to run setupEditor (with initialEdits) only once per post.
			// A better solution in the future would be to split this effect into multiple ones.
		}, [] );

		// Synchronizes the active post with the state
		useEffect( () => {
			setEditedPost( post.type, post.id );
		}, [ post.type, post.id, setEditedPost ] );

		// Synchronize the editor settings as they change.
		useEffect( () => {
			updateEditorSettings( settings );
		}, [ settings, updateEditorSettings ] );

		// Synchronizes the active template with the state.
		useEffect( () => {
			setCurrentTemplateId( template?.id );
		}, [ template?.id, setCurrentTemplateId ] );

		// Sets the right rendering mode when loading the editor.
		useEffect( () => {
			setRenderingMode( defaultMode );
		}, [ defaultMode, setRenderingMode ] );

		useHideBlocksFromInserter( post.type, mode );

		// Register the editor commands.
		useCommands();

		if ( ! isReady || ! mode || ! hasLoadedPostObject ) {
			return null;
		}

		return (
			<EntityProvider kind="root" type="site">
				<EntityProvider
					kind="postType"
					type={ post.type }
					id={ post.id }
				>
					<BlockContextProvider value={ defaultBlockContext }>
						<BlockEditorProviderComponent
							value={ blocks }
							onChange={ onChange }
							onInput={ onInput }
							selection={ selection }
							settings={ blockEditorSettings }
							useSubRegistry={ false }
						>
							{ children }
							{ ! settings.isPreviewMode && (
								<>
									<PatternsMenuItems />
									<TemplatePartMenuItems />
									<ContentOnlySettingsMenu />
									{ mode === 'template-locked' && (
										<DisableNonPageContentBlocks />
									) }
									{ type === 'wp_navigation' && (
										<NavigationBlockEditingMode />
									) }
									<EditorKeyboardShortcuts />
									<KeyboardShortcutHelpModal />
									<BlockRemovalWarnings />
									<StartPageOptions />
									<StartTemplateOptions />
									<PatternRenameModal />
									<PatternDuplicateModal />
								</>
							) }
						</BlockEditorProviderComponent>
					</BlockContextProvider>
				</EntityProvider>
			</EntityProvider>
		);
	}
);

/**
 * This component establishes a new post editing context, and serves as the entry point for a new post editor (or post with template editor).
 *
 * It supports a large number of post types, including post, page, templates,
 * custom post types, patterns, template parts.
 *
 * All modification and changes are performed to the `@wordpress/core-data` store.
 *
 * @param {Object}  props                      The component props.
 * @param {Object}  [props.post]               The post object to edit. This is required.
 * @param {Object}  [props.__unstableTemplate] The template object wrapper the edited post.
 *                                             This is optional and can only be used when the post type supports templates (like posts and pages).
 * @param {Object}  [props.settings]           The settings object to use for the editor.
 *                                             This is optional and can be used to override the default settings.
 * @param {Element} [props.children]           Children elements for which the BlockEditorProvider context should apply.
 *                                             This is optional.
 *
 * @example
 * ```jsx
 * <EditorProvider
 *   post={ post }
 *   settings={ settings }
 *   __unstableTemplate={ template }
 * >
 *   { children }
 * </EditorProvider>
 * ```
 *
 * @return {React.ReactNode} The rendered EditorProvider component.
 */
export function EditorProvider( props ) {
	return (
		<ExperimentalEditorProvider
			{ ...props }
			BlockEditorProviderComponent={ BlockEditorProvider }
		>
			{ props.children }
		</ExperimentalEditorProvider>
	);
}

export default EditorProvider;
