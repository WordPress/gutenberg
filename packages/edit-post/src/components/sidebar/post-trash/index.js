/**
 * WordPress dependencies
 */
import { PostTrash as PostTrashLink, PostTrashCheck } from '@wordpress/editor';
import { FlexItem } from '@wordpress/components';

export default function PostTrash() {
	return (
		<PostTrashCheck>
			<FlexItem isBlock>
				<PostTrashLink />
			</FlexItem>
		</PostTrashCheck>
	);
}
