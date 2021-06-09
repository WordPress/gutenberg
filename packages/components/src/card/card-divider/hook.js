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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../../divider').DividerProps, 'hr'>} props
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
				'components-card__divider',
				className
			),
		[ className ]
	);

	return {
		...otherProps,
		className: classes,
		children: null,
	};
}
