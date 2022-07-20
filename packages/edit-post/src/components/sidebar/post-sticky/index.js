/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import {
	PostSticky as PostStickyForm,
	PostStickyCheck,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export function PostSticky() {
	return (
		<PostStickyCheck>
			<ToolsPanelItem
				label={ __( 'Stick to top' ) }
				hasValue={ () => true }
			>
				<PostStickyForm />
			</ToolsPanelItem>
		</PostStickyCheck>
	);
}

export default PostSticky;
