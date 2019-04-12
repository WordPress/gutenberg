/**
 * WordPress dependencies
 */
import { Icon, SVG, Path } from '@wordpress/components';

const GroupSVG = <SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<Path fillRule="evenodd" clipRule="evenodd" d="M10 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H10C8.9 16 8 15.1 8 14V6C8 4.9 8.9 4 10 4ZM10 14H18V6H10V14Z"
		fill="#000" />
	<Path d="M6 8C4.9 8 4 8.9 4 10V18C4 19.1 4.9 20 6 20H14C15.1 20 16 19.1 16 18H6V8Z"
		fill="#000" />
</SVG>;

export const Group = <Icon icon={ GroupSVG } />;
