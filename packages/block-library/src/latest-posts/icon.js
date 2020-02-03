/**
 * WordPress dependencies
 */
import { Path, Rect, SVG } from '@wordpress/components';

export default (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M0,0h24v24H0V0z" fill="none" />
		<Rect x="11" y="7" width="6" height="2" />
		<Rect x="11" y="11" width="6" height="2" />
		<Rect x="11" y="15" width="6" height="2" />
		<Rect x="7" y="7" width="2" height="2" />
		<Rect x="7" y="11" width="2" height="2" />
		<Rect x="7" y="15" width="2" height="2" />
		<Path d="M20.1,3H3.9C3.4,3,3,3.4,3,3.9v16.2C3,20.5,3.4,21,3.9,21h16.2c0.4,0,0.9-0.5,0.9-0.9V3.9C21,3.4,20.5,3,20.1,3z M19,19H5V5h14V19z" />
	</SVG>
);
