/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SiteEditorMoreMenu from './more-menu';
import { unlock } from '../../lock-unlock';
import SaveButton from '../save-button';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';
import {
	getEditorCanvasContainerTitle,
	useHasEditorCanvasContainer,
} from '../editor-canvas-container';
import { store as editSiteStore } from '../../store';

const { Header: EditorHeader } = unlock( editorPrivateApis );

function Header( { setEntitiesSavedStatesCallback } ) {
	const _isPreviewingTheme = isPreviewingTheme();
	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();
	const { editorCanvasView } = useSelect( ( select ) => {
		return {
			editorCanvasView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
		};
	}, [] );

	return (
		<EditorHeader
			setEntitiesSavedStatesCallback={ setEntitiesSavedStatesCallback }
			customSaveButton={
				_isPreviewingTheme && <SaveButton size="compact" />
			}
			forceDisableBlockTools={ ! hasDefaultEditorCanvasView }
			title={
				! hasDefaultEditorCanvasView
					? getEditorCanvasContainerTitle( editorCanvasView )
					: undefined
			}
		>
			<SiteEditorMoreMenu />
		</EditorHeader>
	);
}

export default Header;
