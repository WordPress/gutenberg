import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';

export function UnforwardedSpinner(
	{ className, ...props }: WordPressComponentProps< {}, 'svg', false >,
	forwardedRef: ForwardedRef< any >
) {
	return (
		<svg
			className={ clsx(
				'components-spinner',
				styles.spinner,
				className
			) }
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
			<circle
				className={ styles.track }
				cx="50"
				cy="50"
				r="50"
				vectorEffect="non-scaling-stroke"
			/>

			{ /* Theme-colored arc */ }
			<path
				className={ styles.indicator }
				d="m 50 0 a 50 50 0 0 1 50 50"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}
/**
 * `Spinner` is a component used to notify users that their action is being processed.
 *
 * ```jsx
 * import { Spinner } from '@wordpress/components';
 *
 * function Example() {
 * 	return <Spinner />;
 * }
 * ```
 */
export const Spinner = forwardRef( UnforwardedSpinner );
Spinner.displayName = 'Spinner';
export default Spinner;
