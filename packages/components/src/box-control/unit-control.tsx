/**
 * External dependencies
 */
import { useHover } from '@use-gesture/react';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import UnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';
import type { BoxUnitControlProps } from './types';

const noop = () => {};

export default function BoxUnitControl( {
	onHoverOn = noop,
	onHoverOff = noop,
	label,
	value,
	...props
}: BoxUnitControlProps ) {
	const bindHoverGesture = useHover( ( { event, ...state } ) => {
		if ( state.hovering ) {
			onHoverOn( event, state );
		} else {
			onHoverOff( event, state );
		}
	} );

	return (
		<UnitControlWrapper { ...bindHoverGesture() }>
			<Tooltip placement="top" text={ label }>
				<UnitControl
					aria-label={ label }
					className="component-box-control__unit-control"
					isPressEnterToChange
					isResetValueOnUnitChange={ false }
					value={ value }
					{ ...props }
				/>
			</Tooltip>
		</UnitControlWrapper>
	);
}
