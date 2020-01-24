/**
 * Internal dependencies
 */
import { Mark, MarkLabel } from './styles/range-control-styles';

export default function RangeMark( { isFilled = false, label, left, style = {}, ...props } ) {
	const styles = {
		...style,
		left,
	};

	return (
		<>
			<Mark { ...props } aria-hidden="true" isFilled={ isFilled } style={ styles } />
			{ label && (
				<MarkLabel aria-hidden="true" style={ styles }>{ label }</MarkLabel>
			) }
		</>
	);
}
