/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const Save = () => {
	const blockProps = useBlockProps.save();
	return (
		<form { ...blockProps }>
			<InnerBlocks.Content />
		</form>
	);
};
export default Save;
