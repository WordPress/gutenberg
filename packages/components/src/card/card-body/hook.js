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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').BodyProps, 'div'>} props
 */
export function useCardBody( props ) {
	const {
		className,
		isScrollable = true,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardBody' );

	const classes = useMemo(
		() =>
			cx(
				// This classname is added for legacy compatibility reasons.
				'components-card__body',
				className
			),
		[ className, isShady, size ]
	);

	return {
		...otherProps,
		className: classes,
		isScrollable,
		isShady,
		size,
	};
}
