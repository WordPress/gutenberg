/**
 * External dependencies
 */
import { useHover } from '@use-gesture/react';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import { UnitControlWrapper, UnitControl } from './styles/box-control-styles';
import type { BoxUnitControlProps } from './types';

const noop = () => {};

export default function BoxUnitControl( {
	isFirst,
	isLast,
	isOnly,
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
					isFirst={ isFirst }
					isLast={ isLast }
					isOnly={ isOnly }
					isPressEnterToChange
					isResetValueOnUnitChange={ false }
					value={ value }
					{ ...props }
				/>
			</Tooltip>
		</UnitControlWrapper>
	);
}
