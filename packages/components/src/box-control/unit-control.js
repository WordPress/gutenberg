/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( { label, value, ...props } ) {
	return (
		<UnitControlWrapper aria-label={ label }>
			<BaseUnitControl
				hideLabelFromVision
				hideHTMLArrows
				label={ label }
				isResetValueOnUnitChange={ false }
				value={ value }
				{ ...props }
			/>
		</UnitControlWrapper>
	);
}
