/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const ErrorIcon = ( { size = 20 } ) => (
  <SVG
    aria-hidden
    role="img"
    focusable="false"
    className={ 'warning-indicator' }
    xmlns="http://www.w3.org/2000/svg"
    width={ size }
    height={ size }
    viewBox="0 0 20 20">
		<Path { ...styles.errorIconBorder } d="m 10,2 c 4.42,0 8,3.58 8,8 0,4.42 -3.58,8 -8,8 C 5.58,18 2,14.42 2,10 2,5.58 5.58,2 10,2 Z" />
		<Path { ...styles.errorIconInner } d="m 10,4 c 3.315,0 6,2.685 6,6 0,3.315 -2.685,6 -6,6 C 6.685,16 4,13.315 4,10 4,6.685 6.685,4 10,4 Z" />
		<Path { ...styles.errorIconOuter } d="m 10,3 c 3.8675,0 7,3.1325 7,7 0,3.8675 -3.1325,7 -7,7 C 6.1325,17 3,13.8675 3,10 3,6.1325 6.1325,3 10,3 Z m 0.98875,8.2075 0.30625,-5.6525 -2.59,0 0.30625,5.6525 1.9775,0 z m -0.07874,2.94 c 0.21,-0.20125 0.32375,-0.48125 0.32375,-0.84 0,-0.3675 -0.105,-0.6475 -0.315,-0.84875 -0.21,-0.20125 -0.51625,-0.30625 -0.9275003,-0.30625 -0.41125,0 -0.7175,0.105 -0.93625,0.30625 C 8.83625,12.66 8.73125,12.94 8.73125,13.3075 c 0,0.35875 0.11375,0.63875 0.3325,0.84 0.2275,0.20125 0.53375,0.2975 0.9275,0.2975 0.39375,0 0.7,-0.09625 0.91875,-0.2975 z" />
	</SVG>
);

export default ErrorIcon;
