/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostStickyCheck from '../../post-sticky/check';
import PostStickyForm from '../../post-sticky';

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
