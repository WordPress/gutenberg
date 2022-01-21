/**
 * Internal dependencies
 */
import { StyledSpinner, SpinnerTrack, SpinnerIndicator } from './styles';

export default function Spinner() {
	return (
		<StyledSpinner
			className="components-spinner"
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="presentation"
			focusable="false"
		>
			{ /* Gray circular background */ }
			<SpinnerTrack
				cx="50"
				cy="50"
				r="50"
				vectorEffect="non-scaling-stroke"
			/>

			{ /* Theme-colored arc */ }
			<SpinnerIndicator
				d="m 50 0 a 50 50 0 0 1 50 50"
				vectorEffect="non-scaling-stroke"
			/>
		</StyledSpinner>
	);
}
