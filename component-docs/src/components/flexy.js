/**
 * External dependencies
 */
import styled from 'styled-components';

const alignProps = {
	top: 'flex-start',
	center: 'center',
	middle: 'center',
	bottom: 'flex-end',
};

const Flexy = styled.div`
	display: flex;
	justify-content: space-between;
	width: 100%;

	${ ( { align } ) => `
		align-items: ${ alignProps[ align ] };
	` }

	& > * {
		margin-right: 8px;

		&:last-child {
			margin-right: 0;
		}
	}
`;

Flexy.defaultProps = {
	align: 'center',
};

const Item = styled.div`
	min-width: 0;
	min-height: 0;
`;

const Block = styled.div`
	min-width: 0;
	min-height: 0;
	flex: 1;
`;

Flexy.Item = Item;
Flexy.Block = Block;

export default Flexy;
