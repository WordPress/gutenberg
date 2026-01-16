/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';

function SlideEdit() {
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slide' ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: InnerBlocks.ButtonBlockAppender,
	} );

	return <div { ...innerBlocksProps } />;
}

export default SlideEdit;
