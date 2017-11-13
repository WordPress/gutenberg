/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PostFormat as PostFormatForm, PostFormatCheck } from '../../components';

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
