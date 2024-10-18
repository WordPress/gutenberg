/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/components';

export const chevron = ( { width, height } ) => {
	return (
		<SVG
			width={ width || 24 }
			height={ height || 24 }
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M18.0041 10.5547L11.9996 16.0134L5.99512 10.5547L7.00413 9.44482L11.9996 13.9862L16.9951 9.44483L18.0041 10.5547Z"
				fill="currentColor"
			/>
		</SVG>
	);
};

export const plus = ( { width, height } ) => {
	return (
		<SVG
			width={ width || 24 }
			height={ height || 24 }
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z"
				fill="currentColor"
			/>
		</SVG>
	);
};

export const circlePlus = ( { width, height } ) => {
	return (
		<SVG
			width={ width || 24 }
			height={ height || 24 }
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20.75 12C20.75 16.8325 16.8325 20.75 12 20.75C7.16751 20.75 3.25 16.8325 3.25 12C3.25 7.16751 7.16751 3.25 12 3.25C16.8325 3.25 20.75 7.16751 20.75 12ZM12 19.25C16.0041 19.25 19.25 16.0041 19.25 12C19.25 7.99594 16.0041 4.75 12 4.75C7.99594 4.75 4.75 7.99594 4.75 12C4.75 16.0041 7.99594 19.25 12 19.25Z"
				fill="currentColor"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M11.25 12.75V17H12.75V12.75H17V11.25H12.75V7H11.25V11.25H7V12.75H11.25Z"
				fill="currentColor"
			/>
		</SVG>
	);
};

export const circleMinus = ( { width, height } ) => {
	return (
		<SVG
			width={ width || 24 }
			height={ height || 24 }
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20.75 12C20.75 16.8325 16.8325 20.75 12 20.75C7.16751 20.75 3.25 16.8325 3.25 12C3.25 7.16751 7.16751 3.25 12 3.25C16.8325 3.25 20.75 7.16751 20.75 12ZM12 19.25C16.0041 19.25 19.25 16.0041 19.25 12C19.25 7.99594 16.0041 4.75 12 4.75C7.99594 4.75 4.75 7.99594 4.75 12C4.75 16.0041 7.99594 19.25 12 19.25Z"
				fill="currentColor"
			/>
			<Path
				d="M17 12.75L7 12.75L7 11.25L17 11.25V12.75Z"
				fill="currentColor"
			/>
		</SVG>
	);
};

export const caret = ( { width, height } ) => {
	return (
		<SVG
			width={ width || 24 }
			height={ height || 24 }
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path d="M12 14.5L16.5 9.5L7.5 9.5L12 14.5Z" fill="currentColor" />
		</SVG>
	);
};

export const chevronRight = ( { width, height } ) => {
	return (
		<SVG
			width={ width || 24 }
			height={ height || 24 }
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9.82573 6.72441L15.2844 12.7289L9.82573 18.7334L8.71582 17.7244L13.2572 12.7289L8.71582 7.73342L9.82573 6.72441Z"
				fill="currentColor"
			/>
		</SVG>
	);
};
