/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const Save = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { submissionMethod } = attributes;

	return (
		<form
			{ ...blockProps }
			className="wp-block-form"
			encType={ submissionMethod === 'email' ? 'text/plain' : null }
		>
			<InnerBlocks.Content />
		</form>
	);
};
export default Save;
