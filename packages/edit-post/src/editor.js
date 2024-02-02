/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ErrorBoundary,
	PostLockedModal,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import { CommandMenu } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import EditorInitialization from './components/editor-initialization';
import { store as editPostStore } from './store';
import { unlock } from './lock-unlock';
import usePostHistory from './hooks/use-post-history';

const { ExperimentalEditorProvider } = unlock( editorPrivateApis );

function Editor( {
	postId: initialPostId,
	postType: initialPostType,
	settings,
	initialEdits,
	...props
} ) {
	const { currentPost, getPostLinkProps, editPostTypeProps, goBack } =
		usePostHistory( initialPostId, initialPostType );

	const { hasInlineToolbar, post, preferredStyleVariations, template } =
		useSelect(
			( select ) => {
				const { isFeatureActive, getEditedPostTemplate } =
					select( editPostStore );
				const { getEntityRecord, getPostType, canUser } =
					select( coreStore );
				const { getEditorSettings } = select( editorStore );

				const postObject = getEntityRecord(
					'postType',
					currentPost.postType,
					currentPost.postId
				);

				const supportsTemplateMode =
					getEditorSettings().supportsTemplateMode;
				const isViewable =
					getPostType( currentPost.postType )?.viewable ?? false;
				const canEditTemplate = canUser( 'create', 'templates' );
				return {
					hasInlineToolbar: isFeatureActive( 'inlineToolbar' ),
					preferredStyleVariations: select( preferencesStore ).get(
						'core/edit-post',
						'preferredStyleVariations'
					),
					template:
						supportsTemplateMode &&
						isViewable &&
						canEditTemplate &&
						currentPost.postType !== 'wp_template'
							? getEditedPostTemplate()
							: null,
					post: postObject,
				};
			},
			[ currentPost.postType, currentPost.postId ]
		);

	const { updatePreferredStyleVariations } = useDispatch( editPostStore );
	const defaultRenderingMode =
		currentPost.postType === 'wp_template' ? 'all' : 'post-only';

	const editorSettings = useMemo(
		() => ( {
			...settings,
			getPostLinkProps,
			editPostTypeProps,
			goBack,
			defaultRenderingMode,
			__experimentalPreferredStyleVariations: {
				value: preferredStyleVariations,
				onChange: updatePreferredStyleVariations,
			},
			hasInlineToolbar,
		} ),
		[
			settings,
			hasInlineToolbar,
			preferredStyleVariations,
			updatePreferredStyleVariations,
			getPostLinkProps,
			editPostTypeProps,
			goBack,
			defaultRenderingMode,
		]
	);

	if ( ! post ) {
		return null;
	}

	return (
		<SlotFillProvider>
			<ExperimentalEditorProvider
				settings={ editorSettings }
				post={ post }
				initialEdits={ initialEdits }
				useSubRegistry={ false }
				__unstableTemplate={ template }
				{ ...props }
			>
				<ErrorBoundary>
					<CommandMenu />
					<EditorInitialization postId={ currentPost.postId } />
					<Layout />
				</ErrorBoundary>
				<PostLockedModal />
			</ExperimentalEditorProvider>
		</SlotFillProvider>
	);
}

export default Editor;
