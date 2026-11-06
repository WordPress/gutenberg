import { Path, SVG } from '@wordpress/components';

/**
 * A letter struck through, as a word processor marks clearing formatting.
 * Gutenberg has no such icon, so it is drawn here in the same manner as the
 * ones it does have.
 */
export default (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		style={ { fill: 'none' } }
		stroke="currentColor"
		strokeWidth="1.5"
	>
		<Path d="M8.5 7.25H16.5M12.5 7.25V16.75" />
		<Path d="M5.75 18.25L18.25 5.75" />
	</SVG>
);
