/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( { label, style, value, ...props } ) {
	const styles = {
		position: 'absolute',
		zIndex: 1,
		maxWidth: 60,
		...style,
	};

	return (
		<UnitControlWrapper aria-label={ label }>
			<BaseUnitControl
				hideLabelFromVision
				hideHTMLArrows
				label={ label }
				isResetValueOnUnitChange={ false }
				size="small"
				style={ styles }
				value={ value }
				{ ...props }
			/>
		</UnitControlWrapper>
	);
}
