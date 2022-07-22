/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { COLORS } from '../../utils';
import { HStack } from '../../h-stack';
import { Heading } from '../../heading';

export const Nav = styled( HStack )``;

export const NavButton = styled( Button )``;

export const NavHeading = styled( Heading )``;

export const Calendar = styled.div`
	display: grid;
	grid-template-columns: repeat( 7, 1fr );
`;

export const DayOfWeek = styled.div``;

export const Week = styled.div``;

export const DayButton = styled( Button )< {
	column: number;
	hasEvents: boolean;
} >`
	grid-column: ${ ( props ) => props.column };

	// height: 100%;
	// position: relative;

	${ ( props ) =>
		props.hasEvents &&
		`
		// ::before {
		// 	background: var(--wp-admin-theme-color);
		// 	border-radius: 2px;
		// 	bottom: 0;
		// 	content: " ";
		// 	height: 4px;
		// 	left: 50%;
		// 	margin-left: -2px;
		// 	position: absolute;
		// 	width: 4px;

		// 	.CalendarDay__selected & {
		// 		background: ${ COLORS.white };
		// 	}
		// }
		` }
`;

// const baseNavButton = css`
// 	position: absolute;
// 	top: 15px;
// `;

// export const NavPrevButton = styled( Button )`
// 	${ baseNavButton }
// 	left: 0;
// `;

// export const NavNextButton = styled( Button )`
// 	${ baseNavButton }
// 	right: 0;
// `;
