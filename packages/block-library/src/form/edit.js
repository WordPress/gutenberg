/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/input-field',
	'core/columns',
	'core/group',
];

const Edit = () => {
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
	} );

	return <form { ...innerBlocksProps } />;
};
export default Edit;
