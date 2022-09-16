/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const Edit = () => {
	const blockProps = useBlockProps();
	return (
		<form { ...blockProps }>
			<InnerBlocks />
		</form>
	);
};
export default Edit;
