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
} from '@wordpress/block-editor';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { store as editorStore } from '../../store';
import useBlockEditorSettings from './use-block-editor-settings';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

export const ExperimentalEditorProvider = withRegistryProvider(
	( {
		__unstableTemplate,
		post,
		settings,
		recovery,
		initialEdits,
		children,
		BlockEditorProviderComponent = ExperimentalBlockEditorProvider,
	} ) => {
		const defaultBlockContext = useMemo( () => {
			if ( post.type === 'wp_template' ) {
				return {};
			}
			return { postId: post.id, postType: post.type };
		}, [ post.id, post.type ] );
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
		const { id, type } = __unstableTemplate ?? post;
		const [ blocks, onInput, onChange ] = useEntityBlockEditor(
			'postType',
			type,
			{ id }
		);
		const blockEditorSettings = useBlockEditorSettings(
			editorSettings,
			!! __unstableTemplate
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
		}, [ settings ] );

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
							<ReusableBlocksMenuItems />
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
