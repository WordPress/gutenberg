/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save();

	// Controls have no inner blocks, just return wrapper
	return <div { ...blockProps } />;
}
