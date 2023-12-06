/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { EntityProvider, useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockContextProvider,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
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

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );

const noop = () => {};

/**
 * For the Navigation block editor, we need to force the block editor to contentOnly for that block.
 *
 * Set block editing mode to contentOnly when entering Navigation focus mode.
 * this ensures that non-content controls on the block will be hidden and thus
 * the user can focus on editing the Navigation Menu content only.
 *
 * @param {string} navigationBlockClientId ClientId.
 */
function useForceFocusModeForNavigation( navigationBlockClientId ) {
	const { setBlockEditingMode, unsetBlockEditingMode } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		if ( ! navigationBlockClientId ) {
			return;
		}

		setBlockEditingMode( navigationBlockClientId, 'contentOnly' );

		return () => {
			unsetBlockEditingMode( navigationBlockClientId );
		};
	}, [
		navigationBlockClientId,
		unsetBlockEditingMode,
		setBlockEditingMode,
	] );
}

/**
 * Depending on the post, template and template mode,
 * returns the appropriate blocks and change handlers for the block editor provider.
 *
 * @param {Array}   post     Block list.
 * @param {boolean} template Whether the page content has focus (and the surrounding template is inert). If `true` return page content blocks. Default `false`.
 * @param {string}  mode     Rendering mode.
 * @return {Array} Block editor props.
 */
function useBlockEditorProps( post, template, mode ) {
	const rootLevelPost =
		mode === 'post-only' || ! template ? 'post' : 'template';
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
	const navigationBlockClientId =
		post.type === 'wp_navigation' && blocks && blocks[ 0 ]?.clientId;
	useForceFocusModeForNavigation( navigationBlockClientId );
	if ( disableRootLevelChanges ) {
		return [ blocks, noop, noop ];
	}

	return [
		blocks,
		rootLevelPost === 'post' ? onInput : onInputTemplate,
		rootLevelPost === 'post' ? onChange : onChangeTemplate,
	];
}

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
		const mode = useSelect(
			( select ) => select( editorStore ).getRenderingMode(),
			[]
		);
		const shouldRenderTemplate = !! template && mode !== 'post-only';
		const rootLevelPost = shouldRenderTemplate ? template : post;
		const defaultBlockContext = useMemo( () => {
			const postContext =
				rootLevelPost.type !== 'wp_template' ||
				( shouldRenderTemplate && mode !== 'template-only' )
					? { postId: post.id, postType: post.type }
					: {};

			return {
				...postContext,
				templateSlug:
					rootLevelPost.type === 'wp_template'
						? rootLevelPost.slug
						: undefined,
			};
		}, [
			mode,
			post.id,
			post.type,
			rootLevelPost.type,
			rootLevelPost?.slug,
			shouldRenderTemplate,
		] );
		const { editorSettings, selection, isReady } = useSelect(
			( select ) => {
				const {
					getEditorSettings,
					getEditorSelection,
					__unstableIsEditorReady,
				} = select( editorStore );
				return {
					editorSettings: getEditorSettings(),
					isReady: __unstableIsEditorReady(),
					selection: getEditorSelection(),
				};
			},
			[]
		);
		const { id, type } = rootLevelPost;
		const blockEditorSettings = useBlockEditorSettings(
			editorSettings,
			type,
			id
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
			__experimentalTearDownEditor,
			setCurrentTemplateId,
		} = unlock( useDispatch( editorStore ) );
		const { createWarningNotice } = useDispatch( noticesStore );

		// Initialize and tear down the editor.
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

			return () => {
				__experimentalTearDownEditor();
			};
		}, [] );

		// Synchronize the editor settings as they change.
		useEffect( () => {
			updateEditorSettings( settings );
		}, [ settings, updateEditorSettings ] );

		useEffect( () => {
			setCurrentTemplateId( template?.id );
		}, [ template?.id, setCurrentTemplateId ] );

		if ( ! isReady ) {
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
							<PatternsMenuItems />
							{ mode === 'template-locked' && (
								<DisableNonPageContentBlocks />
							) }
						</BlockEditorProviderComponent>
					</BlockContextProvider>
				</EntityProvider>
			</EntityProvider>
		);
	}
);

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
