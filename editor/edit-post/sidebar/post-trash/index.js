/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { PostTrash as PostTrashLink, PostTrashCheck } from '../../../components';

export default function PostTrash() {
	return (
		<PostTrashCheck>
			<PanelRow>
				<PostTrashLink />
			</PanelRow>
		</PostTrashCheck>
	);
}
