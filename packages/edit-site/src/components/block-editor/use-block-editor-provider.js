/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import DefaultBlockEditor from './providers/default-block-editor-provider';
import NavigationBlockEditor from './providers/navigation-block-editor-provider';
import ContentBlockEditorProvider from './providers/content-block-editor-provider';

/**
 * Factory to isolate choosing the appropriate block editor
 * component to handle a given entity type.
 *
 * @return {JSX.Element} the block editor component to use.
 */
export default function useBlockEditorProvider() {
	const { entityType, pageContentFocusMode } = useSelect(
		( select ) => ( {
			entityType: select( editSiteStore ).getEditedPostType(),
			pageContentFocusMode:
				select( editSiteStore ).getPageContentFocusMode(),
		} ),
		[]
	);

	switch ( entityType ) {
		case 'wp_navigation':
			return NavigationBlockEditor;
		case 'wp_template':
		case 'wp_template_part':
		default:
			return pageContentFocusMode === 'withoutTemplate'
				? ContentBlockEditorProvider
				: DefaultBlockEditor;
	}
}
