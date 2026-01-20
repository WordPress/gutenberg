/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

const SLIDER_TEMPLATE = [
	[ 'core/slider-controls' ],
	[
		'core/slider-track',
		{},
		[
			[ 'core/slide', {}, [ [ 'core/image' ] ] ],
			[ 'core/slide', {}, [ [ 'core/image' ] ] ],
			[ 'core/slide', {}, [ [ 'core/image' ] ] ],
		],
	],
];

const ALLOWED_BLOCKS = [ 'core/slider-controls', 'core/slider-track' ];

function SliderEdit( { attributes, setAttributes } ) {
	const { sliderId } = attributes;
	const instanceId = useInstanceId( SliderEdit );
	// Generate unique ID for the slider
	useEffect( () => {
		if ( ! sliderId ) {
			setAttributes( { sliderId: instanceId } );
		}
	}, [ sliderId, setAttributes, instanceId ] );

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slider' ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: SLIDER_TEMPLATE,
		renderAppender: false,
	} );

	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}

export default SliderEdit;
