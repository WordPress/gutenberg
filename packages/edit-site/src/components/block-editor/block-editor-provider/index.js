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
import PatternEditorProvider from './pattern-editor-provider';
import { NAVIGATION_POST_TYPE, PATTERN_TYPES } from '../../../utils/constants';

export default function BlockEditorProvider( { children } ) {
	const entityType = useSelect(
		( select ) => select( editSiteStore ).getEditedPostType(),
		[]
	);
	if ( entityType === NAVIGATION_POST_TYPE ) {
		return (
			<NavigationBlockEditorProvider>
				{ children }
			</NavigationBlockEditorProvider>
		);
	} else if ( entityType === PATTERN_TYPES.user ) {
		return <PatternEditorProvider>{ children }</PatternEditorProvider>;
	}
	return (
		<DefaultBlockEditorProvider>{ children }</DefaultBlockEditorProvider>
	);
}
