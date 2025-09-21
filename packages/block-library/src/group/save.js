/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes: { tagName: Tag, stretchyText } } ) {
	const blockProps = useBlockProps.save( {
		className: clsx( {
			'has-stretch-text': stretchyText,
		} ),
	} );

	return <Tag { ...useInnerBlocksProps.save( blockProps ) } />;
}
