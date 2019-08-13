/**
 * WordPress dependencies
 */
import { EntityHandlers } from '@wordpress/editor';

export default function PostSave() {
	return <EntityHandlers.Content />;
}
