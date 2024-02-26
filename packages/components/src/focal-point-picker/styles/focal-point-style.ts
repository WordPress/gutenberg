/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { reduceMotion } from '../../utils';

export const PointerCircle = styled.div`
	background-color: transparent;
	cursor: grab;
	height: 40px;
	margin: -20px 0 0 -20px;
	position: absolute;
	user-select: none;
	width: 40px;
	will-change: transform;
	z-index: 10000;
	background: rgba( 255, 255, 255, 0.4 );
	border: 1px solid rgba( 255, 255, 255, 0.4 );
	border-radius: 50%;
	backdrop-filter: blur( 16px ) saturate( 180% );
	box-shadow: rgb( 0 0 0 / 10% ) 0px 0px 8px;
	transition: transform 100ms linear;

	${ reduceMotion( 'transition' ) }

	${ ( { isDragging }: { isDragging: boolean } ) =>
		isDragging &&
		`
			box-shadow: rgb( 0 0 0 / 12% ) 0px 0px 10px;
			transform: scale( 1.1 );
			cursor: grabbing;
			` }
`;
