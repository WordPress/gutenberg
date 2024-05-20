/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostFormatForm from './';
import PostFormatCheck from './check';

export function PostFormat() {
	return (
		<PostFormatCheck>
			<PanelRow className="editor-post-format__panel">
				<PostFormatForm />
			</PanelRow>
		</PostFormatCheck>
	);
}

export default PostFormat;
