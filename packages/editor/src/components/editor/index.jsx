import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import EditorInterface from '../editor-interface';
import { ExperimentalEditorProvider } from '../provider';
import Sidebar from '../sidebar';
import NotesSidebar from '../collab-sidebar';
import GlobalStylesSidebar from '../global-styles-sidebar';
import { GlobalStylesRenderer } from '../global-styles-renderer';

/**
 * Returns the ID of the template a template renders inside, when the template
 * inheritance experiment is on and the template names one.
 *
 * @param {Object} [record] The edited template record.
 * @return {string|undefined} The parent template ID.
 */
function getParentTemplateId( record ) {
	const isEnabled = globalThis.IS_GUTENBERG_PLUGIN
		? !! window.__experimentalTemplateInheritance
		: false;
	if (
		! isEnabled ||
		! record?.parent_template ||
		! record.theme ||
		record.parent_template === record.slug
	) {
		return undefined;
	}
	return `${ record.theme }//${ record.parent_template }`;
}

function Editor( {
	postType,
	postId,
	templateId,
	settings,
	children,
	initialEdits,
	initialViewport,
	renderingMode,

	// This could be part of the settings.
	onActionPerformed,

	// The following abstractions are not ideal but necessary
	// to account for site editor and post editor differences for now.
	extraContent,
	extraSidebarPanels,
	...props
} ) {
	const {
		post,
		template,
		inheritsTemplate,
		hasLoadedPost,
		error,
		isBlockTheme,
		showGlobalStyles,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				getResolutionError,
				hasFinishedResolution,
				getCurrentTheme,
				__experimentalGetCurrentGlobalStylesId,
				canUser,
			} = select( coreStore );
			const { getRenderingMode, getCurrentPostType } =
				select( editorStore );

			const postArgs = [ 'postType', postType, postId ];
			// Named apart from the `renderingMode` prop, which is what this
			// editor was told to be in rather than what it is in now.
			const currentRenderingMode = getRenderingMode();
			const currentPostType = getCurrentPostType();
			const _isBlockTheme = getCurrentTheme()?.is_block_theme;
			const globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const userCanEditGlobalStyles = globalStylesId
				? canUser( 'update', {
						kind: 'root',
						name: 'globalStyles',
						id: globalStylesId,
					} )
				: false;

			// A template that names a parent template is edited inside it,
			// the way a page is edited inside its template. Some callers pass
			// a template as its own template, which means it has none.
			const parentTemplateId =
				postType === TEMPLATE_POST_TYPE &&
				( ! templateId || templateId === postId )
					? getParentTemplateId(
							getEditedEntityRecord( ...postArgs )
						)
					: undefined;
			const parentTemplate = parentTemplateId
				? getEntityRecord(
						'postType',
						TEMPLATE_POST_TYPE,
						parentTemplateId
					)
				: undefined;
			const _templateId = parentTemplate ? parentTemplateId : templateId;

			return {
				post: getEntityRecord( ...postArgs ),
				template: _templateId
					? getEntityRecord(
							'postType',
							TEMPLATE_POST_TYPE,
							_templateId
						)
					: undefined,
				inheritsTemplate: !! parentTemplate,
				hasLoadedPost: hasFinishedResolution(
					'getEntityRecord',
					postArgs
				),
				error: getResolutionError( 'getEntityRecord', postArgs )
					?.message,
				isBlockTheme: _isBlockTheme,
				showGlobalStyles:
					_isBlockTheme &&
					userCanEditGlobalStyles &&
					( currentPostType === 'wp_template' ||
						currentRenderingMode === 'template-locked' ),
			};
		},
		[ postType, postId, templateId ]
	);

	return (
		<>
			{ hasLoadedPost && ! post && (
				<Notice
					status={ !! error ? 'error' : 'warning' }
					isDismissible={ false }
				>
					{ ! error
						? __(
								"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
							)
						: error }
				</Notice>
			) }
			{ !! post && (
				<ExperimentalEditorProvider
					post={ post }
					__unstableTemplate={ template }
					settings={ settings }
					initialEdits={ initialEdits }
					initialViewport={ initialViewport }
					renderingMode={
						renderingMode ??
						( inheritsTemplate ? 'template-locked' : undefined )
					}
					useSubRegistry={ false }
				>
					<EditorInterface { ...props }>
						{ extraContent }
					</EditorInterface>
					{ children }
					<Sidebar
						onActionPerformed={ onActionPerformed }
						extraPanels={ extraSidebarPanels }
					/>
					<NotesSidebar />
					{ isBlockTheme && <GlobalStylesRenderer /> }
					{ showGlobalStyles && <GlobalStylesSidebar /> }
				</ExperimentalEditorProvider>
			) }
		</>
	);
}

export default Editor;
