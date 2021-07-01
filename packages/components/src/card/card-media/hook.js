/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { cx } from '../../utils';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 */
export function useCardMedia( props ) {
	const { className, ...otherProps } = useContextSystem( props, 'CardMedia' );

	const classes = useMemo(
		() =>
			cx(
				// This classname is added for legacy compatibility reasons.
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
