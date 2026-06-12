/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	DEFAULT_PEEK_AMOUNT,
	DEFAULT_PEEK_UNIT,
	getSliderStyle,
	isZeroPeek,
	ZERO_PEEK_CLASS,
} from './utils';

export default function save( { attributes } ) {
	const {
		peekAmount = DEFAULT_PEEK_AMOUNT,
		peekUnit = DEFAULT_PEEK_UNIT,
		style,
	} = attributes;
	const blockProps = useBlockProps.save( {
		className: isZeroPeek( peekAmount ) ? ZERO_PEEK_CLASS : undefined,
		style: getSliderStyle( { peekAmount, peekUnit, style } ),
	} );
	const innerBlocksProps = useInnerBlocksProps.save( {
		className: 'wp-block-slider__track',
	} );

	return (
		<div { ...blockProps }>
			<div className="wp-block-slider__viewport">
				<div { ...innerBlocksProps } />
			</div>
			<div
				className="wp-block-slider__controls"
				aria-label="Slider controls"
			>
				<button
					type="button"
					className="wp-block-slider__arrow wp-block-slider__arrow--previous"
					aria-label="Previous slide"
					disabled
				>
					&lsaquo;
				</button>
				<div className="wp-block-slider__dots" aria-hidden="true">
					<span className="wp-block-slider__dot wp-block-slider__dot--previous" />
					<span className="wp-block-slider__dot wp-block-slider__dot--active is-visible is-active" />
					<span className="wp-block-slider__dot wp-block-slider__dot--next is-visible" />
				</div>
				<button
					type="button"
					className="wp-block-slider__arrow wp-block-slider__arrow--next"
					aria-label="Next slide"
				>
					&rsaquo;
				</button>
				<span
					className="wp-block-slider__status screen-reader-text"
					aria-live="polite"
					aria-atomic="true"
				>
					Slide 1 of 2
				</span>
			</div>
		</div>
	);
}
