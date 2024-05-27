/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import EditorCanvas from './editor-canvas';
import EditorCanvasContainer from '../editor-canvas-container';
import useSiteEditorSettings from './use-site-editor-settings';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function SiteEditorCanvas() {
	const { isViewMode } = useSelect( ( select ) => {
		const { getCanvasMode } = unlock( select( editSiteStore ) );

		return {
			isViewMode: getCanvasMode() === 'view',
		};
	}, [] );

	const settings = useSiteEditorSettings();

	return (
		<EditorCanvasContainer.Slot>
			{ ( [ editorCanvasView ] ) =>
				editorCanvasView ? (
					<div className="edit-site-visual-editor">
						{ editorCanvasView }
					</div>
				) : (
					<div
						className={ clsx( 'edit-site-visual-editor', {
							'is-view-mode': isViewMode,
						} ) }
					>
						<EditorCanvas settings={ settings } />
					</div>
				)
			}
		</EditorCanvasContainer.Slot>
	);
}
