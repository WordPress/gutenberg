/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Page from '../page';
import { store as editSiteStore } from '../../store';
import { useSpecificEditorSettings } from '../block-editor/use-site-editor-settings';
import { unlock } from '../../lock-unlock';
import GlobalStylesUI from '../global-styles/ui';
import useEditedEntityRecord from '../use-edited-entity-record';
import EditorCanvasContainer from '../editor-canvas-container';
import { GlobalStylesRenderer } from '../global-styles-renderer';

const { useLocation } = unlock( routerPrivateApis );
const { ExperimentalEditorProvider: EditorProvider } =
	unlock( editorPrivateApis );

export default function PageStyles() {
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const { record: editedPost } = useEditedEntityRecord();
	const editorSettings = useSpecificEditorSettings();
	// Clear the editor canvas container view when accessing the main navigation screen.
	useEffect( () => {
		setEditorCanvasContainerView( 'style-book' );
		return () => {
			setEditorCanvasContainerView( undefined );
		};
	}, [ setEditorCanvasContainerView ] );
	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	const {
		params: { activeView },
	} = useLocation();

	return (
		<>
			<EditorProvider
				post={ editedPost }
				__unstableTemplate={ editedPost }
				settings={ editorSettings }
				useSubRegistry={ false }
			>
				<GlobalStylesRenderer />
				{ activeView && (
					<Page small>
						<GlobalStylesUI
							initialPath={ activeView }
							root={ false }
						/>
					</Page>
				) }
				<Page>
					<EditorCanvasContainer.Slot>
						{ ( [ editorCanvasView ] ) =>
							editorCanvasView && (
								<div className="edit-site-visual-editor is-focus-mode">
									{ editorCanvasView }
								</div>
							)
						}
					</EditorCanvasContainer.Slot>
				</Page>
			</EditorProvider>
		</>
	);
}
