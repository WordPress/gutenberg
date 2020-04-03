/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import BoxControl from '../';
import BoxControlIcon from '../icon';

export default { title: 'Components/BoxControl', component: BoxControl };

export const _default = () => {
	return (
		<Wrapper>
			<BoxControl />
		</Wrapper>
	);
};

export const icon = () => {
	return <BoxControlIcon />;
};

const Wrapper = styled.div`
	padding: 40px;
`;
