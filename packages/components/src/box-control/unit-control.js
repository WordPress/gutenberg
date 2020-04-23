/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( { label, style, value, ...props } ) {
	const styles = {
		marginTop: -2,
		maxWidth: 70,
		position: 'absolute',
		zIndex: 1,
		...style,
	};

	return (
		<UnitControlWrapper aria-label={ label }>
			<BaseUnitControl
				className="component-box-control__unit-control"
				hideHTMLArrows
				isFloatingLabel
				label={ label }
				isResetValueOnUnitChange={ false }
				placeholder={ 0 }
				size="small"
				style={ styles }
				value={ value }
				{ ...props }
			/>
		</UnitControlWrapper>
	);
}
