import clsx from 'clsx';
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { tagName: Tag, hasClippedContent },
} ) {
	const blockProps = useBlockProps.save( {
		className: clsx( { 'has-clipped-content': hasClippedContent } ),
	} );

	return <Tag { ...useInnerBlocksProps.save( blockProps ) } />;
}
