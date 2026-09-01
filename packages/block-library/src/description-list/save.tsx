import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	return (
		<dl
			{ ...useInnerBlocksProps.save(
				useBlockProps.save< HTMLDListElement >()
			) }
		/>
	);
}
