import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const Edit = () => {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: 'all',
	} );
	return (
		<div className="wp-block-form-submit-wrapper" { ...innerBlocksProps } />
	);
};
export default Edit;
