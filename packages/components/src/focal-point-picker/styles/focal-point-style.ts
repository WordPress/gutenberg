/**
 * External dependencies
 */
import styled from '@emotion/styled';

export const FocalPointWrapper = styled.div`
	background-color: transparent;
	cursor: grab;
	height: 48px;
	margin: -24px 0 0 -24px;
	position: absolute;
	user-select: none;
	width: 48px;
	will-change: transform;
	z-index: 10000;

	${ ( { isDragging }: { isDragging: boolean } ) =>
		isDragging && 'cursor: grabbing;' }
`;

export const PointerCircle = styled.div`
	display: block;
	height: 100%;
	left: 0;
	position: absolute;
	top: 0;
	width: 100%;
	background: rgba( 255, 255, 255, 0.6 );
	border-radius: 50%;
	backdrop-filter: blur( 4px );
	box-shadow: rgb( 0 0 0 / 20% ) 0px 0px 10px;
`;
