/**
 * Internal dependencies
 */
import Editor from '../editor';
import { useInitEditedEntity } from '../sync-state-with-url/use-init-edited-entity-from-url';

export default function SideEditor( { postType, postId } ) {
	useInitEditedEntity( {
		postId,
		postType,
	} );

	return <Editor />;
}
