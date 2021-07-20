/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function creditsSave( { attributes } ) {
	const blockProps = useBlockProps.save();
	return <p { ...blockProps }>{ attributes.content }</p>;
}
