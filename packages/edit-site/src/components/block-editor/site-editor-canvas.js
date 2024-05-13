/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch, useResizeObserver } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ResizableEditor from './resizable-editor';
import EditorCanvas from './editor-canvas';
import EditorCanvasContainer from '../editor-canvas-container';
import useSiteEditorSettings from './use-site-editor-settings';
import { store as editSiteStore } from '../../store';
import {
	FOCUSABLE_ENTITIES,
	NAVIGATION_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { privateApis as routerPrivateApis } from '@wordpress/router';

const { useLocation } = unlock( routerPrivateApis );

export default function SiteEditorCanvas( { onClick } ) {
	const location = useLocation();
	const { templateType, isFocusableEntity, isViewMode, isZoomOutMode } =
		useSelect( ( select ) => {
			const { getEditedPostType, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const { __unstableGetEditorMode } = select( blockEditorStore );
			const _templateType = getEditedPostType();

			return {
				templateType: _templateType,
				isFocusableEntity: FOCUSABLE_ENTITIES.includes( _templateType ),
				isViewMode: getCanvasMode() === 'view',
				isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
			};
		}, [] );
	const isFocusMode = location.params.focusMode || isFocusableEntity;
	const [ resizeObserver, sizes ] = useResizeObserver();

	const settings = useSiteEditorSettings();

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const enableResizing =
		isFocusMode &&
		! isViewMode &&
		// Disable resizing in mobile viewport.
		! isMobileViewport &&
		// Dsiable resizing in zoomed-out mode.
		! isZoomOutMode &&
		// Disable resizing when editing a template in focus mode.
		templateType !== TEMPLATE_POST_TYPE;

	const isTemplateTypeNavigation = templateType === NAVIGATION_POST_TYPE;
	const isNavigationFocusMode = isTemplateTypeNavigation && isFocusMode;
	const forceFullHeight = isNavigationFocusMode;

	return (
		<EditorCanvasContainer.Slot>
			{ ( [ editorCanvasView ] ) =>
				editorCanvasView ? (
					<div className="edit-site-visual-editor is-focus-mode">
						{ editorCanvasView }
					</div>
				) : (
					<div
						className={ clsx( 'edit-site-visual-editor', {
							'is-focus-mode': isFocusMode || !! editorCanvasView,
							'is-view-mode': isViewMode,
						} ) }
					>
						<ResizableEditor
							enableResizing={ enableResizing }
							height={
								sizes.height && ! forceFullHeight
									? sizes.height
									: '100%'
							}
						>
							<EditorCanvas
								enableResizing={ enableResizing }
								settings={ settings }
								onClick={ onClick }
							>
								{
									// Avoid resize listeners when not needed,
									// these will trigger unnecessary re-renders
									// when animating the iframe width.
									enableResizing && resizeObserver
								}
							</EditorCanvas>
						</ResizableEditor>
					</div>
				)
			}
		</EditorCanvasContainer.Slot>
	);
}
