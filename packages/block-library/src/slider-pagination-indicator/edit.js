/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

export default function Edit() {
	const blockProps = useBlockProps();

	// Render a static 3-dot preview in the editor; actual dots are
	// generated at runtime by the Interactivity API from `state.dots`.
	return (
		<div { ...blockProps }>
			{ [ 0, 1, 2 ].map( ( i ) => (
				<button
					key={ i }
					type="button"
					className={ `wp-block-slider-pagination-indicator__dot${
						i === 0 ? ' is-active' : ''
					}` }
					/*
					 * translators: %d: Slide number.
					 */
					aria-label={ sprintf( __( 'Slide %d' ), i + 1 ) }
					disabled
					tabIndex={ -1 }
				/>
			) ) }
		</div>
	);
}
