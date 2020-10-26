/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tagName: Tag } = attributes;

	return (
		<Tag { ...useBlockProps.save() }>
			<div
				{ ...useInnerBlocksProps.save( {
					className: 'wp-block-group__inner-container',
				} ) }
			/>
		</Tag>
	);
}
