/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * A Storybook decorator to wrap a story in a div applying a max width and
 * padding. This can be used to simulate real world constraints on components
 * such as being located within the WordPress editor sidebars.
 */

const Wrapper = styled.div`
	max-width: 248px;
`;

const Indicator = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 32px;
	background: #e0e0e0;
	text-transform: uppercase;
	font-size: 11px;
	font-weight: 500;
	color: #757575;
	margin-top: 24px;
`;

export const WithMaxWidthWrapper = ( Story, context ) => {
	if ( context.globals.maxWidthWrapper === 'none' ) {
		return <Story { ...context } />;
	}

	return (
		<Wrapper>
			<Story { ...context } />
			<Indicator>Max-Width Wrapper - 248px</Indicator>
		</Wrapper>
	);
};
