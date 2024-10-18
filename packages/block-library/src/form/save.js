/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { submissionMethod } = attributes;

	return (
		<form
			{ ...blockProps }
			encType={ submissionMethod === 'email' ? 'text/plain' : null }
		>
			<InnerBlocks.Content />
		</form>
	);
}
