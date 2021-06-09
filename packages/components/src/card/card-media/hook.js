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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').MediaProps, 'div'>} props
 */
export function useCardMedia( props ) {
	const { className, ...otherProps } = useContextSystem( props, 'CardMedia' );

	const classes = useMemo(
		() =>
			cx(
				styles.Media,
				styles.borderRadius,
				'components-card__media',
				className
			),
		[ className ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
