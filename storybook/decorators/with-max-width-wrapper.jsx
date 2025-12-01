/**
 * External dependencies
 */
import styled from '@emotion/styled';

const maxWidthWrapperMap = {
	none: 0,
	'wordpress-sidebar': 248,
	'small-container': 600,
	'large-container': 960,
};

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
	/**
	 * A Storybook decorator to wrap a story in a div applying a max width.
	 * This can be used to simulate real world constraints on components
	 * such as being located within the WordPress editor sidebars.
	 */
	const maxWidth = maxWidthWrapperMap[ context.globals.maxWidthWrapper ];
	if ( ! maxWidth ) {
		return <Story { ...context } />;
	}
	return (
		<div style={ { maxWidth } }>
			<Story { ...context } />
			<Indicator>{ `Max-Width Wrapper - ${ maxWidth }px` }</Indicator>
		</div>
	);
};
