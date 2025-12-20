/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import PostStickyForm from './';
import PostStickyCheck from './check';

export function PostStickyPanel() {
	return (
		<PostStickyCheck>
			<PostPanelRow>
				<PostStickyForm />
			</PostPanelRow>
		</PostStickyCheck>
	);
}

export default PostStickyPanel;
