/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SiteEditorMoreMenu from './more-menu';
import { unlock } from '../../lock-unlock';
import SaveButton from '../save-button';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';

const { Header: EditorHeader } = unlock( editorPrivateApis );

function Header( { setEntitiesSavedStatesCallback } ) {
	const _isPreviewingTheme = isPreviewingTheme();

	return (
		<EditorHeader
			setEntitiesSavedStatesCallback={ setEntitiesSavedStatesCallback }
			customSaveButton={
				_isPreviewingTheme && <SaveButton size="compact" />
			}
		>
			<SiteEditorMoreMenu />
		</EditorHeader>
	);
}

export default Header;
