/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { DocumentTools: EditorDocumentTools } = unlock( editorPrivateApis );

export default function DocumentTools() {
	const { isVisualMode } = useSelect( ( select ) => {
		const { getEditorMode } = select( editorStore );

		return {
			isVisualMode: getEditorMode() === 'visual',
		};
	}, [] );

	return (
		<EditorDocumentTools
			disableBlockTools={ ! isVisualMode }
			listViewLabel={ __( 'List View' ) }
		/>
	);
}
