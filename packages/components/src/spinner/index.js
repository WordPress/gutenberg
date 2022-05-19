/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { StyledSpinner, SpinnerTrack, SpinnerIndicator } from './styles';

/**
 * @typedef OwnProps
 *
 * @property {string} [className] Class name
 */
/** @typedef {import('react').ComponentPropsWithoutRef<'svg'> & OwnProps} Props */

/**
 * @param {Props} props
 * @return {JSX.Element} Element
 */
export default function Spinner( { className, ...props } ) {
	return (
		<StyledSpinner
			className={ classNames( 'components-spinner', className ) }
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="presentation"
			focusable="false"
			{ ...props }
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
