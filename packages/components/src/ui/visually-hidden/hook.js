/**
 * External dependencies
 */
import { cx } from 'emotion';

/**
 * Internal dependencies
 */
import * as styles from './styles';

// duplicate this for the sake of being able to export it, it'll be removed when we replace VisuallyHidden in components/src anyway
/** @typedef {import('../context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} Props */

/**
 * @param {import('../context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 */
export function useVisuallyHidden( { className, ...props } ) {
	// circumvent the context system and write the classnames ourselves
	const classes = cx(
		'components-visually-hidden wp-components-visually-hidden',
		className,
		styles.VisuallyHidden
	);

	return {
		className: classes,
		...props,
	};
}
