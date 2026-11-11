import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
} from '@wordpress/element';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import {
	EntityProvider,
	useEntityBlockEditor,
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockContextProvider,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';
import { createBlock } from '@wordpress/blocks';
import withRegistryProvider from './with-registry-provider';
import { store as editorStore } from '../../store';
import useAutosaveNotice from './use-autosave-notice';
import useBlockEditorSettings from './use-block-editor-settings';
import { unlock } from '../../lock-unlock';
import DisableNonPageContentBlocks from './disable-non-page-content-blocks';
import NavigationBlockEditingMode from './navigation-block-editing-mode';
import { useHideBlocksFromInserter } from './use-hide-blocks-from-inserter';
import { useRevisionBlocks } from './use-revision-blocks';
import useCommands from '../commands';
import useUploadSaveLock from './use-upload-save-lock';
import useNetworkReconnect from './use-network-reconnect';
import { getStartingRenderingMode, getTemplateAround } from './template-around';
import BlockRemovalWarnings from '../block-removal-warnings';
import StartPageOptions from '../start-page-options';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';
import StartTemplateOptions from '../start-template-options';
import EditorKeyboardShortcuts from '../global-keyboard-shortcuts';
import EditorKeyboardShortcutsRegister from '../global-keyboard-shortcuts/register-shortcuts';
import PatternRenameModal from '../pattern-rename-modal';
import PatternDuplicateModal from '../pattern-duplicate-modal';
import TemplatePartMenuItems from '../template-part-menu-items';
import MediaEditorModalMount from '../media/media-editor-modal';
import { getCanvasWidthByDeviceType } from '../../utils/device-type';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );
const { PrivateEntityProvider } = unlock( coreDataPrivateApis );

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
 * The blocks that hold what is being edited when a template is rendered inside
 * another one.
 *
 * The slot is the template slot block of the template around it, and the server
 * substitutes that block alone. A post title or a featured image in the
 * template around it belongs to that template, which is edited on its own
 * screen, so neither is content to edit here.
 */
const TEMPLATE_SLOT_BLOCK_TYPES = [ 'core/template-slot' ];

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
	const revisionBlocks = useRevisionBlocks();
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

	// In revisions mode, use the revision blocks and disable editing.
	if ( revisionBlocks !== null ) {
		return [ revisionBlocks, noop, noop ];
	}

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
 * Returns the template the template of a post is rendered inside, if any.
 *
 * With the templates inside templates experiment a template can name another
 * template to be rendered inside, in that one's template slot block, so the
 * front end renders a post inside its template and that template inside the
 * one it names. The canvas renders the same when it shows the template.
 *
 * @param {Object}  post     The post being edited.
 * @param {?Object} template The template of the post.
 * @return {?Object|undefined} The template, `null` when there is none, or `undefined` while it resolves.
 */
function useTemplateAroundTemplate( post, template ) {
	return useSelect(
		( select ) => {
			// A template rendered inside another is the template being
			// edited, which the host already names the other one for.
			if (
				! template ||
				post.type === 'wp_template' ||
				template.type !== 'wp_template'
			) {
				return null;
			}

			const outerTemplateId = unlock( select( coreStore ) ).getTemplateId(
				'wp_template',
				template.id
			);
			if ( ! outerTemplateId ) {
				return outerTemplateId;
			}

			return (
				select( coreStore ).getEditedEntityRecord(
					'postType',
					'wp_template',
					outerTemplateId
				) || undefined
			);
		},
		[ post.type, template ]
	);
}

