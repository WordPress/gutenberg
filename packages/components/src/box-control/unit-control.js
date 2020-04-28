/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( { label, style, value, ...props } ) {
	const styles = {
		marginTop: -3,
		maxWidth: 80,
		position: 'absolute',
		width: '100%',
		zIndex: 1,
		...style,
	};

	return (
		<UnitControlWrapper aria-label={ label }>
			<BaseUnitControl
				className="component-box-control__unit-control"
				hideHTMLArrows
				isPressEnterToChange
				isFloatingLabel
				label={ label }
				isResetValueOnUnitChange={ false }
				style={ styles }
				value={ value }
				{ ...props }
			/>
		</UnitControlWrapper>
	);
}
