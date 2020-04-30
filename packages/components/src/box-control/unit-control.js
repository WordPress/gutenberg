/**
 * Internal dependencies
 */
import BaseTooltip from '../tooltip';
import { UnitControlWrapper, UnitControl } from './styles/box-control-styles';

export default function BoxUnitControl( {
	isFirst,
	isLast,
	isOnly,
	label,
	value,
	...props
} ) {
	return (
		<UnitControlWrapper aria-label={ label }>
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
