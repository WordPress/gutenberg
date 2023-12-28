/**
 * Internal dependencies
 */
import Editor from '../editor';
import { useInitEditedEntity } from '../sync-state-with-url/use-init-edited-entity-from-url';
import { useIsSiteEditorLoading } from '../layout/hooks';

export default function PostPreview( { postType, postId } ) {
	useInitEditedEntity( {
		postId,
		postType,
	} );
	const isEditorLoading = useIsSiteEditorLoading();

	return <Editor isLoading={ isEditorLoading } />;
}