/**
 * This component provides the editor context and manages the state of the block editor.
 *
 * @param {Object}  props                                The component props.
 * @param {Object}  props.post                           The post object.
 * @param {Object}  props.settings                       The editor settings.
 * @param {boolean} props.recovery                       Indicates if the editor is in recovery mode.
 * @param {Array}   props.initialEdits                   The initial edits for the editor.
 * @param {string}  [props.initialViewport]              The device type an entity opens at, one of those `setDeviceType` accepts. Each entity opens at the width it names, so a width set from the device preview is view state that does not follow the user into the next one. The current width is left alone when omitted.
 * @param {string}  [props.renderingMode]                The rendering mode this editor stays in, one of `post-only` or `template-locked`. Unlike the `defaultRenderingMode` editor setting, which is a starting point the user's saved "Show template" preference overrides, this is what the editor is for: it wins over that preference, and the controls that switch modes are not offered. Use it where only one mode makes sense, such as the site editor screens that show the whole site. The mode is resolved normally when omitted.
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
		initialViewport,
		renderingMode,
		children,
		BlockEditorProviderComponent = ExperimentalBlockEditorProvider,
		__unstableTemplate: _template,
	} ) => {
		const template = getTemplateAround( post, _template );
		const standsForOwnTemplate = !! _template && ! template;
		const hasTemplate = !! template;
		const outerTemplate = useTemplateAroundTemplate( post, template );
		// The template the canvas renders at its root when it shows the
		// template: the one the post's template is rendered inside, if any.
		const canvasTemplate = outerTemplate || template;
		const hasResolvedCanvasTemplate =
			hasTemplate && outerTemplate !== undefined;
		const {
			editorSettings,
			selection,
			isReady,
			mode,
			defaultMode,
			postTypeEntities,
			isInRevisionsMode,
			currentRevisionId,
			browserBackup,
		} = useSelect(
			( select ) => {
				const {
					getEditorSettings,
					getRenderingMode,
					__unstableIsEditorReady,
					getDefaultRenderingMode,
					isRevisionsMode: _isRevisionsMode,
					getCurrentRevisionId: _getCurrentRevisionId,
					getBrowserBackup: _getBrowserBackup,
				} = unlock( select( editorStore ) );
				const { getEntitiesConfig, getEntityRecordEdits } =
					select( coreStore );

				const _mode = getRenderingMode();
				// A caller that names the mode is stating what this context
				// is for, so it wins over the post type default and the
				// user's saved preference.
				//
				// A canvas that stands for the template it is editing has
				// nothing to render around it, so the mode that renders a
				// post inside its template has nothing to show: the template
				// is edited on its own however the preference for the post
				// type reads, and the mode is settled rather than pending.
				const _defaultMode = getStartingRenderingMode( {
					renderingMode,
					standsForOwnTemplate,
					getPostTypeDefaultMode: () =>
						getDefaultRenderingMode( post.type ),
				} );
				/**
				 * To avoid content "flash", wait until rendering mode has been resolved.
				 * This is important for the initial render of the editor.
				 *
				 * - Wait for template to be resolved if the default mode is 'template-locked'.
				 * - Wait for default mode to be resolved otherwise.
				 */
				const hasResolvedDefaultMode =
					_defaultMode === 'template-locked'
						? hasResolvedCanvasTemplate
						: _defaultMode !== undefined;
				// Wait until the default mode is retrieved and start rendering canvas.
				const isRenderingModeReady = _defaultMode !== undefined;

				// Read selection directly from entity edits using the post prop,
				// bypassing getCurrentPostId() which lags behind in useEffect.
				const entityEdits = getEntityRecordEdits(
					'postType',
					post.type,
					post.id
				);

				return {
					editorSettings: getEditorSettings(),
					isReady: __unstableIsEditorReady(),
					mode: isRenderingModeReady ? _mode : undefined,
					defaultMode: hasResolvedDefaultMode
						? _defaultMode
						: undefined,
					selection: entityEdits?.selection,
					postTypeEntities:
						post.type === 'wp_template'
							? getEntitiesConfig( 'postType' )
							: null,
					isInRevisionsMode: _isRevisionsMode(),
					currentRevisionId: _getCurrentRevisionId(),
					browserBackup: _getBrowserBackup(),
				};
			},
			[
				post.type,
				post.id,
				hasResolvedCanvasTemplate,
				standsForOwnTemplate,
				renderingMode,
			]
		);

		const shouldRenderTemplate = hasTemplate && mode !== 'post-only';
		const rootLevelPost = shouldRenderTemplate ? canvasTemplate : post;
		/*
		 * A template can name the template it is rendered inside, in which case
		 * the canvas shows that one around it and the template being edited is
		 * what its template slot block renders, the way a page is what the
		 * post content block of its template renders.
		 */
		const isTemplateInsideTemplate =
			shouldRenderTemplate &&
			post.type === 'wp_template' &&
			template.id !== post.id;
		/*
		 * The template of a post can name a template too, in which case the
		 * canvas shows that one at its root, the post's template in its slot,
		 * and the post in the content block of its template, as the front end
		 * renders it.
		 */
		const isPostTemplateInsideTemplate =
			shouldRenderTemplate && !! outerTemplate;
		const defaultBlockContext = useMemo( () => {
			const postContext = {};
			// If it is a template, try to inherit the post type from the name.
			// A template rendered inside another is given the same context, so
			// that the blocks of the template around it, such as a title block
			// in its header, stand for the post that template renders rather
			// than for the template; its template slot block is told which
			// template to render through `templateSlotId`.
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

			/*
			 * The template the blocks being edited belong to. For a template
			 * rendered inside another that is the template itself: the blocks
			 * in the slot are its own, and what they stand for — an archive, a
			 * category, an author — follows from its slug rather than from the
			 * slug of the template around them.
			 */
			let templateSlug;
			let templateSlotId;
			if ( isTemplateInsideTemplate ) {
				templateSlug = post.slug;
				templateSlotId = post.id;
			} else if ( isPostTemplateInsideTemplate ) {
				templateSlug = template.slug;
				templateSlotId = template.id;
			} else if ( rootLevelPost.type === 'wp_template' ) {
				templateSlug = rootLevelPost.slug;
			}

			return {
				...postContext,
				templateSlug,
				templateSlotId,
			};
		}, [
			isTemplateInsideTemplate,
			isPostTemplateInsideTemplate,
			template?.id,
			template?.slug,
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
			canvasTemplate,
			mode
		);

		/*
		 * Resolved here rather than by dispatching `setDeviceType`, which reads
		 * the theme's breakpoints from the block editor store — the store this
		 * provider is the one to fill, and has not yet when it mounts.
		 */
		const initialCanvasWidth = getCanvasWidthByDeviceType(
			initialViewport,
			blockEditorSettings.__experimentalFeatures?.viewport
		);

		const {
			updatePostLock,
			setupEditor,
			updateEditorSettings,
			setCurrentTemplateId,
			setEditedPost,
			setRenderingMode,
			setCanvasWidth,
		} = unlock( useDispatch( editorStore ) );
		const { editEntityRecord } = useDispatch( coreStore );
		const registry = useRegistry();

		const onChangeSelection = useCallback(
			( newSelection ) => {
				editEntityRecord(
					'postType',
					post.type,
					post.id,
					{ selection: newSelection },
					{ undoIgnore: true }
				);
			},
			[ editEntityRecord, post.type, post.id ]
		);

		// Ideally this should be synced on each change and not just something you do once.
		useLayoutEffect( () => {
			// Assume that we don't need to initialize in the case of an error recovery.
			if ( recovery ) {
				return;
			}

			updatePostLock( settings.postLock );
			// `setupEditor` may already have been dispatched by the
			// editor's pre-mount kickoff (see edit-post's
			// `initializeEditor`). Skip the redundant dispatch — it
			// would otherwise re-parse + reset blocks for new posts.
			if ( ! registry.select( editorStore ).__unstableIsEditorReady() ) {
				setupEditor( post, initialEdits, settings.template );
			}

			// The dependencies of the hook are omitted deliberately
			// We only want to run setupEditor (with initialEdits) only once per post.
			// A better solution in the future would be to split this effect into multiple ones.
		}, [] );

		// Manages the "more recent autosave" notice. Called after the mount
		// effect above so that its own mount effect runs once `setupEditor`
		// has populated the current post.
		useAutosaveNotice( { post, recovery, settings } );

		// Synchronizes the active post with the state
		useEffect( () => {
			setEditedPost( post.type, post.id );
			return () => setEditedPost( null, null );
		}, [ post.type, post.id, setEditedPost ] );

		// Opens the entity at the width it asks for. Keyed on the entity as well
		// as the width, so that moving to another one leaves a width set from
		// the device preview behind.
		useEffect( () => {
			if ( initialViewport ) {
				setCanvasWidth( initialCanvasWidth );
			}
		}, [
			post.type,
			post.id,
			initialViewport,
			initialCanvasWidth,
			setCanvasWidth,
		] );

		// Synchronize the editor settings as they change.
		// Do it as a layout effect so that rendered UI with outdated settings is not painted.
		useLayoutEffect( () => {
			// Settings merge, so pass the prop even when `undefined`. That clears the
			// mode when this editor stays mounted but loses the prop, as when going
			// from Home to Navigation: both show the front page in the same editor.
			updateEditorSettings( { ...settings, renderingMode } );

			return () => updateEditorSettings( { renderingMode: undefined } );
		}, [ settings, renderingMode, updateEditorSettings ] );

		// Synchronizes the active template with the state. Named from the prop
		// rather than the template to render around the post, so a canvas that
		// stands for a template still reports which one it is editing.
		useEffect( () => {
			setCurrentTemplateId( _template?.id );
		}, [ _template?.id, setCurrentTemplateId ] );

		// Sets the right rendering mode when loading the editor.
		useEffect( () => {
			if ( defaultMode ) {
				setRenderingMode( defaultMode );
			}
		}, [ defaultMode, setRenderingMode ] );

		useHideBlocksFromInserter( post.type, mode );

		// Register the editor commands.
		useCommands();

		// Lock post saving when media uploads are in progress (experimental feature).
		useUploadSaveLock();

		// Pause/resume media upload queue on network disconnect/reconnect.
		useNetworkReconnect();

		if ( ! isReady || ! mode ) {
			return null;
		}

		// Selections should not be synced when in revision or preview modes.
		const shouldSyncSelection =
			! isInRevisionsMode && ! settings.isPreviewMode;

		return (
			<EntityProvider kind="root" type="site">
				<PrivateEntityProvider
					kind="postType"
					type={ post.type }
					id={ post.id }
					revisionId={ currentRevisionId ?? undefined }
					revision={ browserBackup ?? undefined }
				>
					<BlockContextProvider value={ defaultBlockContext }>
						<BlockEditorProviderComponent
							value={ blocks }
							onChange={ onChange }
							onInput={ onInput }
							selection={
								shouldSyncSelection ? selection : undefined
							}
							onChangeSelection={
								shouldSyncSelection ? onChangeSelection : noop
							}
							settings={ blockEditorSettings }
							useSubRegistry={ false }
						>
							{ children }
							{ ! settings.isPreviewMode && (
								<>
									<PatternsMenuItems />
									<TemplatePartMenuItems />
									{ mode === 'template-locked' && (
										<DisableNonPageContentBlocks
											contentBlockTypes={
												isTemplateInsideTemplate
													? TEMPLATE_SLOT_BLOCK_TYPES
													: undefined
											}
											templatePartEditingMode={
												isTemplateInsideTemplate
													? 'disabled'
													: undefined
											}
										/>
									) }
									{ type === 'wp_navigation' && (
										<NavigationBlockEditingMode />
									) }
									<EditorKeyboardShortcutsRegister />
									<EditorKeyboardShortcuts />
									<KeyboardShortcutHelpModal />
									<BlockRemovalWarnings />
									<StartPageOptions />
									<StartTemplateOptions />
									<PatternRenameModal />
									<PatternDuplicateModal />
									<MediaEditorModalMount />
								</>
							) }
						</BlockEditorProviderComponent>
					</BlockContextProvider>
				</PrivateEntityProvider>
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
 * @param {Object}          props                      The component props.
 * @param {Object}          [props.post]               The post object to edit. This is required.
 * @param {Object}          [props.__unstableTemplate] The template object wrapper the edited post.
 *                                                     This is optional and can only be used when the post type supports templates (like posts and pages).
 * @param {Object}          [props.settings]           The settings object to use for the editor.
 *                                                     This is optional and can be used to override the default settings.
 * @param {React.ReactNode} [props.children]           Children elements for which the BlockEditorProvider context should apply.
 *                                                     This is optional.
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
