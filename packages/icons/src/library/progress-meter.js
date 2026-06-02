/**
 * WordPress dependencies
 */
import { G, Path, SVG } from '@wordpress/primitives';

const progressMeter = (
	<SVG
		x="0px"
		y="0px"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<G>
			<Path d="M13,14H0v6h13h11v-6H13z M22,18H12v-2h10V18z"></Path>
		</G>
		<Path d="M12,12l4-2V4H8v6 M14,9l-2,1l-2-1V6h4V9z"></Path>
	</SVG>
);

export default progressMeter;
