/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const SLIDE_TEMPLATE = [ [ 'core/slide' ] ];

function SliderTrackEdit() {
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slider-track' ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/slide' ],
		template: SLIDE_TEMPLATE,
		renderAppender: false,
	} );

	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}

export default SliderTrackEdit;
