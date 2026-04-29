/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

// SVG path data keyed by [ arrowIcon ][ type ].
// These match the @wordpress/icons paths for chevronLeft/Right and arrowLeft/Right.
const svgPaths = {
	chevron: {
		previous: 'M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z',
		next: 'M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z',
	},
	arrow: {
		previous: 'M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z',
		next: 'm14.5 6.5-1 1 3.7 3.7H4v1.6h13.2l-3.7 3.7 1 1 5.6-5.5z',
	},
};

export default function save( { attributes, context } ) {
	const { type } = attributes;
	const arrowIcon = context?.arrowIcon ?? 'chevron';

	const blockProps = useBlockProps.save( {
		className: `is-type-${ type } is-icon-${ arrowIcon }`,
		type: 'button',
	} );

	// The SVG icon is saved statically. The aria-label and Interactivity API
	// directives are injected by the PHP render_callback.
	const pathD = ( svgPaths[ arrowIcon ] ?? svgPaths.chevron )[ type ];

	return (
		<button { ...blockProps }>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				width="24"
				height="24"
				aria-hidden="true"
				focusable="false"
				className="wp-block-slider-pagination-button__icon"
			>
				<path d={ pathD } />
			</svg>
		</button>
	);
}
