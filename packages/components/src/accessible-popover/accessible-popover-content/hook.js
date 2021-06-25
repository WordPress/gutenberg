/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css, cx } from '@emotion/css';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import * as styles from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').ContentProps, 'div'>} props
 */
export function useAccessiblePopoverContent( props ) {
	const {
		className,
		elevation = 5,
		maxWidth = 360,
		...otherProps
	} = useContextSystem( props, 'AccessiblePopoverContent' );

	const classes = cx(
		styles.AccessiblePopoverContent,
		css( { maxWidth } ),
		className
	);

	return {
		...otherProps,
		elevation,
		classes,
	};
}
