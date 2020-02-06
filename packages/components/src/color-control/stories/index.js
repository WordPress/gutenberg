/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import ColorControl from '../';

export default { title: 'Components/ColorControl', component: ColorControl };

export const _default = () => {
	return (
		<Wrapper>
			<ColorControl />
		</Wrapper>
	);
};

const Wrapper = styled.div`
	padding: 40px;
	margin-left: auto;
	width: 250px;
`;
