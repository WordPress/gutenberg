/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { cx } from '@emotion/css';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import * as styles from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../../divider').DividerProps, 'hr', false>} props
 */
export function useCardDivider( props ) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'CardDivider'
	);

	const classes = useMemo(
		() =>
			cx(
				styles.Divider,
				styles.borderColor,
				// This classname is added for legacy compatibility reasons.
				'components-card__divider',
				className
			),
		[ className ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
