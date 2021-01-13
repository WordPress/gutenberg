/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const justifyLeftIcon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M9 9v6h11V9H9zM4 20h1.5V4H4v16z" />
	</SVG>
);

export const justifyCenterIcon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M20 9h-7.2V4h-1.6v5H4v6h7.2v5h1.6v-5H20z" />
	</SVG>
);

export const justifyRightIcon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M4 15h11V9H4v6zM18.5 4v16H20V4h-1.5z" />
	</SVG>
);

export const justifySpaceBetweenIcon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M9 15h6V9H9v6zm-5 5h1.5V4H4v16zM18.5 4v16H20V4h-1.5z" />
	</SVG>
);
