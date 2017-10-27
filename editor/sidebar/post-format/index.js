/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostFormatCheck from '../../post-format/check';
import PostFormatForm from '../../post-format';

export function PostFormat() {
	return (
		<PostFormatCheck>
			<PanelRow>
				<PostFormatForm />
			</PanelRow>
		</PostFormatCheck>
	);
}

export default PostFormat;
