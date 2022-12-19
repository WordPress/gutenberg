/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { StyledSpinner, SpinnerTrack, SpinnerIndicator } from './styles';
import type { WordPressComponentProps } from '../ui/context';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function UnforwardedSpinner(
	{ className, ...props }: WordPressComponentProps< {}, 'svg', false >,
	forwardedRef: ForwardedRef< any >
) {
	return (
		<StyledSpinner
			className={ classNames( 'components-spinner', className ) }
			viewBox="0 0 100 100"
			width="16"
			height="16"
			xmlns="http://www.w3.org/2000/svg"
			role="presentation"
			focusable="false"
			{ ...props }
			ref={ forwardedRef }
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
/**
 * `Spinner` is a component used to notify users that their action is being processed.
 *
 * @example
 * ```js
 *   import { Spinner } from '@wordpress/components';
 *
 *   function Example() {
 *     return <Spinner />;
 *   }
 * ```
 */
export const Spinner = forwardRef( UnforwardedSpinner );
export default Spinner;
