/**
 * WordPress dependencies
 */
import { SVG, Path, Rect, G } from '@wordpress/primitives';

export const text = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="m19 7-3-3-8.5 8.5-1 4 4-1L19 7Zm-7 11.5H5V20h7v-1.5Z" />
	</SVG>
);

export const textarea = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="m9.99609 14v-.2251l.00391.0001v6.225h1.5v-14.5h2.5v14.5h1.5v-14.5h3v-1.5h-8.50391c-2.76142 0-5 2.23858-5 5 0 2.7614 2.23858 5 5 5z" />
	</SVG>
);

export const checkbox = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
		<Rect x="0" fill="none" width="20" height="20" />
		<G>
			<Path d="M2 2h7v7H2V2zm9 0v7h7V2h-7zM5.5 4.5L7 3H4zM12 8V3h5v5h-5zM4.5 5.5L3 4v3zM8 4L6.5 5.5 8 7V4zM5.5 6.5L4 8h3zM9 18v-7H2v7h7zm9 0h-7v-7h7v7zM8 12v5H3v-5h5zm6.5 1.5L16 12h-3zM12 16l1.5-1.5L12 13v3zm3.5-1.5L17 16v-3zm-1 1L13 17h3z" />
		</G>
	</SVG>
);

export const hash = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M4.0,10.0 A1.0,1.0 0 0 1 4.0,8.0 L20.0,8.0 A1.0,1.0 0 0 1 20.0,10.0 Z" />
		<Path d="M4.0,16.0 A1.0,1.0 0 0 1 4.0,14.0 L20.0,14.0 A1.0,1.0 0 0 1 20.0,16.0 Z" />
		<Path d="M9.0,2.9 A1.0,1.0 0 0 1 11.0,3.1 L9.0,21.1 A1.0,1.0 0 0 1 7.0,20.9 Z" />
		<Path d="M15.0,2.9 A1.0,1.0 0 0 1 17.0,3.1 L15.0,21.1 A1.0,1.0 0 0 1 13.0,20.9 Z" />
	</SVG>
);
