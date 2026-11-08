import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { Spinner as UISpinner } from '@wordpress/ui';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';

export function UnforwardedSpinner(
	{ className, ...props }: WordPressComponentProps< {}, 'svg', false >,
	forwardedRef: ForwardedRef< any >
) {
	return (
		<UISpinner
			className={ clsx(
				'components-spinner',
				styles.spinner,
				className
			) }
			width="16"
			height="16"
			{ ...props }
			ref={ forwardedRef }
		/>
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
