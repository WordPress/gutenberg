/**
 * Internal dependencies
 */
import BaseUnitControl from '../unit-control';
import Tooltip from '../tooltip';
import { UnitControlWrapper } from './styles/box-control-styles';

export default function BoxUnitControl( {
	isInline,
	label,
	style,
	value,
	...props
} ) {
	const styles = isInline
		? {}
		: {
				marginTop: -3,
				maxWidth: 80,
				position: 'absolute',
				width: '100%',
				zIndex: 1,
				...style,
		  };

	const TooltipComponent = isInline ? Tooltip : 'div';
	return (
		<UnitControlWrapper aria-label={ label }>
			<TooltipComponent text={ label } position="top">
				<BaseUnitControl
					className="component-box-control__unit-control"
					hideHTMLArrows
					isPressEnterToChange
					isFloatingLabel
					label={ ! isInline ? label : null }
					isResetValueOnUnitChange={ false }
					style={ styles }
					value={ value }
					{ ...props }
				/>
			</TooltipComponent>
		</UnitControlWrapper>
	);
}
