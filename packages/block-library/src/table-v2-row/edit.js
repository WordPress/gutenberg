import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function TableRowEdit() {
	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		renderAppender: false,
		__unstableDisableDropZone: true,
	} );

	return <tr { ...innerBlocksProps } />;
}
