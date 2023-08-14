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

export default function BlockEditorProvider( { children } ) {
	const { entityType, pageContentFocusMode } = useSelect(
		( select ) => ( {
			entityType: select( editSiteStore ).getEditedPostType(),
			pageContentFocusMode:
				select( editSiteStore ).getPageContentFocusMode(),
		} ),
		[]
	);

	if ( entityType === 'wp_navigation' ) {
		return <NavigationBlockEditor>{ children }</NavigationBlockEditor>;
	}

	if ( entityType === 'wp_template' || entityType === 'wp_template_part' ) {
		return (
			<DefaultBlockEditor
				contentOnly={ pageContentFocusMode === 'withoutTemplate' }
			>
				{ children }
			</DefaultBlockEditor>
		);
	}
}
