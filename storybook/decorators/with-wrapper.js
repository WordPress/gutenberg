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
	padding: 16px;
`;

export const WithWrapper = ( Story, context ) => {
	if ( context.globals.wrapper === 'none' ) {
		return <Story { ...context } />;
	}

	return (
		<>
			<Wrapper>
				<Story { ...context } />
			</Wrapper>
		</>
	);
};
