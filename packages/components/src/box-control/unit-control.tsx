/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import UnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';
import type { BoxUnitControlProps } from './types';

export default function BoxUnitControl( {
	label,
	value,
	...props
}: BoxUnitControlProps ) {
	return (
		<UnitControlWrapper>
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
