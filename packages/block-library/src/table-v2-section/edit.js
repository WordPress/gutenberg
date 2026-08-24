import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function TableSectionEdit( { attributes } ) {
	const { type } = attributes;
	const TagName = `t${ type }`;

	return <TagName { ...useInnerBlocksProps() } />;
}
