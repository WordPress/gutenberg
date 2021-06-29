/**
 * External dependencies
 */
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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').HeaderProps, 'div'>} props
 */
export function useCardHeader( props ) {
	const {
		className,
		isBorderless = false,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardHeader' );

	const classes = useMemo(
		() =>
			cx(
				styles.Header,
				styles.borderRadius,
				styles.borderColor,
				styles.cardPaddings[ size ],
				isBorderless && styles.borderless,
				isShady && styles.shady,
				// This classname is added for legacy compatibility reasons.
				'components-card__header',
				className
			),
		[ className, isBorderless, isShady, size ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
