import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { Notice as WCNotice } from '@wordpress/components';
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

// Guards against runaway chains of parent templates.
const MAX_TEMPLATE_DEPTH = 10;

/**
 * Returns the IDs of a template's ancestors, closest first, stopping at a
 * parent that has not loaded, does not exist, or would make a cycle.
 *
 * @param {Function} select     Registry select.
 * @param {string}   templateId The template ID.
 * @return {string[]} The ancestor template IDs, closest first.
 */
function getTemplateAncestorIds( select, templateId ) {
	const { getEditedEntityRecord, getEntityRecord } = select( coreStore );
	const ancestors = [];
	const seen = new Set( [ templateId ] );
	let currentId = templateId;
	while ( ancestors.length < MAX_TEMPLATE_DEPTH ) {
		const parentId = getParentTemplateId(
			getEditedEntityRecord( 'postType', TEMPLATE_POST_TYPE, currentId )
		);
		if (
			! parentId ||
			seen.has( parentId ) ||
			! getEntityRecord( 'postType', TEMPLATE_POST_TYPE, parentId )
		) {
			break;
		}
		ancestors.push( parentId );
		seen.add( parentId );
		currentId = parentId;
	}
	return ancestors;
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
		templateChainKey,
		hasLoadedPost,
		error,
		isBlockTheme,
		showGlobalStyles,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecord,
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
			// the way a page is edited inside its template, and a page whose
			// template has a parent is edited inside the whole chain. The
			// outermost template is the one the editor renders, and the
			// templates between it and the post are passed down as
			// `templateChain`. Some callers pass a template as its own
			// template, which means it has none.
			const isEditingTemplate =
				postType === TEMPLATE_POST_TYPE &&
				( ! templateId || templateId === postId );
			const innermostId = isEditingTemplate ? postId : templateId;
			const ancestorIds = innermostId
				? getTemplateAncestorIds( select, innermostId )
				: [];
			let _templateId = templateId;
			let chain = [];
			if ( ancestorIds.length ) {
				_templateId = ancestorIds[ ancestorIds.length - 1 ];
				chain = ancestorIds.slice( 0, -1 ).reverse();
				if ( ! isEditingTemplate ) {
					chain.push( templateId );
				}
			}

			return {
				post: getEntityRecord( ...postArgs ),
				template: _templateId
					? getEntityRecord(
							'postType',
							TEMPLATE_POST_TYPE,
							_templateId
						)
					: undefined,
				inheritsTemplate: isEditingTemplate && !! ancestorIds.length,
				// Joined so that the selector returns a stable value.
				templateChainKey: chain.join( '\n' ),
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

	const templateChain = useMemo(
		() => ( templateChainKey ? templateChainKey.split( '\n' ) : [] ),
		[ templateChainKey ]
	);

	return (
		<>
			{ hasLoadedPost && ! post && (
				<WCNotice
					status={ !! error ? 'error' : 'warning' }
					isDismissible={ false }
				>
					{ ! error
						? __(
								"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
							)
						: error }
				</WCNotice>
			) }
			{ !! post && (
				<ExperimentalEditorProvider
					post={ post }
					__unstableTemplate={ template }
					templateChain={ templateChain }
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
