/**
 * External dependencies
 */
import { cx } from 'emotion';

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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').BodyProps, 'div'>} props
 */
export function useCardBody( props ) {
	const {
		className,
		scrollable = true,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardBody' );

	const classes = useMemo(
		() =>
			cx(
				styles.Body,
				styles.borderRadius,
				styles.cardPaddings[ size ],
				isShady && styles.shady,
				className
			),
		[ className, isShady, size ]
	);

	return {
		...otherProps,
		className: classes,
		scrollable,
		isShady,
		size,
	};
}
