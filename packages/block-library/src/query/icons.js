/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

export const titleDate = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 30">
		<Path d="M34 0H0v3h34V0zM12 5H0v1h12V5zM0 17h12v1H0v-1zm34-5H0v3h34v-3zM0 29h12v1H0v-1zm34-5H0v3h34v-3z" />
	</SVG>
);

export const titleExcerpt = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 30">
		<Path d="M34 0H0v3h34V0zm-4 5H0v1h30V5zm4 3H0v1h34V8zM0 11h30v1H0v-1zm0 12h30v1H0v-1zm34 3H0v1h34v-1zM0 29h30v1H0v-1zm34-11H0v3h34v-3z" />
	</SVG>
);

export const titleDateExcerpt = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 30">
		<Path d="M34 0H0v3h34V0zM12 5H0v1h12V5zm22 3H0v1h34V8zM0 11h34v1H0v-1zm0 12h12v1H0v-1zm34 3H0v1h34v-1zM0 29h34v1H0v-1zm34-11H0v3h34v-3z" />
	</SVG>
);

export const titleContent = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 30">
		<Path d="M0 5h30v1H0zM0 17h30v1H0zM0 11h30v1H0zM0 23h30v1H0zM0 8h34v1H0zM0 20h34v1H0zM0 14h34v1H0zM0 26h34v1H0zM0 29h34v1H0zM0 0h34v3H0z" />
	</SVG>
);

export default { titleDate, titleExcerpt, titleDateExcerpt, titleContent };
