/**
 * Internal dependencies
 */
import DefaultBlockEditor from './providers/default-block-editor-provider';
import NavigationBlockEditor from './providers/navigation-block-editor-provider';

/**
 * Factory to isolate choosing the appropriate block editor
 * component to handle a given entity type.
 *
 * @param {string} entityType the entity type being edited
 * @return {JSX.Element} the block editor component to use.
 */
export default function getBlockEditorProvider( entityType ) {
	let Provider = null;

	switch ( entityType ) {
		case 'wp_navigation':
			Provider = NavigationBlockEditor;
			break;
		case 'wp_template':
		case 'wp_template_part':
		default:
			Provider = DefaultBlockEditor;
			break;
	}

	return Provider;
}
