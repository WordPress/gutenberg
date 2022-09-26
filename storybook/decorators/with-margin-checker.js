/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 *  A Storybook decorator to show a div before and after the story to check for unwanted margins.
 */

const Bumper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 32px;
	background-image: repeating-linear-gradient(
		45deg,
		transparent,
		transparent 2px,
		#e0e0e0 2px,
		#e0e0e0 14px
	);
	text-transform: uppercase;
	font-size: 11px;
	font-weight: 500;
	color: #757575;
`;

export const WithMarginChecker = ( Story, context ) => {
	if ( context.globals.marginChecker === 'hide' ) {
		return <Story { ...context } />;
	}

	return (
		<>
			<Bumper>Margin Checker</Bumper>
			<Story { ...context } />
			<Bumper>Margin Checker</Bumper>
		</>
	);
};
