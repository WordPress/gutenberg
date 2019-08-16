/**
 * WordPress dependencies
 */
import { EntityHandlers } from '@wordpress/editor';

export default function PostContentEdit() {
	return (
		<EntityHandlers handles={ { content: true, blocks: true } } />
	);
}
