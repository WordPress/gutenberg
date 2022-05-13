/**
 * External dependencies
 */
import styled from '@emotion/styled';

// Styles that overrides the calendar styling provided by react-dates goes in
// style.scss. Everything else goes here.

type DayProps = {
	hasEvents: boolean;
};

export const Day = styled.div< DayProps >`
	align-content: center;
	display: flex;
	flex-direction: column;
	height: 100%;
	justify-content: center;
	position: relative;

	${ ( props ) =>
		props.hasEvents &&
		`
		::before {
			background: var(--wp-admin-theme-color);
			border-radius: 2px;
			bottom: 0;
			content: " ";
			height: 4px;
			left: 50%;
			margin-left: -2px;
			position: absolute;
			width: 4px;
		}
		` }
`;
