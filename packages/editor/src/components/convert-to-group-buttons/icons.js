/**
 * WordPress dependencies
 */
import { Icon, SVG, Path } from '@wordpress/components';

const GroupSVG = (
	<SVG
		width="20"
		height="20"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M8 5a1 1 0 0 0-1 1v3H6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3h1a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H8zm3 6H7v2h4v-2zM9 9V7h4v2H9z"
		/>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M1 3a2 2 0 0 0 1 1.732v10.536A2 2 0 1 0 4.732 18h10.536A2 2 0 1 0 18 15.268V4.732A2 2 0 1 0 15.268 2H4.732A2 2 0 0 0 1 3zm14.268 1H4.732A2.01 2.01 0 0 1 4 4.732v10.536c.304.175.557.428.732.732h10.536a2.01 2.01 0 0 1 .732-.732V4.732A2.01 2.01 0 0 1 15.268 4z"
		/>
	</SVG>
);

export const Group = <Icon icon={ GroupSVG } />;

const UngroupSVG = (
	<SVG
		width="20"
		height="20"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M9 2H15C16.1 2 17 2.9 17 4V7C17 8.1 16.1 9 15 9H9C7.9 9 7 8.1 7 7V4C7 2.9 7.9 2 9 2ZM9 7H15V4H9V7Z"
		/>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M5 11H11C12.1 11 13 11.9 13 13V16C13 17.1 12.1 18 11 18H5C3.9 18 3 17.1 3 16V13C3 11.9 3.9 11 5 11ZM5 16H11V13H5V16Z"
		/>
	</SVG>
);

export const Ungroup = <Icon icon={ UngroupSVG } />;
