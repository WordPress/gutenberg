/**
 * External dependencies
 */
import { cx } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import * as styles from './styles';

/** @typedef {import('@wp-g2/create-styles').ViewOwnProps<{}, 'div'>} Props */

/**
 * @param {Props} props
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
