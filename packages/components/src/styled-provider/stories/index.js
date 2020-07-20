/**
 * Internal dependencies
 */
import StyledProvider from '../';

/**
 * External dependencies
 */
import styled from '@emotion/styled';

const Hello = styled.div`
	color: var( --wp-admin-theme-color, black );
	font-family: var( --font-family );
`;

export default {
	title: 'Components/StyledProvider',
	component: StyledProvider,
};

export const _default = () => {
	return (
		<StyledProvider>
			<Hello>Hello</Hello>
		</StyledProvider>
	);
};
