/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useHover } from 'react-use-gesture';

/**
 * Internal dependencies
 */
import BaseTooltip from '../tooltip';
import { UnitControlWrapper, UnitControl } from './styles/box-control-styles';

export default function BoxUnitControl( {
	isFirst,
	isLast,
	isOnly,
	onHoverOn = noop,
	onHoverOff = noop,
	label,
	value,
	...props
} ) {
	const bindHoverGesture = useHover( ( { event, ...state } ) => {
		if ( state.hovering ) {
			onHoverOn( event, state );
		} else {
			onHoverOff( event, state );
		}
	} );

	return (
		<UnitControlWrapper aria-label={ label } { ...bindHoverGesture() }>
			<Tooltip text={ label }>
				<UnitControl
					className="component-box-control__unit-control"
					hideHTMLArrows
					isFirst={ isFirst }
					isLast={ isLast }
					isOnly={ isOnly }
					isPressEnterToChange
					isFloatingLabel
					isResetValueOnUnitChange={ false }
					value={ value }
					{ ...props }
				/>
			</Tooltip>
		</UnitControlWrapper>
	);
}

function Tooltip( { children, text } ) {
	if ( ! text ) return children;

	return (
		<BaseTooltip text={ text } position="top">
			{ children }
		</BaseTooltip>
	);
}
