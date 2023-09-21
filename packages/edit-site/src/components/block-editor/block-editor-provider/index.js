/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import DefaultBlockEditorProvider from './default-block-editor-provider';
import NavigationBlockEditorProvider from './navigation-block-editor-provider';

export default function BlockEditorProvider( { children } ) {
	const entityType = useSelect(
		( select ) => select( editSiteStore ).getEditedPostType(),
		[]
	);
	if ( entityType === 'wp_navigation' ) {
		return (
			<NavigationBlockEditorProvider>
				{ children }
			</NavigationBlockEditorProvider>
		);
	}
	return (
		<DefaultBlockEditorProvider>{ children }</DefaultBlockEditorProvider>
	);
}
