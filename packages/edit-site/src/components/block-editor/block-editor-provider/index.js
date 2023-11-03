/**
 * Internal dependencies
 */
import DefaultBlockEditorProvider from './default-block-editor-provider';
import NavigationBlockEditorProvider from './navigation-block-editor-provider';
import { NAVIGATION_POST_TYPE } from '../../../utils/constants';

export default function BlockEditorProvider( { postType, postId, children } ) {
	const Provider =
		postType === NAVIGATION_POST_TYPE
			? NavigationBlockEditorProvider
			: DefaultBlockEditorProvider;
	return (
		<Provider postType={ postType } postId={ postId }>
			{ children }
		</Provider>
	);
}
