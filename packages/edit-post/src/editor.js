/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	ErrorBoundary,
	PostLockedModal,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { CommandMenu } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import EditorInitialization from './components/editor-initialization';
import { store as editPostStore } from './store';
import { unlock } from './lock-unlock';
import useNavigateToEntityRecord from './hooks/use-navigate-to-entity-record';

const { ExperimentalEditorProvider } = unlock( editorPrivateApis );

function Editor( {
	postId: initialPostId,
	postType: initialPostType,
	settings,
	initialEdits,
	...props
} ) {
	const {
		initialPost,
		currentPost,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
	} = useNavigateToEntityRecord( initialPostId, initialPostType );

	const { post, template, defaultRenderingMode } = useSelect(
		( select ) => {
			const { getEditedPostTemplate } = select( editPostStore );
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
				template:
					supportsTemplateMode &&
					isViewable &&
					canEditTemplate &&
					currentPost.postType !== 'wp_template'
						? getEditedPostTemplate()
						: null,
				post: postObject,
				defaultRenderingMode:
					currentPost.postType === 'wp_template' ||
					currentPost.postType === 'wp_template_part'
						? 'all'
						: 'post-only',
			};
		},
		[ currentPost.postType, currentPost.postId ]
	);

	const editorSettings = useMemo(
		() => ( {
			...settings,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
			defaultRenderingMode,
		} ),
		[
			settings,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
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
					<EditorInitialization />
					<Layout initialPost={ initialPost } />
				</ErrorBoundary>
				<PostLockedModal />
			</ExperimentalEditorProvider>
		</SlotFillProvider>
	);
}

export default Editor;
