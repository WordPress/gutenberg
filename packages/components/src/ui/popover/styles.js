/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';
/**
 * Internal dependencies
 */
import { CardBody } from '../card';

export const PopoverContent = css`
	${ ui.zIndex( 'Popover', 10000 ) };
	box-sizing: border-box;
	opacity: 0;
	outline: none;
	position: relative;
	transform-origin: center center;
	transition: opacity ${ ui.get( 'transitionDurationFastest' ) } linear;
	width: 100%;

	&[data-enter] {
		opacity: 1;
	}

	&::before,
	&::after {
		display: none;
	}
`;

export const cardStyle = css`
	${ CardBody.selector } {
		max-height: 80vh;
	}
`;
