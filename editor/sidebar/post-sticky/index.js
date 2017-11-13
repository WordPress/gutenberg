/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PostSticky as PostStickyForm, PostStickyCheck } from '../../components';

export function PostSticky() {
	return (
		<PostStickyCheck>
			<PanelRow>
				<PostStickyForm />
			</PanelRow>
		</PostStickyCheck>
	);
}

export default PostSticky;
