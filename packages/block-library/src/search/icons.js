/**
 * WordPress dependencies
 */
import { Path, SVG, Rect, Circle } from '@wordpress/components';

export const buttonOnly = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="8" y="10" width="8" height="4" rx="1" />
	</SVG>
);

export const buttonOutside = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx="19" cy="12" r="2" />
		<Path d="M9.32263 7.50024H12.0001C13.6569 7.50024 15.0001 8.84339 15.0001 10.5002V13.3891C15.0001 15.046 13.6569 16.3891 12.0001 16.3891H9.32263" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
		<Path d="M9.67743 16.3889L7.00001 16.3889C5.34316 16.3889 4.00001 15.0458 4.00001 13.3889L4.00001 10.5C4.00001 8.84317 5.34316 7.50003 7.00001 7.50003L9.67743 7.50003" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
	</SVG>
);

export const buttonInside = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx="16" cy="12" r="2" />
		<Path d="M15 7.50024H17.3333C18.9902 7.50024 20.3333 8.84339 20.3333 10.5002V13.3891C20.3333 15.046 18.9902 16.3891 17.3333 16.3891H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
		<Path d="M9.33331 16.3889L6.99998 16.3889C5.34313 16.3889 3.99998 15.0458 3.99998 13.3889L3.99998 10.5C3.99998 8.84317 5.34312 7.50003 6.99998 7.50003L9.33331 7.50003" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
		<Rect x="9" y="6.75" width="6" height="1.5" />
		<Rect x="9" y="15.65" width="6" height="1.5" />
	</SVG>
);

export const noButton = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M15 7.50024H17.3333C18.9902 7.50024 20.3333 8.84339 20.3333 10.5002V13.3891C20.3333 15.046 18.9902 16.3891 17.3333 16.3891H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none"/>
		<Path d="M9.33337 16.3889L7.00004 16.3889C5.34319 16.3889 4.00004 15.0458 4.00004 13.3889L4.00004 10.5C4.00004 8.84317 5.34319 7.50003 7.00004 7.50003L9.33337 7.50003" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
		<Rect x="9" y="6.75" width="6" height="1.5" />
		<Rect x="9" y="15.65" width="6" height="1.5" />
	</SVG>
);

export const buttonWithIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M8 7.75H16C16.6904 7.75 17.25 8.30964 17.25 9V16C17.25 16.6904 16.6904 17.25 16 17.25H8C7.30964 17.25 6.75 16.6904 6.75 16V9C6.75 8.30964 7.30964 7.75 8 7.75Z" stroke="currentColor" stroke-width="1.5" fill="none" />
		<Path fill-rule="evenodd" clip-rule="evenodd" d="M14 12.5C14 13.3284 13.3284 14 12.5 14H11.5C10.6716 14 10 13.3284 10 12.5C10 11.6716 10.6716 11 11.5 11H12.5C13.3284 11 14 11.6716 14 12.5Z" fill="currentColor" />
	</SVG>
);

export const toggleLabel = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M15 9.50024H17.3333C18.9902 9.50024 20.3333 10.8434 20.3333 12.5002V15.3891C20.3333 17.046 18.9902 18.3891 17.3333 18.3891H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
		<Path d="M9.33333 18.3889L7 18.3889C5.34315 18.3889 4 17.0458 4 15.3889L4 12.5C4 10.8432 5.34315 9.50003 7 9.50003L9.33333 9.50003" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" />
		<Rect x="9" y="8.75" width="6" height="1.5" />
		<Rect x="4" y="5" width="11" height="1.5" />
		<Rect x="9" y="17.65" width="6" height="1.5" />
	</SVG>
);
