/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tagName: Tag, role } = attributes;
	return (
		<Tag
			{ ...useInnerBlocksProps.save( useBlockProps.save() ) }
			role={ role }
		/>
	);
}
