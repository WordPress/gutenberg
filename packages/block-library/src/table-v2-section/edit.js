import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function TableSectionEdit( { attributes } ) {
	const { type } = attributes;
	const TagName = `t${ type }`;

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		renderAppender: false,
		__unstableDisableDropZone: true,
	} );

	return <TagName { ...innerBlocksProps } />;
}
