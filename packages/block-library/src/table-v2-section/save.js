import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function TableSectionSave( { attributes } ) {
	const { type } = attributes;
	const TagName = `t${ type }`;

	return <TagName { ...useInnerBlocksProps.save() } />;
}
