/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { type } = attributes;
	const isPrevious = type === 'previous';

	const blockProps = useBlockProps.save( {
		className: `is-type-${ type }`,
		type: 'button',
	} );

	// The chevron SVG is saved statically. The button text label,
	// ARIA attributes, and Interactivity API directives are
	// injected by the PHP render_callback.
	const chevron = isPrevious ? (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			aria-hidden="true"
			focusable="false"
			className="wp-block-slider-pagination-button__icon"
		>
			<path d="M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z" />
		</svg>
	) : (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			aria-hidden="true"
			focusable="false"
			className="wp-block-slider-pagination-button__icon"
		>
			<path d="M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" />
		</svg>
	);

	return <button { ...blockProps }>{ chevron }</button>;
}
