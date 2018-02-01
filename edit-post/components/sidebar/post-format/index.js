/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import { PostFormat as PostFormatForm, ifPostTypeSupports } from '@wordpress/editor';

export function PostFormat() {
	return (
		<PanelRow>
			<PostFormatForm />
		</PanelRow>
	);
}

export default ifPostTypeSupports( 'post-formats' )( PostFormat );
