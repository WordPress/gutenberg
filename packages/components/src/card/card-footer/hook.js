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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').FooterProps, 'div'>} props
 */
export function useCardFooter( props ) {
	const {
		className,
		justify,
		isBorderless = false,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardFooter' );

	const classes = useMemo(
		() =>
			cx(
				// This classname is added for legacy compatibility reasons.
				'components-card__footer',
				className
			),
		[ className ]
	);

	return {
		...otherProps,
		className: classes,
		justify,
		isBorderless,
		isShady,
		size,
	};
}
