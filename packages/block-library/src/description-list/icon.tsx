import { Path, SVG } from '@wordpress/primitives';

/**
 * Block-internal icon for the Description List block. It follows the
 * stroke-based conventions of `@wordpress/icons` but is not part of the
 * public icon library.
 */
export default (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		style={ { fill: 'none' } }
		stroke="currentColor"
		strokeWidth="1.5"
	>
		<Path d="M12 16H20M4 8H20" strokeLinejoin="round" />
		<Path
			d="M6 17.25C6.69036 17.25 7.25 16.6904 7.25 16C7.25 15.3096 6.69036 14.75 6 14.75C5.30964 14.75 4.75 15.3096 4.75 16C4.75 16.6904 5.30964 17.25 6 17.25Z"
			fill="currentColor"
		/>
	</SVG>
);
