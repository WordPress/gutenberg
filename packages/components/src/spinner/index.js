/**
 * Internal dependencies
 */
import { StyledSpinner, SpinnerIndicator } from './styles';

export default function Spinner() {
	return (
		<StyledSpinner
			className="components-spinner"
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="presentation"
			focusable="false"
		>
			<SpinnerIndicator
				cx="50%"
				cy="50%"
				r="50"
				vectorEffect="non-scaling-stroke"
			/>
		</StyledSpinner>
	);
}
