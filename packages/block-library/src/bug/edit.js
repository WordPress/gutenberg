/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function Test( { attributes, setAttributes } ) {
	const { testAttribute } = attributes;
	const blockProps = useBlockProps();
	return (
		<>
			<div { ...blockProps }>hi</div>
		</>
	);
}
