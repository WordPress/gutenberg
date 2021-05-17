/**
 * External dependencies
 */
import { cx } from '@emotion/css';

/**
 * Internal dependencies
 */
import * as styles from './styles';

/**
 * @param {import('../ui/context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 */
export function useVisuallyHidden( { className, ...props } ) {
	// circumvent the context system and write the classnames ourselves
	const classes = cx(
		'components-visually-hidden',
		className,
		styles.VisuallyHidden
	);

	return {
		className: classes,
		...props,
	};
}
