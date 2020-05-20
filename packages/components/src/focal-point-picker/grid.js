/**
 * Internal dependencies
 */
import {
	GridView,
	GridLineX,
	GridLineY,
} from './styles/focal-point-picker-style';

export default function FocalPointPickerGrid( props ) {
	return (
		<GridView { ...props }>
			<GridLineX style={ { top: '33%' } } />
			<GridLineX style={ { top: '66%' } } />
			<GridLineY style={ { left: '33%' } } />
			<GridLineY style={ { left: '66%' } } />
		</GridView>
	);
}
