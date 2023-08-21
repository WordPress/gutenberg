/**
 * WordPress dependencies
 */
import { PostTrash as PostTrashLink, PostTrashCheck } from '@wordpress/editor';

export default function PostTrash() {
	return (
		<PostTrashCheck>
			<PostTrashLink />
		</PostTrashCheck>
	);
}
