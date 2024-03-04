/**
 * WordPress dependencies
 */
import {
	PostSticky as PostStickyForm,
	PostStickyCheck,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { PostPanelRow } = unlock( editorPrivateApis );

export function PostSticky() {
	return (
		<PostStickyCheck>
			<PostPanelRow>
				<PostStickyForm />
			</PostPanelRow>
		</PostStickyCheck>
	);
}

export default PostSticky;
