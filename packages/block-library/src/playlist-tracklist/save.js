/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save( {
		className: 'wp-block-playlist__tracklist',
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ol { ...innerBlocksProps } />;
}
