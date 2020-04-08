/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( { onChange, label, ...props } ) {
	const handleOnChange = ( nextValue ) => {
		const value = parseFloat( nextValue );
		onChange( isNaN( value ) ? nextValue : value );
	};

	return (
		<UnitControlWrapper aria-label={ label }>
			<BaseUnitControl
				label={ label }
				isResetValueOnUnitChange={ false }
				onChange={ handleOnChange }
				{ ...props }
			/>
		</UnitControlWrapper>
	);
}
