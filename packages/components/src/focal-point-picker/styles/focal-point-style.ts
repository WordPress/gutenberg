/**
 * External dependencies
 */
import styled from '@emotion/styled';

export const PointerCircle = styled.div`
	background-color: transparent;
	cursor: grab;
	height: 48px;
	margin: -24px 0 0 -24px;
	position: absolute;
	user-select: none;
	width: 48px;
	will-change: transform;
	z-index: 10000;
	background: rgba( 255, 255, 255, 0.6 );
	border-radius: 50%;
	backdrop-filter: blur( 4px );
	box-shadow: rgb( 0 0 0 / 20% ) 0px 0px 10px;

	${ ( { isDragging }: { isDragging: boolean } ) =>
		isDragging && 'cursor: grabbing;' }
`;
