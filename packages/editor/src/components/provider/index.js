/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { EntityProvider } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockContextProvider,
} from '@wordpress/block-editor';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import ConvertToGroupButtons from '../convert-to-group-buttons';
import usePostContentEditor from './use-post-content-editor';
import { store as editorStore } from '../../store';
import useBlockEditorSettings from './use-block-editor-settings';

function EditorProvider( {
	__unstableTemplate,
	post,
	settings,
	recovery,
	initialEdits,
	children,
} ) {
	const defaultBlockContext = useMemo( () => {
		if ( post.type === 'wp_template' ) {
			return {};
		}
		return { postId: post.id, postType: post.type };
	}, [ post.id, post.type ] );
	const { selectionEnd, selectionStart, isReady } = useSelect( ( select ) => {
		const {
			getEditorSelectionStart,
			getEditorSelectionEnd,
			__unstableIsEditorReady,
		} = select( editorStore );
		return {
			isReady: __unstableIsEditorReady(),
			selectionStart: getEditorSelectionStart(),
			selectionEnd: getEditorSelectionEnd(),
		};
	}, [] );
	const { id, type } = __unstableTemplate ?? post;
	const blockEditorProps = usePostContentEditor( type, id );
	const editorSettings = useBlockEditorSettings(
		settings,
		!! __unstableTemplate
	);
	const {
		updatePostLock,
		setupEditor,
		updateEditorSettings,
		__experimentalTearDownEditor,
		__unstableSetupTemplate,
	} = useDispatch( editorStore );
	const { createWarningNotice } = useDispatch( noticesStore );

	// Iniitialize and tear down the editor.
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

	// Synchronize the editor settings as they change
	useEffect( () => {
		updateEditorSettings( settings );
	}, [ settings ] );

	// Synchronize the template as it changes
	useEffect( () => {
		if ( __unstableTemplate ) {
			__unstableSetupTemplate( __unstableTemplate );
		}
	}, [ __unstableTemplate?.id ] );

	if ( ! isReady ) {
		return null;
	}

	return (
		<EntityProvider kind="root" type="site">
			<EntityProvider kind="postType" type={ post.type } id={ post.id }>
				<BlockContextProvider value={ defaultBlockContext }>
					<BlockEditorProvider
						{ ...blockEditorProps }
						selectionStart={ selectionStart }
						selectionEnd={ selectionEnd }
						settings={ editorSettings }
						useSubRegistry={ false }
					>
						{ children }
						<ReusableBlocksMenuItems />
						<ConvertToGroupButtons />
					</BlockEditorProvider>
				</BlockContextProvider>
			</EntityProvider>
		</EntityProvider>
	);
}

export default withRegistryProvider( EditorProvider );
