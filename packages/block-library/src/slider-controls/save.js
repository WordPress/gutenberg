/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save() {
	const blockProps = useBlockProps.save( {
		className: 'wp-block-slider-controls',
	} );

	return (
		<div { ...blockProps }>
			<button
				type="button"
				className="wp-block-slider-controls__button wp-block-slider-controls__previous"
				aria-label={ __( 'Previous slide' ) }
				data-wp-on--click="actions.prevSlide"
				data-wp-bind--disabled="state.isAtStart"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z" />
				</svg>
			</button>
			<button
				type="button"
				className="wp-block-slider-controls__button wp-block-slider-controls__next"
				aria-label={ __( 'Next slide' ) }
				data-wp-on--click="actions.nextSlide"
				data-wp-bind--disabled="state.isAtEnd"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" />
				</svg>
			</button>
		</div>
	);
}
