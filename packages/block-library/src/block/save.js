/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save() {
	// We'll probably save alignment class here soon.
	const blockProps = useBlockProps.save();

	return <div { ...blockProps } />;
}
