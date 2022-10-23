/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

// Used for the back button of the iOS Bottom Sheet
const chevronBack = (
	<SVG
		width="12"
		height="21"
		viewBox="0 0 12 21"
		xmlns="http://www.w3.org/2000/SVG"
	>
		<Path d="M9.62586 20.5975C9.89618 20.8579 10.2253 21 10.6014 21C11.3888 21 12 20.3844 12 19.6032C12 19.2125 11.8472 18.8574 11.5769 18.5851L3.34966 10.4882L11.5769 2.41488C11.8472 2.14262 12 1.77565 12 1.39684C12 0.615558 11.3888 0 10.6014 0C10.2253 0 9.89618 0.142052 9.63761 0.40248L0.493634 9.3991C0.164545 9.70688 0 10.0857 0 10.5C0 10.9143 0.164545 11.2694 0.48188 11.5891L9.62586 20.5975Z" />
	</SVG>
);

export default chevronBack;
