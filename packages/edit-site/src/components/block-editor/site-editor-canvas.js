/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import {
	BlockList,
	BlockTools,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	BlockEditorKeyboardShortcuts,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useMergeRefs,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
/**
 * Internal dependencies
 */
import BackButton from './back-button';
import ResizableEditor from './resizable-editor';
import EditorCanvas from './editor-canvas';
import EditorCanvasContainer from '../editor-canvas-container';
import useSiteEditorSettings from './use-site-editor-settings';
import { store as editSiteStore } from '../../store';
import { FOCUSABLE_ENTITIES } from './constants';
import { unlock } from '../../lock-unlock';
import PageContentFocusManager from '../page-content-focus-manager';

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

export default function SiteEditorCanvas() {
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const { templateType, isFocusMode, isViewMode } = useSelect( ( select ) => {
		const { getEditedPostType, getCanvasMode } = unlock(
			select( editSiteStore )
		);

		const _templateType = getEditedPostType();

		return {
			templateType: _templateType,
			isFocusMode: FOCUSABLE_ENTITIES.includes( _templateType ),
			isViewMode: getCanvasMode() === 'view',
		};
	}, [] );

	const [ resizeObserver, sizes ] = useResizeObserver();

	const settings = useSiteEditorSettings();

	const { hasBlocks } = useSelect( ( select ) => {
		const { getBlockCount } = select( blockEditorStore );

		const blocks = getBlockCount();

		return {
			hasBlocks: !! blocks,
		};
	}, [] );

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const enableResizing =
		isFocusMode &&
		! isViewMode &&
		// Disable resizing in mobile viewport.
		! isMobileViewport;

	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [
		contentRef,
		useClipboardHandler(),
		useTypingObserver(),
	] );

	const isTemplateTypeNavigation = templateType === 'wp_navigation';

	const isNavigationFocusMode = isTemplateTypeNavigation && isFocusMode;

	// Hide the appender when:
	// - In navigation focus mode (should only allow the root Nav block).
	// - In view mode (i.e. not editing).
	const showBlockAppender =
		( isNavigationFocusMode && hasBlocks ) || isViewMode
			? false
			: undefined;

	return (
		<>
			<EditorCanvasContainer.Slot>
				{ ( [ editorCanvasView ] ) =>
					editorCanvasView ? (
						<div className="edit-site-visual-editor is-focus-mode">
							{ editorCanvasView }
						</div>
					) : (
						<BlockTools
							className={ classnames( 'edit-site-visual-editor', {
								'is-focus-mode':
									isFocusMode || !! editorCanvasView,
								'is-view-mode': isViewMode,
							} ) }
							__unstableContentRef={ contentRef }
							onClick={ ( event ) => {
								// Clear selected block when clicking on the gray background.
								if ( event.target === event.currentTarget ) {
									clearSelectedBlock();
								}
							} }
						>
							<BlockEditorKeyboardShortcuts.Register />
							<BackButton />
							<ResizableEditor
								enableResizing={ enableResizing }
								height={ sizes.height ?? '100%' }
							>
								<EditorCanvas
									enableResizing={ enableResizing }
									settings={ settings }
									contentRef={ mergedRefs }
									readonly={ isViewMode }
								>
									{ resizeObserver }
									<BlockList
										className={ classnames(
											'edit-site-block-editor__block-list wp-site-blocks',
											{
												'is-navigation-block':
													isTemplateTypeNavigation,
											}
										) }
										layout={ LAYOUT }
										renderAppender={ showBlockAppender }
									/>
								</EditorCanvas>
							</ResizableEditor>
						</BlockTools>
					)
				}
			</EditorCanvasContainer.Slot>
			<PageContentFocusManager contentRef={ contentRef } />
		</>
	);
}
