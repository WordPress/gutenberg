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
 * @param {Array}   post         Block list.
 * @param {boolean} template     Whether the page content has focus (and the surrounding template is inert). If `true` return page content blocks. Default `false`.
 * @param {boolean} templateMode Whether to wrap the page content blocks in a group block to mimic the post editor. Default `false`.
 * @return {Array} Block editor props.
 */
function useBlockEditorProps( post, template, templateMode ) {
	const rootLevelPost =
		!! template && templateMode !== 'hidden' ? template : post;
	const { type, id } = rootLevelPost;
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		type,
		{ id }
	);
	const actualBlocks = useMemo( () => {
		if ( type === 'wp_navigation' ) {
			return [
				createBlock( 'core/navigation', {
					ref: id,
					// As the parent editor is locked with `templateLock`, the template locking
					// must be explicitly "unset" on the block itself to allow the user to modify
					// the block's content.
					templateLock: false,
				} ),
			];
		}

		if ( !! template && templateMode === 'hidden' ) {
			return [
				createBlock(
					'core/group',
					{
						layout: { type: 'constrained' },
						style: {
							spacing: {
								margin: {
									top: '4em', // Mimics the post editor.
								},
							},
						},
					},
					[
						createBlock( 'core/post-title' ),
						createBlock( 'core/post-content' ),
					]
				),
			];
		}
	}, [ type, id, templateMode, template ] );
	const disableRootLevelChanges =
		( !! template && templateMode === 'disabled' ) ||
		type === 'wp_navigation';
	const navigationBlockClientId =
		type === 'wp_navigation' && actualBlocks && actualBlocks[ 0 ]?.clientId;
	useForceFocusModeForNavigation( navigationBlockClientId );

	return [
		actualBlocks ?? blocks,
		disableRootLevelChanges ? noop : onInput,
		disableRootLevelChanges ? noop : onChange,
	];
}

export const ExperimentalEditorProvider = withRegistryProvider(
	( {
		__unstableTemplate,
		templateMode = 'all',
		post,
		settings,
		recovery,
		initialEdits,
		children,
		BlockEditorProviderComponent = ExperimentalBlockEditorProvider,
	} ) => {
		const rootLevelPost =
			!! __unstableTemplate && templateMode !== 'hidden'
				? __unstableTemplate
				: post;
		const defaultBlockContext = useMemo( () => {
			const postContext =
				post.type !== 'wp_template'
					? { postId: post.id, postType: post.type }
					: {};

			return {
				...postContext,
				templateSlug:
					rootLevelPost.type === 'wp_template'
						? rootLevelPost.slug
						: undefined,
			};
		}, [ post.id, post.type, rootLevelPost.type, rootLevelPost?.slug ] );
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
			__unstableTemplate,
			templateMode
		);

		const {
			updatePostLock,
			setupEditor,
			updateEditorSettings,
			__experimentalTearDownEditor,
		} = useDispatch( editorStore );
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
