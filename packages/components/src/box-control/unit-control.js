/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( { label, value, ...props } ) {
	const isEmpty = value === '' || value === undefined;

	return (
		<UnitControlWrapper aria-label={ label }>
			<BaseUnitControl
				disableUnits={ isEmpty }
				hideHTMLArrows
				label={ label }
				isResetValueOnUnitChange={ false }
				value={ value }
				{ ...props }
			/>
		</UnitControlWrapper>
	);
}
