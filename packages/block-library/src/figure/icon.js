/**
 * WordPress dependencies
 */
import { SVG, Rect, Path, Circle } from '@wordpress/components';

const figureIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect
			x="2.5"
			y="2.5"
			width="19"
			height="19"
			rx="2"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<Rect x="6" y="6.5" width="9" height="1.5" rx="0.5" />
		<Rect x="6" y="10" width="12" height="5.5" rx="1" />
		<ellipse cx="8" cy="18" rx="1.2" ry="1" />
		<ellipse cx="12" cy="18" rx="1.2" ry="1" />
		<ellipse cx="16" cy="18" rx="1.2" ry="1" />
	</SVG>
);

export const captionBottomIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="4" y="5" width="16" height="10.5" rx="1" />
		<ellipse cx="7" cy="21" rx="2" ry="1.5" />
		<ellipse cx="12" cy="21" rx="2" ry="1.5" />
		<ellipse cx="17" cy="21" rx="2" ry="1.5" />
	</SVG>
);

export const captionTopIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<ellipse cx="7" cy="5" rx="2" ry="1.5" />
		<ellipse cx="12" cy="5" rx="2" ry="1.5" />
		<ellipse cx="17" cy="5" rx="2" ry="1.5" />
		<Rect
			x="4"
			y="9.5"
			width="16"
			height="10.5"
			fill="currentColor"
			rx="1"
		/>
	</SVG>
);

export const beforeAfterIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Path d="M9 12h14v24H9zM25 12h14v24H25z" />
	</SVG>
);

export const dataSetIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Rect x="9" y="9" width="30" height="14" rx="2" />
		<Path d="M9 27h30v4H9zM9 33h30v4H9zM9 39h30v4H9z" />
	</SVG>
);

export const codeConsoleIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Rect x="9" y="9" width="30" height="12" rx="2" />
		<Rect x="9" y="25" width="30" height="14" rx="2" />
		<Path d="M13 29h6v2h-6z" fill="#fff" />
	</SVG>
);

export const multimediaIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Rect x="9" y="9" width="30" height="16" rx="2" />
		<Path d="M21 13l8 4.5-8 4.5v-9z" fill="#fff" />
		<Path d="M15 31h24v3H15zM15 37h18v3H15z" />
		<Circle cx="11" cy="32.5" r="2" />
		<Circle cx="11" cy="38.5" r="2" />
	</SVG>
);

export const documentIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
		<Path d="M15 10v28h18V18l-8-8h-10z" />
		<Rect x="19" y="22" width="10" height="3" fill="#fff" />
		<Rect x="19" y="27" width="10" height="3" fill="#fff" />
		<Rect x="19" y="32" width="6" height="3" fill="#fff" />
	</SVG>
);

export default figureIcon;
